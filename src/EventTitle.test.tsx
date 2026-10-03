import {render,cleanup,act} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {EventTitle,titleNeedsScroll} from './EventTitle';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
describe('complete event titles',()=>{
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
