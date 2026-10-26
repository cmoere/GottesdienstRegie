import{expect,it,vi}from'vitest';import{installPowerPointFrameReceiver}from'./PowerPointFrameReceiver';
async function fixture(){
 let receive:any,bind:any;const sent:any[]=[],draw=vi.fn(async()=>{}),dispose=vi.fn(),canvas=document.createElement('canvas');
 const bridge={invoke:async()=>null,listen:(_channel:string,callback:any)=>{bind=callback;return()=>{}},send:(channel:string,value:any)=>sent.push({channel,value}),receive:(callback:any)=>{receive=callback}};
 const stop=installPowerPointFrameReceiver(bridge,document,()=>({canvas,draw,copy:vi.fn(),dispose}));await Promise.resolve();
 const binding={sessionId:'a'.repeat(32),generation:'b'.repeat(32)},key={...binding,slotId:0,sequence:1};bind(binding);
 const frame={codedWidth:1920,codedHeight:1080,close:vi.fn()},reference={getVideoFrame:vi.fn(()=>frame),release:vi.fn()};return{binding,key,frame,reference,sent,draw,stop,receive,bind,dispose,canvas};
}
it('stages the genuine frame and acknowledges only after its own GPU draw and reference cleanup',async()=>{
 const f=await fixture();let finish:()=>void=()=>{};f.draw.mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve}));const receiving=f.receive({importedSharedTexture:f.reference},f.key);await Promise.resolve();expect(f.sent.some(v=>v.channel==='powerpoint:frame-ack')).toBe(false);finish();await receiving;
 expect(f.frame.close).toHaveBeenCalledOnce();expect(f.reference.release).toHaveBeenCalledOnce();expect(f.sent.find(v=>v.channel==='powerpoint:frame-ack')?.value).toEqual({key:f.key});f.stop();
});
it('attaches an already-staged frame only to its matching session, preserving a different live take',async()=>{
 const f=await fixture();const old=document.createElement('div');old.dataset.powerpointSession='c'.repeat(32);old.dataset.powerpointGeneration='d'.repeat(32);old.textContent='existing live content';document.body.append(old);
 await f.receive({importedSharedTexture:f.reference},f.key);expect(old.textContent).toBe('existing live content');expect(f.canvas.isConnected).toBe(false);
 const target=document.createElement('div');target.dataset.powerpointSession=f.binding.sessionId;target.dataset.powerpointGeneration=f.binding.generation;document.body.append(target);await new Promise(r=>setTimeout(r,0));expect(target.firstChild).toBe(f.canvas);f.stop();old.remove();target.remove();
});
it('releases an unknown old-generation import without poisoning a new source',async()=>{const f=await fixture();await f.receive({importedSharedTexture:f.reference},{...f.key,generation:'e'.repeat(32)});expect(f.reference.getVideoFrame).not.toHaveBeenCalled();expect(f.reference.release).toHaveBeenCalledOnce();expect(f.sent.some(v=>v.channel==='powerpoint:frame-fault')).toBe(false);f.stop();});
it('still releases exactly once if VideoFrame.close fails and reports only the bounded failure code',async()=>{
 const f=await fixture();f.frame.close.mockImplementation(()=>{throw Error('private raw path')});await f.receive({importedSharedTexture:f.reference},f.key);expect(f.reference.release).toHaveBeenCalledOnce();expect(f.sent.some(v=>v.channel==='powerpoint:frame-ack')).toBe(false);expect(JSON.stringify(f.sent)).not.toContain('private raw path');expect(f.sent.some(v=>v.channel==='powerpoint:frame-fault')).toBe(true);f.stop();
});
