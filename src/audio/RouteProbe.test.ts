import {describe,it,expect,vi,afterEach} from 'vitest';
import {startRouteProbe} from './RouteProbe';
import {defaultAudioRouting} from '../audioRouting';
describe('isolated cancellable route probe',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 function fixture(){
  const oscillator={frequency:{value:0},connect:vi.fn(),start:vi.fn(),stop:vi.fn(),disconnect:vi.fn()},gain={gain:{value:0},connect:vi.fn(),disconnect:vi.fn()},analyser={fftSize:32,getFloatTimeDomainData:(data:Float32Array)=>data.fill(.5),disconnect:vi.fn()},track={stop:vi.fn()};
  const destination={stream:{getTracks:()=>[track]},disconnect:vi.fn()},context={state:'suspended',resume:vi.fn(async()=>{context.state='running'}),close:vi.fn(async()=>{}),createOscillator:()=>oscillator,createGain:()=>gain,createAnalyser:()=>analyser,createMediaStreamDestination:()=>destination};
  const audio={srcObject:null as unknown,volume:0,muted:false,play:vi.fn(async()=>{}),pause:vi.fn(),setSinkId:vi.fn(async()=>{})};
  vi.stubGlobal('AudioContext',class{constructor(){return context}});vi.stubGlobal('Audio',class{constructor(){return audio}});
  return{context,audio,oscillator,track};
 }
 it('resumes the context, follows the route and stops only its own resources',async()=>{
  const f=fixture(),abort=new AbortController(),probe=await startRouteProbe(defaultAudioRouting,'background',abort.signal);
  expect(f.context.resume).toHaveBeenCalledOnce();expect(f.oscillator.start).toHaveBeenCalledOnce();expect(probe.sample()).toBeGreaterThan(0);
  abort.abort();probe.stop();expect(f.audio.pause).toHaveBeenCalledOnce();expect(f.context.close).toHaveBeenCalledOnce();expect(f.track.stop).toHaveBeenCalledOnce();expect(probe.sample()).toBe(0);
 });
 it('cleans up when cancellation occurs while play is pending',async()=>{
  const f=fixture(),abort=new AbortController();let finish!:()=>void;f.audio.play.mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve}));
  const pending=startRouteProbe(defaultAudioRouting,'background',abort.signal);
  for(let i=0;i<8&&!finish;i++)await Promise.resolve();abort.abort();finish();
  await expect(pending).rejects.toThrow();expect(f.oscillator.start).not.toHaveBeenCalled();expect(f.context.close).toHaveBeenCalledOnce();
 });
});
