import {describe,expect,it,vi} from 'vitest';
import {migratePreferencesForV61} from './preferences';
import {playOperatorTone} from './operatorSounds';
import {defaultAudioRouting} from './audioRouting';

describe('operator sounds',()=>{
  it('migrates existing settings with sounds enabled',()=>expect(migratePreferencesForV61({language:'de'}).operatorSoundsEnabled).toBe(true));
  it('preserves an explicit disabled preference',()=>expect(migratePreferencesForV61({operatorSoundsEnabled:false}).operatorSoundsEnabled).toBe(false));
  it('does not create or route a tone when disabled',async()=>{
    const play=vi.fn().mockResolvedValue(true);
    expect(await playOperatorTone(false,defaultAudioRouting,'notification',play)).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });
  it('leaves non-operator routes available to their normal player',async()=>{
    const play=vi.fn().mockResolvedValue(true);
    expect(await playOperatorTone(true,defaultAudioRouting,'soundEffects',play)).toBe(true);
    expect(play).toHaveBeenCalledOnce();
  });
});
