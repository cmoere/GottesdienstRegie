import {describe,expect,it,vi} from 'vitest';
import {AudioLevelProvider} from './AudioLevelProvider';

describe('AudioLevelProvider',()=>{
  it('uses analyser data when the media source can be connected',()=>{
    const analyser={fftSize:0,frequencyBinCount:4,getByteFrequencyData:(data:Uint8Array)=>data.set([0,64,128,255]),connect:vi.fn()};
    const source={connect:vi.fn()};
    const context={createAnalyser:()=>analyser,createMediaElementSource:()=>source,destination:{},close:vi.fn()};
    const provider=new AudioLevelProvider(()=>context as any,()=>false);
    provider.connect({} as HTMLMediaElement);
    expect(provider.mode).toBe('analyser');
    expect(provider.levels()).toEqual([0,.25,.5,1]);
  });
  it('falls back without affecting playback when CORS/security blocks analysis',()=>{
    const provider=new AudioLevelProvider(()=>({createAnalyser:()=>({}),createMediaElementSource:()=>{throw new DOMException('blocked','SecurityError')}} as any),()=>false);
    expect(()=>provider.connect({} as HTMLMediaElement)).not.toThrow();
    expect(provider.mode).toBe('fallback');
    expect(provider.levels().some(value=>value>0)).toBe(true);
  });
  it('stays static for reduced motion and becomes idle after disconnect',()=>{
    const provider=new AudioLevelProvider(()=>{throw new Error('no audio')},()=>true);
    provider.connect({} as HTMLMediaElement);const first=provider.levels();
    expect(provider.levels()).toEqual(first);
    provider.disconnect();expect(provider.mode).toBe('idle');expect(provider.levels()).toEqual([0,0,0,0]);
  });
});
