import {afterEach,expect,it,vi} from 'vitest';
import {createScreenTestSession,readScreenTestReceipt,screenTestPatterns} from './screenTest';
const runId='a'.repeat(32);
const receipt=(pattern:string,patch={})=>({runId,pattern,ok:true,width:1920,height:1080,frames:300,elapsedMs:5100,...patch});
afterEach(()=>vi.useRealTimers());
it('waits for matching MAIN checks, not an arbitrary three-second slide timer',async()=>{
  vi.useFakeTimers();const show=vi.fn().mockResolvedValue(true),restore=vi.fn();
  const session=createScreenTestSession({runId,show,restore});const done=session.start();
  expect(show).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(9000);expect(show).toHaveBeenCalledTimes(1);
  expect(session.receive(receipt('bars',{runId:'b'.repeat(32)}))).toBe(false);
  expect(session.receive(receipt('blue'))).toBe(false);
  for(const pattern of ['bars','grid','grayscale','white','black','red','green','blue']){
    expect(session.receive(receipt(pattern))).toBe(true);await vi.advanceTimersByTimeAsync(0);
  }
  const result=await done;expect(result.status).toBe('complete');expect(result.steps).toHaveLength(8);expect(restore).toHaveBeenCalledTimes(1);
  expect(screenTestPatterns.map(item=>item.id)).toEqual(['bars','grid','grayscale','white','black','red','green','blue']);
});
it('stops on a missing output response instead of claiming that sending means displayed',async()=>{
  vi.useFakeTimers();const show=vi.fn().mockResolvedValue(true),restore=vi.fn();
  const session=createScreenTestSession({runId,show,restore});const done=session.start();
  await vi.advanceTimersByTimeAsync(20000);
  expect((await done).status).toBe('error');expect(show).toHaveBeenCalledTimes(1);expect(restore).toHaveBeenCalledTimes(1);
});
it('cancels without overwriting an emergency replacement, and ignores late reports',async()=>{
  const restore=vi.fn(),show=vi.fn().mockResolvedValue(true),session=createScreenTestSession({runId,show,restore});
  const done=session.start();session.cancel(false);expect((await done).status).toBe('cancelled');
  expect(restore).not.toHaveBeenCalled();expect(session.receive(receipt('bars'))).toBe(false);expect(show).toHaveBeenCalledTimes(1);
});
it('stops on a failed pixel check or rejected dispatch',async()=>{
  const restore=vi.fn(),show=vi.fn().mockResolvedValue(true),session=createScreenTestSession({runId,show,restore});
  const done=session.start();expect(session.receive(receipt('bars',{ok:false,reason:'pattern-mismatch'}))).toBe(true);
  expect((await done).status).toBe('error');expect(show).toHaveBeenCalledTimes(1);expect(restore).toHaveBeenCalledTimes(1);
  const rejected=createScreenTestSession({runId,show:async()=>false,restore});
  expect((await rejected.start()).status).toBe('error');
});
it('rejects malformed, premature and oversized result payloads',()=>{
  expect(readScreenTestReceipt(receipt('bars'))).toMatchObject({pattern:'bars',ok:true});
  for(const bad of [null,{},receipt('bogus'),receipt('bars',{frames:1}),receipt('bars',{elapsedMs:1}),receipt('bars',{width:0}),receipt('bars',{width:Infinity}),receipt('bars',{private:'secret'}),receipt('bars',{runId:'x'})])expect(readScreenTestReceipt(bad)).toBeNull();
});
it('does not hide a failed restoration behind the cancellation message',async()=>{
 const session=createScreenTestSession({runId,show:async()=>true,restore:async()=>{throw Error('offline')}});
 const done=session.start();session.cancel();const result=await done;
 expect(result.status).toBe('error');expect(result.message).toContain('wiederhergestellt');
});
it('bounds a hanging restoration as well as the per-pattern wait',async()=>{
 vi.useFakeTimers();const session=createScreenTestSession({runId,show:async()=>true,restore:()=>new Promise(()=>{})});
 let result:unknown;const done=session.start().then(value=>{result=value});session.cancel();
 await vi.advanceTimersByTimeAsync(3000);expect(result).toMatchObject({status:'error'});await done;
});
