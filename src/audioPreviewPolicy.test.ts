import {describe,expect,it} from 'vitest';
import {shouldSyncBackgroundAudio} from './audioPreviewPolicy';
import {migratePreferencesForV44} from './preferences';

describe('background audio preview policy',()=>{
  it('plays on air regardless of the preview preference',()=>expect(shouldSyncBackgroundAudio({onAir:true,mode:'preview',playInPreview:false})).toBe(true));
  it('only automatically plays off air when preview playback is enabled',()=>{
    expect(shouldSyncBackgroundAudio({onAir:false,mode:'preview',playInPreview:true})).toBe(true);
    expect(shouldSyncBackgroundAudio({onAir:false,mode:'preview',playInPreview:false})).toBe(false);
    expect(shouldSyncBackgroundAudio({onAir:false,mode:'edit',playInPreview:true})).toBe(false);
  });
  it('defaults migrated installations to preview playback but preserves an explicit opt-out',()=>{
    expect(migratePreferencesForV44({}).playAudioInPreview).toBe(true);
    expect(migratePreferencesForV44({playAudioInPreview:false}).playAudioInPreview).toBe(false);
  });
});
