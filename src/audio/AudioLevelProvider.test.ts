import {describe,expect,it,vi} from 'vitest';
import {AudioLevelProvider} from './AudioLevelProvider';

describe('AudioLevelProvider',()=>{
  it('uses captured analyser data without rerouting the audible media',async()=>{
    const analyser={fftSize:0,frequencyBinCount:4,getByteFrequencyData:(data:Uint8Array)=>data.set([0,64,128,255]),connect:vi.fn()};
    const source={connect:vi.fn(),disconnect:vi.fn()};
    const context={state:'running',createAnalyser:()=>analyser,createMediaStreamSource:()=>source,createMediaElementSource:vi.fn(),destination:{},close:vi.fn().mockResolvedValue(undefined)};
    const provider=new AudioLevelProvider(()=>context as any,()=>false);
    await provider.connect({captureStream:()=>({getAudioTracks:()=>[{}]})} as any);
    expect(provider.mode).toBe('analyser');
    expect(provider.levels()).toEqual([0,.25,.5,1]);
    expect(context.createMediaElementSource).not.toHaveBeenCalled();expect(analyser.connect).not.toHaveBeenCalled();
    expect(provider.getSignalState()).toBe('present');
    provider.disconnect();expect(source.disconnect).toHaveBeenCalled();
  });
  it('falls back without affecting playback when CORS/security blocks analysis',()=>{
    const provider=new AudioLevelProvider(()=>({createAnalyser:()=>({}),createMediaElementSource:()=>{throw new DOMException('blocked','SecurityError')}} as any),()=>false);
    expect(()=>provider.connect({} as HTMLMediaElement)).not.toThrow();
    expect(provider.mode).toBe('fallback');
    expect(provider.levels()).toEqual([0,0,0,0]);
    expect(provider.getSignalState()).toBe('unavailable');
  });
  it('stays static for reduced motion and becomes idle after disconnect',()=>{
    const provider=new AudioLevelProvider(()=>{throw new Error('no audio')},()=>true);
    provider.connect({} as HTMLMediaElement);const first=provider.levels();
    expect(provider.levels()).toEqual(first);
    provider.disconnect();expect(provider.mode).toBe('idle');expect(provider.levels()).toEqual([0,0,0,0]);
  });
  it('resumes suspended analysis and closes it on disconnect',async()=>{
    const context={state:'suspended',resume:vi.fn(async()=>{context.state='running'}),close:vi.fn().mockResolvedValue(undefined),createAnalyser:()=>({fftSize:0,frequencyBinCount:4,disconnect(){}}),createMediaStreamSource:()=>({connect(){},disconnect(){}})};
    const provider=new AudioLevelProvider(()=>context as any,()=>false);
    await provider.connect({captureStream:()=>({getAudioTracks:()=>[{}]})} as any);
    expect(provider.getContextState()).toBe('running');expect(context.resume).toHaveBeenCalled();
    provider.disconnect();expect(context.close).toHaveBeenCalled();expect(provider.mode).toBe('idle');
  });
});
