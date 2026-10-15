import {expect,it,vi} from 'vitest';
import {LiveEngine} from './LiveEngine';
import {createServiceItem,usePresentation} from './store';
import {useLiveOutputPreview} from './liveOutputPreview';
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
