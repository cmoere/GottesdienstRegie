import { describe, expect, it } from 'vitest';
import { AiActionValidationError, parseAiAssistantResponse } from './actionSchema';

describe('parseAiAssistantResponse', () => {
  it('accepts a plain answer without an action plan', () => {
    expect(parseAiAssistantResponse({ message: 'Die Folie ist gut lesbar.' })).toEqual({ message: 'Die Folie ist gut lesbar.' });
  });

  it('accepts every supported action kind', () => {
    const actions = [
      { kind: 'createItem', tempId: 'new-1', itemType: 'content', title: 'Begrüßung', sectionId: 'service' },
      { kind: 'createSlide', itemId: 'new-1', tempId: 'slide-1', title: 'Willkommen', text: 'Schön, dass du da bist.' },
      { kind: 'replaceSlideText', slideId: 's1', text: 'Kürzerer Text' },
      { kind: 'updateTiming', itemId: 'i1', durationSeconds: 15 },
      { kind: 'reorderItem', itemId: 'i1', afterItemId: 'i2' },
      { kind: 'prepareTranslation', slideIds: ['s1'], targetLanguage: 'en' },
      { kind: 'suggestMedia', query: 'sunrise', mediaIds: ['m1'] },
      { kind: 'requestBiblePassage', reference: 'Johannes 3,16', translationId: 'LUT' },
      { kind: 'report', title: 'Prüfung', text: 'Keine kritischen Probleme.' },
    ];
    const result = parseAiAssistantResponse({ message: 'Vorschlag', plan: { id: 'p1', baseRevision: 4, summary: 'Neun Änderungen', actions } });
    expect(result.plan?.actions).toHaveLength(9);
  });

  it.each([
    { message: 'x', extra: true },
    { message: 'x', plan: { id: 'p', baseRevision: 1, summary: 'x', actions: [{ kind: 'setOnAir', value: true }] } },
    { message: 'x', plan: { id: 'p', baseRevision: 1, summary: 'x', actions: [{ kind: 'publish' }] } },
    { message: 'x', plan: { id: 'p', baseRevision: 1, summary: 'x', actions: [{ kind: 'deleteFile', path: 'a' }] } },
    { message: '<script>alert(1)</script>' },
    { message: 'x', plan: { id: 'p', baseRevision: 1, summary: 'x', actions: [{ kind: 'requestBiblePassage', reference: 'Joh 3,16', translationId: 'LUT', text: 'invented' }] } },
  ])('rejects unknown, forbidden, executable, or model-supplied Bible data', value => {
    expect(() => parseAiAssistantResponse(value)).toThrow(AiActionValidationError);
  });

  it('enforces plan and generated-text limits', () => {
    const tooMany = Array.from({ length: 51 }, (_, index) => ({ kind: 'report', title: `R${index}`, text: 'x' }));
    expect(() => parseAiAssistantResponse({ message: 'x', plan: { id: 'p', baseRevision: 1, summary: 'x', actions: tooMany } })).toThrow(/50/);
    expect(() => parseAiAssistantResponse({ message: 'x'.repeat(5001) })).toThrow(/5.000/);
    const tooManySlides = Array.from({ length: 21 }, (_, index) => ({ kind: 'createSlide', itemId: 'i1', tempId: `s${index}`, title: 'x', text: 'x' }));
    expect(() => parseAiAssistantResponse({ message: 'x', plan: { id: 'p', baseRevision: 1, summary: 'x', actions: tooManySlides } })).toThrow(/20/);
  });
});
