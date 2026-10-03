import {describe,it,expect} from 'vitest';
import {shouldApplyOutputState} from './outputState';
describe('output replay ordering',()=>{
  it('rejects stale initial response after a newer live event',()=>{
    expect(shouldApplyOutputState(8,7)).toBe(false);
    expect(shouldApplyOutputState(8,8)).toBe(false);
    expect(shouldApplyOutputState(8,9)).toBe(true);
    expect(shouldApplyOutputState(-1,0)).toBe(true);
  });
});
