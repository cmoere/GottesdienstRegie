import {describe,expect,it} from 'vitest';
import {updatePromptAction} from './updatePromptModel';

describe('updatePromptAction',()=>{
  it.each([
    [0,'install-now'],[1,'later'],[2,'install-on-exit'],[3,'cancel'],[99,'cancel'],
  ] as const)('maps button %s to %s',(button,action)=>expect(updatePromptAction(button)).toBe(action));
});
