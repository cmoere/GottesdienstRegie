import {afterEach,describe,expect,it,vi} from 'vitest';
import type {BackgroundAudioConfig} from './store';
class Media extends EventTarget{
 src='';preload='';paused=true;ended=false;muted=false;volume=1;currentTime=0;duration=0;sink='';
 async setSinkId(id:string){this.sink=id}async play(){this.paused=false;this.dispatchEvent(new Event('play'))}pause(){this.paused=true}load(){}removeAttribute(){this.src=''}
}
afterEach(()=>{delete window.desktop;vi.useRealTimers();vi.unstubAllGlobals();vi.resetModules()});
describe('background engine integration',()=>{
 it('clears predecessor album and cover on a new radio title and rejects a former session',async()=>{
  vi.useFakeTimers();vi.stubGlobal('Audio',Media);
  let receive!:(value:any)=>void,session='';
  window.desktop={radio:{startMetadata:async(_id:string,_url:string,id:string)=>{session=id},stopMetadata:async()=>{},onMetadata:(callback:typeof receive)=>{receive=callback;return()=>{}}}} as any;
  const {backgroundAudioEngine:engine}=await import('./BackgroundAudioEngine');
  const config={tracks:[{assetId:'radio:one',name:'Station',url:'https://example.test/radio'}],volume:70,muted:false,shuffle:false,repeat:true,continueUntil:'stopCue',fadeInSeconds:0,fadeOutSeconds:0,crossfadeSeconds:0,ducking:{enabled:false,level:25,attackMs:0,releaseMs:0}} as any;
  await engine.start('pre',config);
  receive({stationId:'one',sessionId:session,title:'Lied A',artist:'Band',album:'Album A',imageUrl:'https://example.test/a.jpg'});
  expect(engine.getState().track?.imageUrl).toBe('https://example.test/a.jpg');
  receive({stationId:'one',sessionId:session,title:'Lied B',artist:'Band'});
  expect(engine.getState().track).toMatchObject({name:'Lied B',album:'',imageUrl:''});
  const former=session;await engine.stop(0);await engine.start('post',config);
  receive({stationId:'one',sessionId:former,title:'Lied A',artist:'Band',imageUrl:'https://example.test/a.jpg'});
  expect(engine.getState().track?.name).toBe('Station');
  await engine.stop(0);
 });
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

async function setupDucking(videoEnabled=false) {
 vi.useFakeTimers();const media:Media[]=[];
 vi.stubGlobal('Audio',class extends Media{constructor(){super();media.push(this)}});
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>window.setTimeout(()=>callback(performance.now()),16));
 const {backgroundAudioEngine:engine}=await import('./BackgroundAudioEngine');
 const config:BackgroundAudioConfig={tracks:[{assetId:'radio:one',name:'Radio',url:'https://example.test/radio'}],autoPlay:true,volume:70,muted:false,shuffle:false,repeat:true,continueUntil:'stopCue',fadeInSeconds:0,fadeOutSeconds:0,crossfadeSeconds:0,ducking:{enabled:videoEnabled,level:10,attackMs:0,releaseMs:0}};
 await engine.start('section:pre',config,'pre');
 return {engine,audio:media[0],config};
}

describe('announcement ducking in the real background engine',()=>{
 it('announcementWorksWithoutVideoDucking and restores the current base level',async()=>{
  const {engine,audio}=await setupDucking();
  const fade=engine.setAnnouncementDucking(20);
  await vi.advanceTimersByTimeAsync(400);await fade;
  expect(audio.volume).toBeCloseTo(.112);
  expect(engine.getState().volume).toBe(14);
  const release=engine.setAnnouncementDucking(null);
  await vi.advanceTimersByTimeAsync(950);await release;
  expect(audio.volume).toBeCloseTo(.56);
  await engine.stop(0);
 });

 it('videoClaimSurvivesAnnouncementEnd',async()=>{
  const {engine,audio}=await setupDucking(true);
  await engine.setDucked(true);
  const fade=engine.setAnnouncementDucking(20);
  await vi.advanceTimersByTimeAsync(400);await fade;
  expect(audio.volume).toBeCloseTo(.056);
  const release=engine.setAnnouncementDucking(null);
  await vi.advanceTimersByTimeAsync(950);await release;
  expect(audio.volume).toBeCloseTo(.056);
  await engine.setDucked(false);
  expect(audio.volume).toBeCloseTo(.56);
  await engine.stop(0);
 });

 it('ending video does not release the announcement claim',async()=>{
  const {engine,audio}=await setupDucking(true);
  const fade=engine.setAnnouncementDucking(20);
  await vi.advanceTimersByTimeAsync(400);await fade;
  await engine.setDucked(true);await engine.setDucked(false);
  expect(audio.volume).toBeCloseTo(.112);
  await engine.stop(0);
 });

 it('userMuteAndVolumeEditsSurvive an in-flight fade and release',async()=>{
  const {engine,audio}=await setupDucking();
  const fade=engine.setAnnouncementDucking(20);
  await vi.advanceTimersByTimeAsync(100);
  engine.setVolume(40);engine.setMuted(true);
  await vi.advanceTimersByTimeAsync(400);await fade;
  expect(audio.volume).toBeCloseTo(.064);expect(audio.muted).toBe(true);
  const release=engine.setAnnouncementDucking(null);
  await vi.advanceTimersByTimeAsync(100);engine.setVolume(50);
  await vi.advanceTimersByTimeAsync(1000);await release;
  expect(audio.volume).toBeCloseTo(.4);expect(audio.muted).toBe(true);
  expect(engine.getState().volume).toBe(50);
  await engine.stop(0);
 });

 it('radioPositionAndSourceUnchanged and new source retains an active claim',async()=>{
  const {engine,audio,config}=await setupDucking();
  audio.currentTime=42;
  const fade=engine.setAnnouncementDucking(20);
  await vi.advanceTimersByTimeAsync(400);await fade;
  expect(audio.currentTime).toBe(42);expect(audio.src).toBe('https://example.test/radio');
  expect(audio.paused).toBe(false);
  await engine.start('section:post',config,'post');
  expect(audio.volume).toBeCloseTo(.112);
  await engine.stop(0);
 });

 it.each([NaN,Infinity,-1,101])('rejects invalid percentage %s without changing audio',async value=>{
  const {engine,audio}=await setupDucking();
  await expect(engine.setAnnouncementDucking(value)).rejects.toThrow();
  expect(audio.volume).toBeCloseTo(.56);
  await engine.stop(0);
 });

 it.each([[150,.56],[-10,0]])('keeps legacy video level %s bounded rather than throwing in live playback',async(level,expected)=>{
  const {engine,audio,config}=await setupDucking(true);
  await engine.start('legacy',{...config,ducking:{...config.ducking,level}},'pre');
  await engine.setDucked(true);
  expect(audio.volume).toBeCloseTo(expected);
  await engine.stop(0);
 });

 it('a route level and mute change supersedes the in-flight announcement fade',async()=>{
  const {engine,audio}=await setupDucking();
  const {usePreferences}=await import('./preferences');
  const original=usePreferences.getState().audioRouting;
  try {
   const fade=engine.setAnnouncementDucking(20);
   await vi.advanceTimersByTimeAsync(100);
   usePreferences.setState({audioRouting:{...original,background:{...original.background,volume:50,muted:true}}});
   await vi.advanceTimersByTimeAsync(400);await fade;
   expect(audio.volume).toBeCloseTo(.07);expect(audio.muted).toBe(true);
  } finally { await engine.stop(0);usePreferences.setState({audioRouting:original}); }
 });

 it.each(['theme','identical routing'])('preserves an ordinary five-second stop fade after %s changes',async kind=>{
  const {engine,audio}=await setupDucking();
  const {usePreferences}=await import('./preferences');
  const {theme,audioRouting}=usePreferences.getState();
  try {
   const stopping=engine.stop(5);
   await vi.advanceTimersByTimeAsync(1000);
   if(kind==='theme')usePreferences.setState({theme:theme==='dark'?'light':'dark'});
   else usePreferences.setState({audioRouting:{...audioRouting,background:{...audioRouting.background}}});
   await vi.advanceTimersByTimeAsync(100);
   expect(audio.src).toBe('https://example.test/radio');
   expect(audio.paused).toBe(false);
   expect(audio.volume).toBeLessThan(.45);
   await vi.advanceTimersByTimeAsync(4000);await stopping;
   expect(audio.src).toBe('');expect(audio.paused).toBe(true);
  } finally {await engine.stop(0);usePreferences.setState({theme,audioRouting});}
 });
});
