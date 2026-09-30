import {describe,expect,it,vi} from 'vitest';
import {DisplaySleepProtection} from './DisplaySleepProtection';

describe('DisplaySleepProtection',()=>{
  it('does not crash while Electron destroys the power blocker during shutdown',()=>{
    const blocker={start:vi.fn(()=>7),stop:vi.fn(),isStarted:vi.fn(()=>true)};
    const protection=new DisplaySleepProtection(blocker);
    protection.setEnabled(true);
    blocker.isStarted.mockImplementation(()=>{throw new TypeError('Object has been destroyed')});
    expect(()=>protection.setEnabled(false)).not.toThrow();
    expect(protection.getStatus()).toBe('disabled');
  });
});
