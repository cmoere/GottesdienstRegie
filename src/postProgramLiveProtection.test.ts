import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {usePresentation} from './store';
import {POST_PROGRAM_SYSTEM_ID} from './postProgramSystemSlide';
import {liveProtectionRemainingMs} from './store';
import {releaseUnavailablePostProgramTake} from './store';
import {useLiveOutputPreview} from './liveOutputPreview';

beforeEach(()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
 usePresentation.getState().newDocument('Nachprogramm');
 usePresentation.getState().addItem('content',{title:'Danach',section:'NACHPROGRAMM',sectionId:'post',body:'Danke'});
 usePresentation.getState().setOnAir(true);
 const item=usePresentation.getState().items.find(i=>i.id===POST_PROGRAM_SYSTEM_ID)!;
 usePresentation.getState().goLive(item.id,item.slides[0].id);
});
afterEach(()=>{usePresentation.getState().setOnAir(false);useLiveOutputPreview.setState({slide:null});vi.useRealTimers()});
const target=()=>usePresentation.getState().items.find(i=>i.title==='Danach')!;
it('blocks direct takes, NEXT and PREV during the first 60 seconds',()=>{
 const item=target();
 for(const navigate of [()=>usePresentation.getState().goLive(item.id,item.slides[0].id),()=>usePresentation.getState().nextLive(),()=>usePresentation.getState().previousLive()]){
  navigate();expect(usePresentation.getState().liveItemId).toBe(POST_PROGRAM_SYSTEM_ID);
 }
 vi.advanceTimersByTime(60099);
 usePresentation.getState().goLive(item.id,item.slides[0].id);
 expect(usePresentation.getState().liveItemId).toBe(POST_PROGRAM_SYSTEM_ID);
 vi.advanceTimersByTime(1);usePresentation.getState().nextLive();
 expect(usePresentation.getState().liveItemId).toBe(item.id);
});
it('does not restart protection when the same live page is taken again',()=>{
 vi.advanceTimersByTime(30000);
 const state=usePresentation.getState();state.goLive(state.liveItemId,state.liveSlideId);
 expect(usePresentation.getState().liveTransitionRevision).toBe(state.liveTransitionRevision);
 vi.advanceTimersByTime(30100);usePresentation.getState().nextLive();
 expect(usePresentation.getState().liveItemId).toBe(target().id);
});
it('always allows OFF AIR and does not lock non-live preview takes',()=>{
 usePresentation.getState().setOnAir(false);
 expect(usePresentation.getState().onAir).toBe(false);
 const item=target();usePresentation.getState().goLive(item.id,item.slides[0].id);
 expect(usePresentation.getState().liveItemId).toBe(item.id);
});
it('lets the automatic loop schedule its take after the same protection deadline',()=>{
 expect(liveProtectionRemainingMs(usePresentation.getState())).toBe(60100);
 vi.advanceTimersByTime(50100);
 expect(liveProtectionRemainingMs(usePresentation.getState())).toBe(10000);
 vi.advanceTimersByTime(10000);
 expect(liveProtectionRemainingMs(usePresentation.getState())).toBe(0);
});
it('also protects a post-program page chosen before starting ON AIR',()=>{
 usePresentation.getState().setOnAir(false);
 const item=usePresentation.getState().items.find(i=>i.id===POST_PROGRAM_SYSTEM_ID)!;
 usePresentation.getState().goLive(item.id,item.slides[0].id);
 usePresentation.getState().setOnAir(true);
 const next=target();usePresentation.getState().goLive(next.id,next.slides[0].id);
 expect(usePresentation.getState().liveItemId).toBe(POST_PROGRAM_SYSTEM_ID);
});
it('allows unavailable-content reconciliation instead of locking a blank output',()=>{
 const state=usePresentation.getState();
 expect(releaseUnavailablePostProgramTake(state.liveItemId,state.liveSlideId,state.liveTransitionRevision)).toBe(true);
 state.nextLive();expect(usePresentation.getState().liveItemId).toBe(target().id);
});
it('never releases a stale take or a valid already visible room notice',()=>{
 const state=usePresentation.getState();
 expect(releaseUnavailablePostProgramTake(state.liveItemId,state.liveSlideId,state.liveTransitionRevision-1)).toBe(false);
 const slide=state.items.find(item=>item.id===state.liveItemId)!.slides[0];
 useLiveOutputPreview.setState({slide:{...slide,postProgramRoomNotice:{sessionId:1,headerColor:'#608F9A',page:0,pageCount:1,notice:{type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'}}}});
 expect(releaseUnavailablePostProgramTake(state.liveItemId,state.liveSlideId,state.liveTransitionRevision)).toBe(false);
 state.nextLive();expect(usePresentation.getState().liveItemId).toBe(POST_PROGRAM_SYSTEM_ID);
});
