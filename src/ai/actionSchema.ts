export class AiActionValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'AiActionValidationError'; }
}

export type AiAction =
  | { kind: 'createItem'; tempId: string; itemType: 'content' | 'song' | 'bible'; title: string; sectionId: string }
  | { kind: 'createSlide'; itemId: string; tempId: string; title: string; text: string }
  | { kind: 'replaceSlideText'; slideId: string; text: string }
  | { kind: 'updateTiming'; itemId: string; durationSeconds: number }
  | { kind: 'reorderItem'; itemId: string; afterItemId?: string }
  | { kind: 'prepareTranslation'; slideIds: string[]; targetLanguage: string }
  | { kind: 'suggestMedia'; query: string; mediaIds: string[] }
  | { kind: 'requestBiblePassage'; reference: string; translationId: string }
  | { kind: 'report'; title: string; text: string };

export interface AiActionPlan { id: string; baseRevision: number; summary: string; actions: AiAction[] }
export interface AiAssistantResponse { message: string; plan?: AiActionPlan }

const MAX_TEXT = 5000;
const specs: Record<AiAction['kind'], readonly string[]> = {
  createItem: ['kind', 'tempId', 'itemType', 'title', 'sectionId'],
  createSlide: ['kind', 'itemId', 'tempId', 'title', 'text'],
  replaceSlideText: ['kind', 'slideId', 'text'],
  updateTiming: ['kind', 'itemId', 'durationSeconds'],
  reorderItem: ['kind', 'itemId', 'afterItemId'],
  prepareTranslation: ['kind', 'slideIds', 'targetLanguage'],
  suggestMedia: ['kind', 'query', 'mediaIds'],
  requestBiblePassage: ['kind', 'reference', 'translationId'],
  report: ['kind', 'title', 'text'],
};

const object = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AiActionValidationError(`${label} muss ein Objekt sein.`);
  return value as Record<string, unknown>;
};
const strict = (value: Record<string, unknown>, allowed: readonly string[], label: string) => {
  const extra = Object.keys(value).find(key => !allowed.includes(key));
  if (extra) throw new AiActionValidationError(`${label} enthält das unbekannte Feld „${extra}“.`);
};
const text = (value: unknown, label: string) => {
  if (typeof value !== 'string' || !value.trim()) throw new AiActionValidationError(`${label} muss Text enthalten.`);
  if (value.length > MAX_TEXT) throw new AiActionValidationError(`${label} darf höchstens 5.000 Zeichen enthalten.`);
  if (/<\/?(?:script|iframe|object|embed|html|svg)\b|javascript:/i.test(value)) throw new AiActionValidationError(`${label} enthält nicht erlaubten ausführbaren Inhalt.`);
  return value;
};
const stringArray = (value: unknown, label: string) => {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) throw new AiActionValidationError(`${label} muss eine Textliste sein.`);
  return value as string[];
};

function parseAction(value: unknown): AiAction {
  const source = object(value, 'Aktion');
  const kind = source.kind;
  if (typeof kind !== 'string' || !(kind in specs)) throw new AiActionValidationError(`Aktion „${String(kind)}“ ist nicht erlaubt.`);
  strict(source, specs[kind as AiAction['kind']], `Aktion ${kind}`);
  switch (kind) {
    case 'createItem': {
      const itemType = text(source.itemType, 'Elementtyp');
      if (!['content', 'song', 'bible'].includes(itemType)) throw new AiActionValidationError('Elementtyp ist nicht erlaubt.');
      return { kind, tempId: text(source.tempId, 'Temporäre ID'), itemType: itemType as 'content' | 'song' | 'bible', title: text(source.title, 'Titel'), sectionId: text(source.sectionId, 'Bereich') };
    }
    case 'createSlide': return { kind, itemId: text(source.itemId, 'Element-ID'), tempId: text(source.tempId, 'Temporäre ID'), title: text(source.title, 'Titel'), text: text(source.text, 'Folientext') };
    case 'replaceSlideText': return { kind, slideId: text(source.slideId, 'Folien-ID'), text: text(source.text, 'Folientext') };
    case 'updateTiming': {
      if (typeof source.durationSeconds !== 'number' || source.durationSeconds <= 0 || source.durationSeconds > 3600) throw new AiActionValidationError('Dauer ist ungültig.');
      return { kind, itemId: text(source.itemId, 'Element-ID'), durationSeconds: source.durationSeconds };
    }
    case 'reorderItem': return { kind, itemId: text(source.itemId, 'Element-ID'), ...(source.afterItemId === undefined ? {} : { afterItemId: text(source.afterItemId, 'Ziel-ID') }) };
    case 'prepareTranslation': return { kind, slideIds: stringArray(source.slideIds, 'Folien-IDs'), targetLanguage: text(source.targetLanguage, 'Zielsprache') };
    case 'suggestMedia': return { kind, query: text(source.query, 'Mediensuche'), mediaIds: stringArray(source.mediaIds, 'Medien-IDs') };
    case 'requestBiblePassage': return { kind, reference: text(source.reference, 'Bibelstelle'), translationId: text(source.translationId, 'Bibelübersetzung') };
    case 'report': return { kind, title: text(source.title, 'Berichtstitel'), text: text(source.text, 'Bericht') };
    default: throw new AiActionValidationError('Unbekannte Aktion.');
  }
}

export function parseAiAssistantResponse(value: unknown): AiAssistantResponse {
  const source = object(value, 'Antwort');
  strict(source, ['message', 'plan'], 'Antwort');
  const message = text(source.message, 'Antworttext');
  if (source.plan === undefined) return { message };
  const plan = object(source.plan, 'Aktionsplan');
  strict(plan, ['id', 'baseRevision', 'summary', 'actions'], 'Aktionsplan');
  if (!Number.isInteger(plan.baseRevision) || Number(plan.baseRevision) < 0) throw new AiActionValidationError('Basisrevision ist ungültig.');
  if (!Array.isArray(plan.actions)) throw new AiActionValidationError('Aktionen müssen eine Liste sein.');
  if (plan.actions.length > 50) throw new AiActionValidationError('Ein Aktionsplan darf höchstens 50 Aktionen enthalten.');
  const actions = plan.actions.map(parseAction);
  if (actions.filter(action => action.kind === 'createSlide').length > 20) throw new AiActionValidationError('Ein Aktionsplan darf höchstens 20 Folien erstellen.');
  return { message, plan: { id: text(plan.id, 'Plan-ID'), baseRevision: Number(plan.baseRevision), summary: text(plan.summary, 'Zusammenfassung'), actions } };
}
