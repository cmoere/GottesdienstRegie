import { describe, expect, it } from 'vitest';
import { AI_MODEL_MANIFEST } from './modelManifest';

describe('AI_MODEL_MANIFEST', () => {
  it('pins all three local Apache-2.0 profiles to immutable revisions and hashes', () => {
    expect(Object.keys(AI_MODEL_MANIFEST.profiles)).toEqual(['eco', 'balanced', 'quality']);
    expect(AI_MODEL_MANIFEST.profiles.eco.repository).toBe('onnx-community/Qwen2.5-0.5B-Instruct');
    expect(AI_MODEL_MANIFEST.profiles.balanced.revision).toHaveLength(40);
    for (const profile of Object.values(AI_MODEL_MANIFEST.profiles)) {
      expect(profile.license).toBe('Apache-2.0');
      expect(profile.assets.length).toBeGreaterThan(0);
      expect(profile.assets.every(asset => /^[a-f0-9]{64}$/.test(asset.sha256) && asset.bytes > 0)).toBe(true);
    }
  });
});
