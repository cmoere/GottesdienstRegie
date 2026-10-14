import {expect,it} from 'vitest';
import {remainingCountdownMs} from './countdownClock';
it('derives remaining time from a shared anchor rather than accumulated ticks',()=>{
  expect(remainingCountdownMs(60000,100000,100000)).toBe(60000);
  expect(remainingCountdownMs(60000,100000,101000)).toBe(59000);
  expect(remainingCountdownMs(60000,100000,159750)).toBe(250);
  expect(remainingCountdownMs(60000,100000,170000)).toBe(0);
  expect(remainingCountdownMs(60000,100000,90000)).toBe(60000);
});
it('returns finite safe results for invalid duration and clock data',()=>{
  expect(remainingCountdownMs(-1,100,200)).toBe(0);expect(remainingCountdownMs(NaN,100,200)).toBe(0);
  expect(remainingCountdownMs(60000,NaN,200)).toBe(60000);expect(remainingCountdownMs(60000,100,NaN)).toBe(60000);
});
