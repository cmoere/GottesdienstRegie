import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceItem, usePresentation, presentationDocument, type PresentationDocument } from '../store';
import type { AiActionPlan } from './actionSchema';
import { applyAiActionPlanToDocument } from './actionExecutor';

const plan = (actions: AiActionPlan['actions'], baseRevision = 0): AiActionPlan => ({ id: 'plan-1', baseRevision, summary: 'Änderungen', actions });

describe('applyAiActionPlanToDocument', () => {
  let document: PresentationDocument;
  beforeEach(() => {
    const fresh = usePresentation.getState().newDocument('AI test');
    fresh.items = [createServiceItem('content', { title: 'Welcome', body: 'Original' })];
    fresh.selectedItemId = fresh.items[0].id;
    fresh.selectedSlideId = fresh.items[0].slides[0].id;
    usePresentation.getState().loadDocument(fresh);
    document = presentationDocument(usePresentation.getState());
  });

  it('rejects a stale plan without changing the document', () => {
    const before = structuredClone(document);
    const result = applyAiActionPlanToDocument(document, plan([{ kind: 'report', title: 'x', text: 'x' }], 2), 3);
    expect(result).toEqual({ ok: false, code: 'stale-plan' });
    expect(document).toEqual(before);
  });

  it('rejects invalid target IDs without partial changes', () => {
    const slide = document.items[0].slides[0];
    const before = structuredClone(document);
    const result = applyAiActionPlanToDocument(document, plan([
      { kind: 'replaceSlideText', slideId: slide.id, text: 'changed' },
      { kind: 'updateTiming', itemId: 'missing', durationSeconds: 12 },
    ]), 0);
    expect(result.ok).toBe(false);
    expect(document).toEqual(before);
  });

  it('uses only the trusted Bible resolver text', () => {
    const result = applyAiActionPlanToDocument(document, plan([
      { kind: 'requestBiblePassage', reference: 'Johannes 3,16', translationId: 'LUT' },
    ]), 0, { resolveBible: () => 'Denn also hat Gott die Welt geliebt.' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.stringify(result.document)).toContain('Denn also hat Gott die Welt geliebt.');
  });

  it('applies a multi-action store plan as one undoable AI transaction', () => {
    const state = usePresentation.getState();
    const item = state.items[0];
    const slide = item.slides[0];
    const originalText = slide.body;
    const historyLength = state.history.length;
    const result = state.applyAiPlan(plan([
      { kind: 'replaceSlideText', slideId: slide.id, text: 'AI text' },
      { kind: 'updateTiming', itemId: item.id, durationSeconds: 22 },
    ]), 0);
    expect(result.ok).toBe(true);
    expect(usePresentation.getState().history).toHaveLength(historyLength + 1);
    expect(usePresentation.getState().editHistory.at(-1)?.source).toBe('ai');
    usePresentation.getState().undo();
    expect(usePresentation.getState().items[0].slides[0].body).toBe(originalText);
  });
});
