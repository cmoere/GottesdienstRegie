import {renderHook,act} from '@testing-library/react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {useOutputPaintReport} from './outputPaintReport';
describe('committed output paint reporting',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it('waits for the scheduled slide commit and two frames; cancelled work never acknowledges',()=>{
  const frames=new Map<number,FrameRequestCallback>();let id=0;
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frames.set(++id,cb);return id});
  vi.stubGlobal('cancelAnimationFrame',(key:number)=>frames.delete(key));
  const report=vi.fn(),slide={},old={},packet={slide,delivery:{revision:8,sentAtMs:1},receivedAtMs:2};
  const {rerender,unmount}=renderHook(({shown})=>useOutputPaintReport(shown,packet,report),{initialProps:{shown:old}});
  expect(frames.size).toBe(0);rerender({shown:slide});expect(report).not.toHaveBeenCalled();
  const step=()=>{const pending=[...frames.values()];frames.clear();act(()=>pending.forEach(cb=>cb(0)))};
  step();expect(report).not.toHaveBeenCalled();step();expect(report).toHaveBeenCalledWith(expect.objectContaining({revision:8,receivedAtMs:2}));
  rerender({shown:old});rerender({shown:slide});unmount();step();expect(report).toHaveBeenCalledTimes(1);
 });
});
