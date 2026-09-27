import type { PresentationDocument, ServiceItem, Slide } from '../store';
import type { AiActionPlan } from './actionSchema';

export type AiApplyResult = { ok: true; document: PresentationDocument } | { ok: false; code: 'stale-plan' | 'invalid-target' | 'provider-required'; detail?: string };
export interface AiActionDependencies { resolveBible?: (reference: string, translationId: string) => string }

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function createdItem(tempId: string, title: string, sectionId: string, itemType: 'content' | 'song' | 'bible'): ServiceItem {
  const stamp = now();
  return { id: tempId, type: itemType, title, section: sectionId, sectionId, order: 0, enabled: true, plannedDuration: 0, metadata: {}, slides: [], autoAdvance: false, repeat: false, timing: { mode: 'manual', slideDurationSeconds: 7, autoAdvance: false, repeat: false, shuffle: false, mediaDurationSeconds: 0, totalDurationSeconds: 0 }, notes: '', stageDirection: '', createdAt: stamp, updatedAt: stamp };
}

function createdSlide(itemId: string, slideId: string, title: string, body: string): Slide {
  return { id: slideId, itemId, order: 0, enabled: true, title, body, background: '#3b4652', elements: [], transition: 'fade', transitionDuration: 500, notes: '', timing: {} };
}

export function validateAiPlanAgainstDocument(plan: AiActionPlan, document: PresentationDocument, dependencies: AiActionDependencies = {}): AiApplyResult {
  return applyAiActionPlanToDocument(document, plan, plan.baseRevision, dependencies);
}

export function applyAiActionPlanToDocument(document: PresentationDocument, plan: AiActionPlan, currentRevision: number, dependencies: AiActionDependencies = {}): AiApplyResult {
  if (plan.baseRevision !== currentRevision) return { ok: false, code: 'stale-plan' };
  const next = structuredClone(document);
  const temporaryIds = new Map<string, string>();
  const resolveId = (value: string) => temporaryIds.get(value) ?? value;
  const findItem = (value: string) => next.items.find(item => item.id === resolveId(value));
  const findSlide = (value: string) => next.items.flatMap(item => item.slides).find(slide => slide.id === resolveId(value));

  for (const action of plan.actions) {
    if (action.kind === 'createItem') {
      const actualId = id(); temporaryIds.set(action.tempId, actualId);
      next.items.push({ ...createdItem(actualId, action.title, action.sectionId, action.itemType), order: next.items.length });
    } else if (action.kind === 'createSlide') {
      const item = findItem(action.itemId); if (!item) return { ok: false, code: 'invalid-target', detail: action.itemId };
      const actualId = id(); temporaryIds.set(action.tempId, actualId);
      item.slides.push({ ...createdSlide(item.id, actualId, action.title, action.text), order: item.slides.length });
    } else if (action.kind === 'replaceSlideText') {
      const slide = findSlide(action.slideId); if (!slide) return { ok: false, code: 'invalid-target', detail: action.slideId };
      slide.body = action.text;
      slide.elements = slide.elements.map((element, index) => index === 0 && element.type === 'text' ? { ...element, properties: { ...element.properties, text: action.text } } : element);
    } else if (action.kind === 'updateTiming') {
      const item = findItem(action.itemId); if (!item) return { ok: false, code: 'invalid-target', detail: action.itemId };
      item.plannedDuration = action.durationSeconds;
      item.timing = { ...item.timing, slideDurationSeconds: action.durationSeconds, totalDurationSeconds: action.durationSeconds };
    } else if (action.kind === 'reorderItem') {
      const from = next.items.findIndex(item => item.id === resolveId(action.itemId));
      if (from < 0) return { ok: false, code: 'invalid-target', detail: action.itemId };
      const [moving] = next.items.splice(from, 1);
      const after = action.afterItemId ? next.items.findIndex(item => item.id === resolveId(action.afterItemId!)) : -1;
      if (action.afterItemId && after < 0) return { ok: false, code: 'invalid-target', detail: action.afterItemId };
      next.items.splice(after + 1, 0, moving);
      next.items = next.items.map((item, order) => ({ ...item, order }));
    } else if (action.kind === 'prepareTranslation') {
      if (action.slideIds.some(slideId => !findSlide(slideId))) return { ok: false, code: 'invalid-target' };
    } else if (action.kind === 'requestBiblePassage') {
      if (!dependencies.resolveBible) return { ok: false, code: 'provider-required' };
      const body = dependencies.resolveBible(action.reference, action.translationId);
      const itemId = id();
      next.items.push({ ...createdItem(itemId, action.reference, 'service', 'bible'), order: next.items.length, metadata: { reference: action.reference, translationId: action.translationId }, slides: [createdSlide(itemId, id(), action.reference, body)] });
    }
  }
  next.updatedAt = now();
  return { ok: true, document: next };
}
