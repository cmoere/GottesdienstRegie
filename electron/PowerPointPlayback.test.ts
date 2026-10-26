import{expect,it,vi}from'vitest';
import{createPowerPointPlayback}from'./PowerPointPlayback';
import type{PowerPointHostState}from'./PowerPointHostClient';

function fixture(){
 const binding={sessionId:'a'.repeat(32),generation:'b'.repeat(32)},registered=new Set<number>(),listeners=new Set<(value:any)=>void>(),faults:string[]=[],sent:any[]=[];
 let phase:PowerPointHostState['phase']='paused';const state=():PowerPointHostState=>({phase,sourceHash:'c'.repeat(64),slideId:256,slideIds:[256,257],slideIndex:1,clickIndex:0,clickCount:2,applicationVisible:false,capture:{rootWindowHandle:'123',childWindowHandle:'124',processId:1,createdAt:'123',lifetimeProperty:'privateWindow',lifetimeValue:'2',crop:{x:0,y:0,width:1920,height:1080,outerWidth:1920,outerHeight:1080}}});
 const host={...binding,session:binding.sessionId,command:vi.fn(async(op:string)=>{if(op==='play')phase='playing';if(op==='pause')phase='paused';return state()}),snapshot:state,subscribe:(fn:any)=>{listeners.add(fn);return()=>listeners.delete(fn)},onFault:()=>()=>{},close:vi.fn(async()=>{})};
 const producer={stop:vi.fn(async()=>({drained:true})),onFault:()=>()=>{}};
 const broker={register:vi.fn(({id,close}:any)=>{registered.add(id);return()=>{registered.delete(id);close()}}),ack:vi.fn((id:number)=>registered.has(id)),revoke:vi.fn(async()=>{registered.clear()}),status:()=>({drained:true})};
 const dependencies={open:vi.fn(async()=>({host,producer,broker})),sendBinding:(id:number,value:any)=>sent.push([id,value]),onState:vi.fn(),onFault:(code:string)=>faults.push(code)};
 const player=createPowerPointPlayback(dependencies);player.addReceiver({id:1,frame:{},required:true});player.addReceiver({id:2,frame:{},required:true});
 const ack=(id:number)=>player.ack(id,{sessionId:binding.sessionId,generation:binding.generation,slotId:0,sequence:1});
 return{player,binding,host,producer,broker,dependencies,ack,listeners,faults,sent};
}
it('keeps preparation private and waits for real MAIN and preview frame acknowledgments',async()=>{
 const f=fixture();let returned=false;const preparing=f.player.take('c'.repeat(64),256).then(value=>{returned=true;return value});await vi.waitFor(()=>expect(f.sent).toHaveLength(2));
 expect(returned).toBe(false);expect(JSON.stringify(f.sent)).not.toContain('privateWindow');expect(f.player.ready(1,{...f.binding,generation:'d'.repeat(32)})).toBe(false);
 expect(f.player.ready(1,f.binding)).toBe(true);f.ack(1);await Promise.resolve();expect(returned).toBe(false);expect(f.player.ready(2,f.binding)).toBe(true);f.ack(2);
 expect(await preparing).toEqual({...f.binding,sourceHash:'c'.repeat(64),slideId:256,slideIndex:1,clickIndex:0,clickCount:2,phase:'paused'});await f.player.close();expect(f.host.close).toHaveBeenCalledOnce();expect(f.producer.stop).toHaveBeenCalledOnce();expect(f.faults).toEqual([]);
});
it('rejects unknown receivers and stale acknowledgments without poisoning the current take',async()=>{
 const f=fixture(),preparing=f.player.take('c'.repeat(64),256);await vi.waitFor(()=>expect(f.sent).toHaveLength(2));expect(f.player.ready(999,f.binding)).toBe(false);f.player.ready(1,f.binding);f.player.ready(2,f.binding);
 expect(f.player.ack(1,{...f.binding,generation:'e'.repeat(32),slotId:0,sequence:1})).toBe(false);f.ack(1);f.ack(2);await preparing;expect(f.faults).toEqual([]);await f.player.close();
});
it('serializes native commands and reports source changes without leaking capture identity',async()=>{
 const f=fixture(),preparing=f.player.take('c'.repeat(64),256);await vi.waitFor(()=>expect(f.sent).toHaveLength(2));for(const id of[1,2]){f.player.ready(id,f.binding);f.ack(id)}await preparing;
 await Promise.all([f.player.command('play'),f.player.command('pause')]);expect(f.host.command.mock.calls.map(call=>call[0])).toEqual(['play','pause']);for(const fn of f.listeners)fn({...f.host.snapshot(),slideId:257,slideIndex:2});
 expect(f.dependencies.onState).toHaveBeenLastCalledWith(expect.objectContaining({slideId:257,slideIndex:2}));expect(JSON.stringify(f.dependencies.onState.mock.calls)).not.toContain('privateWindow');await f.player.close();
});
it('cancels an uncommitted take on OFF AIR and closes only the owned resources',async()=>{
 const f=fixture(),preparing=f.player.take('c'.repeat(64),256),rejected=expect(preparing).rejects.toThrow('POWERPOINT_CLOSED');await vi.waitFor(()=>expect(f.sent).toHaveLength(2));await f.player.close();await rejected;expect(f.host.close).toHaveBeenCalledOnce();expect(f.player.binding()).toBeNull();
});
it('waits for actual native references to drain after credit ACKs before stopping the producer',async()=>{
 const f=fixture(),preparing=f.player.take('c'.repeat(64),256);await vi.waitFor(()=>expect(f.sent).toHaveLength(2));for(const id of[1,2]){f.player.ready(id,f.binding);f.ack(id)}await preparing;
 let drained=false;f.broker.status=()=>({drained});const closing=f.player.close();await vi.waitFor(()=>expect(f.broker.revoke).toHaveBeenCalledOnce());expect(f.producer.stop).not.toHaveBeenCalled();expect(f.host.close).not.toHaveBeenCalled();drained=true;await closing;expect(f.producer.stop).toHaveBeenCalledOnce();
});
it('bounds first-frame preparation and reports failure rather than committing an empty surface',async()=>{
 vi.useFakeTimers();try{const f=fixture(),preparing=f.player.take('c'.repeat(64),256),rejected=expect(preparing).rejects.toThrow('POWERPOINT_FIRST_FRAME_TIMEOUT');await vi.advanceTimersByTimeAsync(5001);await rejected;expect(f.faults).toEqual(['POWERPOINT_FIRST_FRAME_TIMEOUT']);expect(f.host.close).toHaveBeenCalledOnce()}finally{vi.useRealTimers()}
});
