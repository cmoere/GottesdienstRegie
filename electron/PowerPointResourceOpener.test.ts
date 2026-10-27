import {expect,it,vi} from 'vitest';
import {createPowerPointResourceOpener} from './PowerPointResourceOpener';

function fixture(){
 const order:string[]=[],capture={rootWindowHandle:'10',childWindowHandle:'11',processId:21,createdAt:'30',lifetimeProperty:'GDR.PowerPoint.'+'b'.repeat(32),lifetimeValue:'40',crop:{x:0,y:0,width:1920,height:1080,outerWidth:1920,outerHeight:1080}};
 const host={session:'a'.repeat(32),generation:'b'.repeat(32),command:vi.fn(async(op:string)=>{order.push(op);return{capture}}),close:vi.fn(async()=>{order.push('close')})};
 const producer={stop:vi.fn(async()=>{order.push('stop');return{drained:true}})};
 const dependencies={source:vi.fn(async()=>({path:'/private/powerpoint-sources/source.pptx',inspection:{slides:[{sourceId:'256'}],originalBlockers:[] as string[]}})),assets:vi.fn(async()=>({host:'/private/host.exe',capture:'/private/capture.exe'})),guard:vi.fn(()=>{order.push('guard');return{handle:'123',restore:()=>order.push('restore')}}),startHost:vi.fn(async()=>host),startProducer:vi.fn(async()=>producer),createBroker:vi.fn(()=>({})),cwd:'/private',bounds:{x:0,y:0,width:64,height:64}};
 return{order,host,producer,dependencies};
}
it('validates source slide identity before Office starts and never resolves a file path from the page',async()=>{
 const f=fixture(),open=createPowerPointResourceOpener(f.dependencies as any);
 await expect(open('c'.repeat(64),999)).rejects.toThrow('POWERPOINT_SLIDE_MISSING');expect(f.dependencies.startHost).not.toHaveBeenCalled();expect(f.dependencies.guard).not.toHaveBeenCalled();
 await expect(open('../file',256)).rejects.toThrow('POWERPOINT_TAKE_INVALID');expect(f.dependencies.source).toHaveBeenCalledTimes(1);
});
it('guards the own MAIN before beginning Office, navigates while paused and binds only the verified owner',async()=>{
 const f=fixture(),resources=await createPowerPointResourceOpener(f.dependencies as any)('c'.repeat(64),256);
 expect(f.order).toEqual(['guard','begin','goto']);
 expect(f.host.command).toHaveBeenNthCalledWith(1,'begin','123');
 expect(f.dependencies.startProducer).toHaveBeenCalledWith(expect.objectContaining({owner:expect.objectContaining({hwnd:'10',pid:21}),sessionId:'a'.repeat(32),generation:'b'.repeat(32)}));
 await resources.host.close();expect(f.order.slice(-2)).toEqual(['close','restore']);
});
it('restores the guard after an owned startup failure and closes only the created host',async()=>{
 const f=fixture();f.dependencies.startProducer.mockRejectedValueOnce(Error('GPU_FAIL'));
 await expect(createPowerPointResourceOpener(f.dependencies as any)('c'.repeat(64),256)).rejects.toThrow('GPU_FAIL');
 expect(f.order.slice(-2)).toEqual(['close','restore']);expect(f.host.close).toHaveBeenCalledTimes(1);
});
it('rejects unsupported original content before changing any output window',async()=>{
 const f=fixture();f.dependencies.source.mockResolvedValueOnce({path:'/private/source.pptx',inspection:{slides:[{sourceId:'256'}],originalBlockers:['media']}});
 await expect(createPowerPointResourceOpener(f.dependencies as any)('c'.repeat(64),256)).rejects.toThrow('POWERPOINT_UNSUPPORTED_CONTENT');expect(f.dependencies.guard).not.toHaveBeenCalled();
});
