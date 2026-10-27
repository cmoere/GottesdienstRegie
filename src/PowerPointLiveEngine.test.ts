import {afterEach,expect,it,vi} from 'vitest';
import {LiveEngine} from './LiveEngine';
import {createServiceItem,usePresentation} from './store';
import {useLiveOutputPreview} from './liveOutputPreview';
import {usePowerPointStatus} from './powerPointLiveModel';
const saved=usePresentation.getState(),engines=new Set<LiveEngine>();
function createEngine(){const engine=new LiveEngine();engines.add(engine);return engine}
afterEach(async()=>{for(const engine of engines)await engine.stop();engines.clear();usePresentation.setState(saved,true);useLiveOutputPreview.setState({slide:null});delete window.desktop});
const take={sessionId:'a'.repeat(32),generation:'b'.repeat(32),sourceHash:'c'.repeat(64),slideId:256,slideIndex:1,clickIndex:0,clickCount:2,phase:'paused' as const};
function fixture(){const item=createServiceItem('content');item.metadata={...item.metadata,importMode:'original',powerPointSourceHash:take.sourceHash};item.slides[0].sourceSlideId='256';usePresentation.setState({items:[item]});return item}
it('starts original playback with a safe preparation frame and commits pixels only after the native take',async()=>{
 const item=fixture(),calls:any[]=[],engine=createEngine();let ready!:(value:typeof take)=>void;
 const command=vi.fn(async()=>({...take,phase:'playing'}));
 window.desktop={goOnAir:async(_roles:any,slide:any)=>{calls.push(slide);return true},sendLiveSlide:async(slide:any)=>{calls.push(slide);return true},powerPoint:{take:()=>new Promise(resolve=>{ready=resolve}),command,onState:()=>()=>{},onFault:()=>()=>{},stop:async()=>true}} as any;
 const starting=engine.start({'1':'main'},item.slides[0]);await vi.waitFor(()=>expect(ready).toBeTypeOf('function'));
 expect(calls[0].elements).toEqual([]);expect(calls[0].body).toBe('');expect(useLiveOutputPreview.getState().slide).toBeNull();
 ready(take);expect(await starting).toBe(true);
 expect((calls[1] as any)._powerPoint).toEqual({sessionId:take.sessionId,generation:take.generation});
 expect(command).toHaveBeenCalledWith('play');await engine.stop();
});
it('settles the status from an already-playing take even when native state has not changed',async()=>{
 const item=fixture(),engine=createEngine();
 window.desktop={sendLiveSlide:async()=>true,powerPoint:{take:async()=>({...take,phase:'playing'}),command:vi.fn(),onState:()=>()=>{},onFault:()=>()=>{},stop:async()=>true}} as any;
 expect(await engine.show(item.slides[0])).toBe(true);expect(usePowerPointStatus.getState().phase).toBe('playing');await engine.stop();
});
it('keeps the previous composition and does not send an editable imitation when native preparation fails',async()=>{
 const item=fixture(),engine=createEngine(),send=vi.fn(async()=>true);
 window.desktop={sendLiveSlide:send,powerPoint:{take:async()=>{throw Error('POWERPOINT_SOURCE_UNAVAILABLE')},onState:()=>()=>{},onFault:()=>()=>{},stop:async()=>true}} as any;
 expect(await engine.show(item.slides[0])).toBe(false);expect(send).not.toHaveBeenCalled();
});
it('does not silently fall back to editable content when an original-mode item has lost its source identity',async()=>{
 const item=fixture();delete item.slides[0].sourceSlideId;const engine=createEngine(),send=vi.fn(async()=>true);
 window.desktop={sendLiveSlide:send} as any;
 expect(await engine.show(item.slides[0])).toBe(false);expect(send).not.toHaveBeenCalled();expect(usePowerPointStatus.getState().phase).toBe('error');
});
it('routes the existing live pause control to PowerPoint and preserves it through a snapshot refresh',async()=>{
 const item=fixture(),engine=createEngine(),command=vi.fn(async(op:string)=>({...take,phase:op==='play'?'playing':'paused'}));
 window.desktop={sendLiveSlide:async()=>true,powerPoint:{take:async()=>({...take,phase:'playing'}),command,onState:()=>()=>{},onFault:()=>()=>{},stop:async()=>true}} as any;
 await engine.show(item.slides[0]);usePresentation.setState({onAir:true,liveItemId:item.id,liveSlideId:item.slides[0].id});
 usePresentation.getState().setLiveTimerPaused(item.slides[0].id);expect(command).toHaveBeenCalledWith('pause');
 window.desktop!.powerPoint!.take=async()=>take;
 await engine.show(item.slides[0]);expect(command).not.toHaveBeenCalledWith('play');
 usePresentation.getState().setLiveTimerPaused(undefined);expect(command).toHaveBeenCalledWith('play');await engine.stop();
});
