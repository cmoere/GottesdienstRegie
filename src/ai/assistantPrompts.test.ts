import { describe, expect, it } from 'vitest';
import { AI_QUICK_ACTIONS, buildAssistantPrompt } from './assistantPrompts';

describe('assistant prompts', () => {
  it('offers the complete V60 quick-action set', () => {
    expect(AI_QUICK_ACTIONS.map(item => item.id)).toEqual(expect.arrayContaining(['service-plan','rewrite','announcements','bible-song','audit','translate','media','headings','moderation','prayers','unify-style']));
  });

  it('includes scope, language, contract, and disabled permissions', () => {
    const prompt = buildAssistantPrompt('media', { scope: 'selected-slide', language: 'de', allowMediaSuggestions: false, allowTranslations: false });
    expect(prompt).toMatch(/ausgewählte Folie/i);
    expect(prompt).toMatch(/Deutsch/);
    expect(prompt).toMatch(/JSON/);
    expect(prompt).toMatch(/Medienvorschläge sind deaktiviert/);
  });
});
