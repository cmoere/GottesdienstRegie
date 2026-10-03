import {afterEach,describe,expect,it,vi} from 'vitest';
class Media extends EventTarget{
 src='';preload='';paused=true;ended=false;muted=false;volume=1;currentTime=0;duration=0;sink='';
 async setSinkId(id:string){this.sink=id}async play(){this.paused=false;this.dispatchEvent(new Event('play'))}pause(){this.paused=true}load(){}removeAttribute(){this.src=''}
}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.resetModules()});
describe('background engine integration',()=>{
 it('keeps continuing radio connected between sections and reports real progress',async()=>{
  vi.useFakeTimers();const media:Media[]=[];
  vi.stubGlobal('Audio',class extends Media{constructor(){super();media.push(this)}});
  const {backgroundAudioEngine:engine}=await import('./BackgroundAudioEngine');
  const config={tracks:[{assetId:'radio:one',name:'Radio',url:'https://example.test/radio'}],volume:70,muted:false,shuffle:false,repeat:true,continueUntil:'stopCue',fadeInSeconds:0,fadeOutSeconds:0,crossfadeSeconds:0,ducking:{enabled:false,level:25,attackMs:0,releaseMs:0}} as any;
  await engine.start('section:pre',config,'pre');expect(engine.getHealth()?.status).toBe('connecting');
  media[0].currentTime=1;await vi.advanceTimersByTimeAsync(500);expect(engine.getHealth()?.status).toBe('playing');
  await engine.sync({id:'item'} as any,{id:'service'} as any);
  expect(media[0].src).toBe('https://example.test/radio');expect(media[0].muted).toBe(false);expect(media[0].volume).toBeCloseTo(.56);
  await engine.stop(0);
 });
});
