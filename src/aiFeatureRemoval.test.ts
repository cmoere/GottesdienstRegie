import { describe, expect, it } from 'vitest';
import { APP_FEATURES } from './appFeatures';
import { migratePreferencesForV63 } from './preferences';

describe('version 63 general AI assistant removal', () => {
  it('keeps media generation while the general assistant is unavailable', () => {
    expect(APP_FEATURES).toMatchObject({
      generalAiAssistant: false,
      mediaGeneration: true,
      translationModels: true,
    });
  });

  it('drops persisted assistant preferences without disturbing other settings', () => {
    expect(migratePreferencesForV63({
      language: 'en',
      aiAssistant: { executionMode: 'direct' },
      operatorSoundsEnabled: false,
    })).toEqual(expect.objectContaining({
      language: 'en',
      operatorSoundsEnabled: false,
    }));
    expect(migratePreferencesForV63({ aiAssistant: { executionMode: 'direct' } })).not.toHaveProperty('aiAssistant');
  });
});
