import type { AiActionPlan } from './actionSchema';

const groupLabel: Record<string, string> = { createItem: 'Erstellen', createSlide: 'Erstellen', replaceSlideText: 'Ändern', updateTiming: 'Ändern', reorderItem: 'Verschieben', prepareTranslation: 'Übersetzen', suggestMedia: 'Medien', requestBiblePassage: 'Bibelstelle', report: 'Prüfung' };
export function AiChangePreview({ plan }: { plan: AiActionPlan }) {
  const groups = plan.actions.reduce<Record<string, number>>((result, action) => { const label = groupLabel[action.kind] ?? 'Weitere'; result[label] = (result[label] ?? 0) + 1; return result; }, {});
  return <section className="ai-change-preview" aria-label="Änderungsvorschau"><b>{plan.summary}</b>{Object.entries(groups).map(([label, count]) => <div key={label}><strong>{label}</strong><span>{count}</span></div>)}</section>;
}
