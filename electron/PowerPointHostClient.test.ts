import{EventEmitter}from'node:events';import{PassThrough}from'node:stream';import path from'node:path';import{expect,it,vi,afterEach}from'vitest';
import{startPowerPointHost}from'./PowerPointHostClient';
afterEach(()=>vi.useRealTimers());
function fixture(mode='normal'){
 const process=new EventEmitter() as any;process.stdout=new PassThrough();process.stderr=new PassThrough();process.stdin=new PassThrough();process.kill=vi.fn(()=>process.emit('exit',1));const commands:any[]=[];
 let lines='';process.stdin.on('data',(bytes:Buffer)=>{lines+=bytes.toString();let at;while((at=lines.indexOf('\n'))>=0){const command=JSON.parse(lines.slice(0,at));lines=lines.slice(at+1);commands.push(command);if(mode==='hang')continue;
 const phase=command.op==='prepare'?'prepared':command.op==='close'?'closed':'paused';const state={phase,sourceHash:'a'.repeat(64),slideIds:[256,257],applicationVisible:false,slideId:0,slideIndex:0,clickIndex:0,clickCount:0,capture:null};
 const reply={kind:'reply',id:command.id,session:command.session,generation:mode==='wrong-generation'?'f'.repeat(32):command.generation,state};queueMicrotask(()=>{process.stdout.write(JSON.stringify(reply)+'\n');if(command.op==='close')process.emit('exit',0)});
 }});
 const spawn=vi.fn((_file:string,_args:readonly string[],_options:unknown)=>{queueMicrotask(()=>process.stdout.write('{"kind":"hello","protocol":1}\n'));return process});
 const options={executable:path.resolve('work/PowerPointHost.exe'),sourceHash:'a'.repeat(64),sourcePath:path.resolve('work/powerpoint-sources','a'.repeat(64)+'.pptx'),slideIds:[256,257],bounds:{x:0,y:0,width:1920,height:1080},spawnWorker:spawn};return{process,commands,options,spawn};
}
it('fences preparation and close to one private source/session without passing a shell or renderer paths',async()=>{
 const f=fixture(),host=await startPowerPointHost(f.options);expect(host.snapshot().phase).toBe('prepared');expect(f.commands[0]).toMatchObject({op:'prepare',sourceHash:'a'.repeat(64),sourcePath:f.options.sourcePath});expect(f.commands[0].session).toMatch(/^[a-f0-9]{32}$/);expect(f.spawn.mock.calls[0][2]).toMatchObject({windowsHide:true,shell:false,detached:process.platform==='win32'});await host.close();expect(f.commands.map(c=>c.op)).toEqual(['prepare','close']);expect(f.process.kill).not.toHaveBeenCalled();
});
it('rejects a response from a different generation before exposing its state',async()=>{const f=fixture('wrong-generation');await expect(startPowerPointHost(f.options)).rejects.toThrow('POWERPOINT_HOST_PROTOCOL');});
it('bounds prepare time and ends only its own helper input',async()=>{
 vi.useFakeTimers();const f=fixture('hang'),started=startPowerPointHost(f.options),rejected=expect(started).rejects.toThrow('POWERPOINT_HOST_TIMEOUT');await vi.advanceTimersByTimeAsync(30001);await rejected;expect(f.process.stdin.writableEnded).toBe(true);await vi.advanceTimersByTimeAsync(3000);expect(f.process.kill).toHaveBeenCalledOnce();
});
it('allows bounded Office window creation without extending navigation timeouts',async()=>{
 vi.useFakeTimers();const f=fixture(),host=await startPowerPointHost(f.options);f.process.stdin.removeAllListeners('data');const begun=host.command('begin'),rejected=expect(begun).rejects.toThrow('POWERPOINT_HOST_TIMEOUT');await vi.advanceTimersByTimeAsync(3001);expect(f.process.stdin.writableEnded).toBe(false);await vi.advanceTimersByTimeAsync(12000);await rejected;
});
