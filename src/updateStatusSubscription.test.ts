import {describe,expect,it,vi} from 'vitest';
import {subscribeToUpdateStatus} from './updateStatusSubscription';

describe('update status subscription',()=>{
  it('restores the current updater state before listening for later changes',async()=>{
    const current={state:'downloading' as const,version:'0.66.0',percent:47};
    const setStatus=vi.fn();
    const dispose=vi.fn();
    const updates={status:vi.fn().mockResolvedValue(current),onStatus:vi.fn().mockReturnValue(dispose)};
    const cleanup=subscribeToUpdateStatus(updates,setStatus);
    await Promise.resolve();
    expect(setStatus).toHaveBeenCalledWith(current);
    cleanup();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
