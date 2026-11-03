import {describe,it,expect,vi} from 'vitest';
import {LocalSlideService} from './LocalSlideService';
describe('local drafting does not acquire live output ownership',()=>{
 const request={topic:'Dankbarkeit',notes:'Danke sagen',count:1};
 const result=JSON.stringify({slides:[{title:'Danke sagen',body:'Wem möchtest du heute danken?'}]});
 it('rejects ON AIR before touching the model and rejects malformed output',async()=>{
  const verify=vi.fn(async()=>'/owned/model'),run=vi.fn(async()=>result),service=new LocalSlideService({verifiedDirectory:verify},run,()=>true);
  await expect(service.generate(request)).rejects.toThrow('SLIDE_DRAFT_ON_AIR');expect(verify).not.toHaveBeenCalled();
  const invalid=new LocalSlideService({verifiedDirectory:verify},async()=>'<script>invalid</script>',()=>false);
  await expect(invalid.generate(request)).rejects.toThrow('SLIDE_DRAFT_INVALID');
 });
 it('cancels pending inference and rejects late output if ON AIR begins',async()=>{
  let onAir=false,resolve!:(text:string)=>void,signal:AbortSignal|undefined;
  const service=new LocalSlideService({verifiedDirectory:async()=>'/owned/model'},async(_dir,_request,abort)=>{signal=abort;return new Promise<string>(done=>{resolve=done})},()=>onAir);
  const pending=service.generate(request);for(let i=0;i<8&&!resolve;i++)await Promise.resolve();
  onAir=true;service.cancel();expect(signal?.aborted).toBe(true);resolve(result);
  await expect(pending).rejects.toThrow();expect(service.busy).toBe(false);
 });
 it('returns only validated drafts and serializes concurrent requests',async()=>{
  let finish!:(text:string)=>void;
  const service=new LocalSlideService({verifiedDirectory:async()=>'/owned/model'},async()=>new Promise<string>(done=>{finish=done}),()=>false);
  const pending=service.generate(request);await expect(service.generate(request)).rejects.toThrow('SLIDE_DRAFT_BUSY');
  for(let i=0;i<8&&!finish;i++)await Promise.resolve();finish(result);
  expect(await pending).toEqual([{title:'Danke sagen',body:'Wem möchtest du heute danken?'}]);
 });
});
