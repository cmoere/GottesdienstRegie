import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,renderHook} from '@testing-library/react';
import {useScheduledOutputSlide,outputPresentationDelay} from './outputPresentation';
import {createServiceItem} from './store';
afterEach(()=>{cleanup();vi.useRealTimers()});
it('MAIN holds the old picture until the same deadline used by the preview',()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);const old=createServiceItem('content').slides[0],next={...old,id:'next',_presentAtMs:1100};
 const {result}=renderHook(useScheduledOutputSlide);
 act(()=>result.current[1](old));act(()=>result.current[1](next));
 expect(result.current[0]?.id).toBe(old.id);
 act(()=>vi.advanceTimersByTime(99));expect(result.current[0]?.id).toBe(old.id);
 act(()=>vi.advanceTimersByTime(1));expect(result.current[0]?.id).toBe('next');
});
it('OFF AIR cancels a pending picture and invalid timing cannot freeze output',()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);const slide={...createServiceItem('content').slides[0],_presentAtMs:1100};
 const {result}=renderHook(useScheduledOutputSlide);act(()=>result.current[1](slide));act(()=>result.current[1](null));act(()=>vi.advanceTimersByTime(100));expect(result.current[0]).toBeNull();
 expect(outputPresentationDelay({...slide,_presentAtMs:Infinity},1000)).toBe(0);
 expect(outputPresentationDelay({...slide,_presentAtMs:999999},1000)).toBe(0);
});
