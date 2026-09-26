import {describe,expect,it} from 'vitest';
import {timerProgress} from './previewTimer';

describe('single preview timer ring',()=>{
  it('returns bounded progress for elapsed and overlong values',()=>{
    expect(timerProgress(10,10)).toBe(1);
    expect(timerProgress(5,10)).toBe(.5);
    expect(timerProgress(-1,10)).toBe(0);
    expect(timerProgress(20,10)).toBe(1);
    expect(timerProgress(5,0)).toBe(0);
  });
});
