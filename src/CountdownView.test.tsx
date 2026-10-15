import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {CountdownView} from './CountdownView';
import {SlideRenderer} from './SlideRenderer';
import {QuickOverlay} from './QuickOverlay';
import {createServiceItem,usePresentation} from './store';
import {LiveEngine} from './LiveEngine';
import {useLiveOutputPreview} from './liveOutputPreview';
afterEach(()=>{cleanup();delete window.desktop;useLiveOutputPreview.setState({slide:null});vi.useRealTimers()});
it('shows the same countdown at late join and holds at zero',()=>{
  const view=render(<CountdownView presetId="countdown:60:cross" durationMs={60000} startedAtMs={100000} nowMs={125000}/>);
  expect(screen.getByText('00:35')).toBeInTheDocument();expect(view.container.querySelector('[data-design="cross"]')).not.toBeNull();
  view.rerender(<CountdownView presetId="countdown:60:cross" durationMs={60000} startedAtMs={100000} nowMs={200000}/>);
  expect(screen.getByText('00:00')).toBeInTheDocument();expect(view.container.querySelector('audio,video')).toBeNull();
});
it('uses the original live take anchor when a slide renderer joins late',()=>{
  vi.useFakeTimers();vi.setSystemTime(125000);
  const slide={...createServiceItem('countdown').slides[0],_presentAtMs:100000};
  slide.elements[0].properties={text:'',timerDurationSeconds:60,countdownPresetId:'countdown:60:cross'};
  render(<SlideRenderer slide={slide} mode="mirror"/>);expect(screen.getByText('00:35')).toBeInTheDocument();
});
it('quick countdowns join the same start anchor instead of restarting per window',()=>{
  vi.useFakeTimers();vi.setSystemTime(125000);
  render(<QuickOverlay quick={{id:'countdown',type:'countdown',name:'Countdown',enabled:true,targets:['main'],order:0,duration:60,startedAtMs:100000} as any}/>);
  expect(screen.getByText('00:35')).toBeInTheDocument();
});
it('keeps a live countdown running through unrelated edits and restarts only on a deliberate retake',async()=>{
  vi.useFakeTimers();vi.setSystemTime(100000);
  const saved=usePresentation.getState(),engine=new LiveEngine(),item=createServiceItem('countdown',{sectionId:'pre'}),other=createServiceItem('content');
  item.slides[0].elements[0].properties={timerDurationSeconds:60,countdownPresetId:'countdown:60:cross'};
  usePresentation.setState({items:[item,other],liveTransitionRevision:7});
  window.desktop={sendLiveSlide:async()=>true} as unknown as typeof window.desktop;
  const deliver=async()=>{const pending=engine.show(item.slides[0]);await vi.advanceTimersByTimeAsync(100);await pending;return useLiveOutputPreview.getState().slide!};
  try{
    const view=render(<SlideRenderer slide={await deliver()} mode="mirror"/>);
    await vi.advanceTimersByTimeAsync(5000);expect(screen.getByText('00:55')).toBeInTheDocument();
    usePresentation.setState({items:[item,{...other,title:'Nächsten Inhalt bearbeiten'}]});
    view.rerender(<SlideRenderer slide={await deliver()} mode="mirror"/>);
    expect(screen.getByText('00:55')).toBeInTheDocument();
    usePresentation.setState({liveTransitionRevision:8});
    view.rerender(<SlideRenderer slide={await deliver()} mode="mirror"/>);
    expect(screen.getByText('01:00')).toBeInTheDocument();
  }finally{usePresentation.setState(saved,true)}
});
