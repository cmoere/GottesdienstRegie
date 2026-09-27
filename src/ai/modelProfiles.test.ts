import { describe, expect, it } from 'vitest';
import { migratePreferencesForV60 } from '../preferences';
import { selectAiModelProfile } from './modelProfiles';

describe('selectAiModelProfile', () => {
  it('keeps a low-memory CPU-only device on the eco profile', () => {
    expect(selectAiModelProfile({ memoryGb: 4, logicalCores: 2, freeStorageGb: 3, acceleration: 'none' }, 'auto')).toBe('eco');
  });

  it('selects balanced for an ordinary supported device', () => {
    expect(selectAiModelProfile({ memoryGb: 8, logicalCores: 4, freeStorageGb: 6, acceleration: 'webgpu' }, 'auto')).toBe('balanced');
  });

  it('selects quality only for capable accelerated hardware', () => {
    expect(selectAiModelProfile({ memoryGb: 16, logicalCores: 8, freeStorageGb: 10, acceleration: 'gpu' }, 'auto')).toBe('quality');
  });

  it('honors an explicit manual profile', () => {
    expect(selectAiModelProfile({ memoryGb: 2, logicalCores: 1, freeStorageGb: 1, acceleration: 'none' }, 'quality')).toBe('quality');
  });
});

describe('migratePreferencesForV60', () => {
  it('adds privacy-safe assistant defaults to older preferences', () => {
    const migrated = migratePreferencesForV60({ language: 'en' });
    expect(migrated.language).toBe('en');
    expect(migrated.aiAssistant).toEqual({
      modelPreference: 'auto',
      executionMode: 'confirm',
      allowMediaSuggestions: true,
      allowTranslations: true,
      includePresentationContext: true,
      clearHistoryOnClose: false,
    });
  });

  it('preserves explicitly configured assistant values', () => {
    const migrated = migratePreferencesForV60({ aiAssistant: { modelPreference: 'eco', allowMediaSuggestions: false } });
    expect(migrated.aiAssistant.modelPreference).toBe('eco');
    expect(migrated.aiAssistant.allowMediaSuggestions).toBe(false);
    expect(migrated.aiAssistant.executionMode).toBe('confirm');
  });
});
