import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {CountdownView} from './CountdownView';
import {SlideRenderer} from './SlideRenderer';
import {QuickOverlay} from './QuickOverlay';
import {createServiceItem} from './store';
afterEach(()=>{cleanup();vi.useRealTimers()});
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
