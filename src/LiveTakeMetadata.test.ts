import {expect,it,vi} from 'vitest';
import {LiveEngine} from './LiveEngine';
import {createServiceItem,usePresentation} from './store';
import {useLiveOutputPreview} from './liveOutputPreview';
import {usePreferences} from './preferences';
it('captures banner context for the logical take rather than subsequent editor moves',async()=>{
  vi.useFakeTimers();vi.setSystemTime(1000);
  const saved=usePresentation.getState(),engine=new LiveEngine(),item=createServiceItem('content',{sectionId:'pre'});
  usePresentation.setState({items:[item],liveTransitionRevision:1});
  window.desktop={sendLiveSlide:async()=>true} as unknown as typeof window.desktop;
  const deliver=async()=>{const pending=engine.show(item.slides[0]);await vi.advanceTimersByTimeAsync(100);await pending};
  try{
    await deliver();
    expect(useLiveOutputPreview.getState().slide?.bannerContext).toEqual({liveSection:'pre',countdownActive:false});
    usePresentation.setState({items:[{...item,sectionId:'service'}]});await deliver();
    expect(useLiveOutputPreview.getState().slide?.bannerContext).toEqual({liveSection:'pre',countdownActive:false});
    usePresentation.setState({liveTransitionRevision:2});await deliver();
    expect(useLiveOutputPreview.getState().slide?.bannerContext).toEqual({liveSection:'service',countdownActive:false});
  }finally{usePresentation.setState(saved,true);useLiveOutputPreview.setState({slide:null});delete window.desktop;vi.useRealTimers()}
});
it('keeps the service countdown frozen to its committed take until the next safe take',async()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);
 const saved=usePresentation.getState(),prefs=usePreferences.getState(),engine=new LiveEngine(),item=createServiceItem('content',{sectionId:'pre'});
 usePreferences.setState({showServiceCountdown:true});
 usePresentation.setState({items:[item],date:'2026-10-21',serviceTime:'10:30',eventLink:undefined,liveTransitionRevision:1});
 window.desktop={sendLiveSlide:async()=>true} as unknown as typeof window.desktop;
 const deliver=async()=>{const pending=engine.show(item.slides[0]);await vi.advanceTimersByTimeAsync(100);await pending};
 try{
  await deliver();const original=useLiveOutputPreview.getState().slide?._serviceCountdownAtMs;
  expect(original).toBe(new Date('2026-10-21T10:30:00').getTime());
  usePresentation.setState({serviceTime:'11:30'});await deliver();
  expect(useLiveOutputPreview.getState().slide?._serviceCountdownAtMs).toBe(original);
  usePresentation.setState({liveTransitionRevision:2});await deliver();
  expect(useLiveOutputPreview.getState().slide?._serviceCountdownAtMs).toBe(new Date('2026-10-21T11:30:00').getTime());
 }finally{usePresentation.setState(saved,true);usePreferences.setState(prefs,true);useLiveOutputPreview.setState({slide:null});delete window.desktop;vi.useRealTimers()}
});
