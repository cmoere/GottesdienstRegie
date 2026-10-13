import {act,cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {SlideRenderer} from './SlideRenderer';
import type {Slide,SlideElement} from './store';
import {EventOverviewTable} from './EventOverviewTable';
import {prepareEventOverview} from './eventOverviewPresentation';

const originalAnimate=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'animate');
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();if(originalAnimate)Object.defineProperty(HTMLElement.prototype,'animate',originalAnimate);else delete (HTMLElement.prototype as unknown as {animate?:unknown}).animate});
function tableSlide(title='Gebetsabend'):Slide {
 const element:SlideElement={id:'event-loop',type:'loop',name:'Events',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{}};
 element.properties={...element.properties,loopType:'nextEvents',eventItemsJson:JSON.stringify([{title,effectiveStart:'2020-01-01T18:00:00+01:00',effectiveEnd:'2020-01-01T19:00:00+01:00',effectiveLocation:'Saal'}])};
 return {id:'events',itemId:'events',order:0,enabled:true,title:'',body:'',background:'#fff',transition:'none',transitionDuration:0,notes:'',elements:[element]};
}
describe('event overview table',()=>{
 it('seeks title motion when the shared live presentation clock changes',()=>{
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype,'scrollWidth','get').mockReturnValue(900);
  const motion={currentTime:0,cancel:vi.fn()};
  Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:()=>motion});
  const prepared=prepareEventOverview({eventItemsJson:JSON.stringify([{title:'Gebet',effectiveStart:'2020-01-01T18:00:00+01:00'}])});
  const view=render(<EventOverviewTable items={prepared.items} plan={prepared.plan} elapsed={0}/>);
  view.rerender(<EventOverviewTable items={prepared.items} plan={prepared.plan} elapsed={20000}/>);
  expect(motion.currentTime).toBe(20000);
 });
 it('renders separate date, time, title and room columns in the live output',()=>{
  render(<SlideRenderer slide={tableSlide()} mode="live"/>);
  expect(screen.getByRole('table',{name:'Nächste Veranstaltungen'})).toBeInTheDocument();
  expect(screen.getAllByRole('columnheader').map(cell=>cell.textContent)).toEqual(['Datum','Uhrzeit','Veranstaltung','Ort/Raum']);
  expect(screen.getAllByRole('cell').map(cell=>cell.textContent)).toEqual(['Mi., 01.01.2020','18:00–19:00','Gebetsabend','Saal']);
 });
 it('starts native horizontal motion only when the whole unbroken title overflows',()=>{
  let width=200;
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype,'scrollWidth','get').mockImplementation(()=>width);
  let resize!:()=>void;
  vi.stubGlobal('ResizeObserver',class{constructor(cb:()=>void){resize=cb}observe(){}disconnect(){}});
  const animate=vi.fn((_frames:Keyframe[],_options:KeyframeAnimationOptions)=>({currentTime:0,cancel:vi.fn()}));
  Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:animate});
  const title='Ein vollständiger langer Veranstaltungstitel mit Begegnung';
  render(<SlideRenderer slide={tableSlide(title)} mode="live"/>);
  expect(screen.getAllByText(title)[0]).toBeInTheDocument();
  expect(animate).not.toHaveBeenCalled();
  width=900;act(()=>resize());
  expect(animate).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({transform:'translateX(-600px)'})]),expect.objectContaining({easing:'linear',fill:'forwards'}));
  // A scaled preview must preserve the same reading speed as the 1920px output.
  expect(animate.mock.calls[0][1].duration).toBeCloseTo(49657.143,2);
  expect(screen.getAllByText(title).at(-1)).toHaveStyle({whiteSpace:'nowrap'});
  vi.unstubAllGlobals();
 });
 it('starts the sixth title after its row has fully entered the vertical viewport',()=>{
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype,'scrollWidth','get').mockReturnValue(900);
  const animate=vi.fn((_frames:Keyframe[],_options:KeyframeAnimationOptions)=>({currentTime:0,cancel:vi.fn()}));
  Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:animate});
  const slide=tableSlide();
  slide.elements[0].properties.eventLimit=8;
  slide.elements[0].properties.eventItemsJson=JSON.stringify(Array.from({length:6},(_,index)=>({title:`Veranstaltung ${index}`,effectiveStart:'2020-01-01T18:00:00+01:00'})));
  render(<SlideRenderer slide={slide} mode="live"/>);
  const titleCalls=animate.mock.calls.filter(([frames])=>frames[0].transform==='translateX(0)');
  expect(titleCalls).toHaveLength(6);
  expect(titleCalls[5][1].delay).toBe(10800);
 });
 it('keeps full unbroken titles on reduced-motion pages',()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  vi.spyOn(window,'matchMedia').mockReturnValue({...media,matches:true});
  const title='Ein besonders langer Veranstaltungstitel mit Begegnung und gemeinsamem Essen';
  render(<SlideRenderer slide={tableSlide(title)} mode="live"/>);
  expect(screen.getByText(title)).toHaveStyle({whiteSpace:'nowrap'});
  expect(screen.getByText(title).parentElement).toHaveStyle({overflowX:'auto'});
 });
});
