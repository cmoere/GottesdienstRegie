import {render,cleanup,act} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {EventTitle,titleNeedsScroll} from './EventTitle';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
describe('complete event titles',()=>{
 it('uses the shared presentation clock and a complete linear reading pass after its row enters',()=>{
  vi.spyOn(HTMLElement.prototype,'scrollHeight','get').mockReturnValue(120);
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype,'scrollWidth','get').mockReturnValue(500);
  const motion={currentTime:0,cancel:vi.fn()},animate=vi.fn(()=>motion);
  Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:animate});
  const view=render(<EventTitle title="Vollständiger Veranstaltungstitel" elapsed={5000} startsAfterMs={7000} designWidth={600}/>);
  expect(animate).toHaveBeenLastCalledWith(expect.any(Array),expect.objectContaining({delay:7000,duration:21428.571428571428,easing:'linear',fill:'forwards'}));
  expect(motion.currentTime).toBe(5000);
  view.rerender(<EventTitle title="Vollständiger Veranstaltungstitel" elapsed={20000} startsAfterMs={7000} designWidth={600}/>);
  expect(motion.currentTime).toBe(20000);
  delete (HTMLElement.prototype as unknown as {animate?:unknown}).animate;
 });
 it('keeps one and two lines static, scrolls only real remaining overflow',()=>{
  expect(titleNeedsScroll(24,200,24,300)).toBe(false);expect(titleNeedsScroll(48,300,24,300)).toBe(false);
  expect(titleNeedsScroll(72,300,24,300)).toBe(true);expect(titleNeedsScroll(24,500,24,300)).toBe(true);
 });
 it('retains full title and remeasures only its own container on resize',()=>{
  let height=24,resize!:()=>void;
  vi.stubGlobal('ResizeObserver',class{constructor(cb:()=>void){resize=cb}observe(){}disconnect(){}});
  vi.spyOn(HTMLElement.prototype,'scrollHeight','get').mockImplementation(()=>height);
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype,'scrollWidth','get').mockReturnValue(500);
  const {container}=render(<div><EventTitle title="Erntedank-Frühstücksgottesdienst mit anschließender Begegnung"/><span>04.10.2026 · Saal</span></div>);
  expect(container.querySelector('.event-title-text')?.textContent).toBe('Erntedank-Frühstücksgottesdienst mit anschließender Begegnung');
  height=120;act(()=>resize());expect(container.querySelector('.event-title-container')).toHaveAttribute('data-scrolling','true');
  expect(container.querySelector('.event-title-container span')).toBeNull();
 });
});
