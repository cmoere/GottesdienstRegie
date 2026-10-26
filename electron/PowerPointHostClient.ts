import{spawn,type ChildProcessWithoutNullStreams}from'node:child_process';
import{randomBytes}from'node:crypto';import path from'node:path';

type Bounds={x:number;y:number;width:number;height:number};
type CaptureOwner={rootWindowHandle:string;childWindowHandle:string;processId:number;createdAt:string;lifetimeProperty:string;lifetimeValue:string;crop:{x:number;y:number;width:number;height:number;outerWidth:number;outerHeight:number}};
export type PowerPointHostState={phase:'prepared'|'paused'|'playing'|'ended'|'faulted'|'closed';sourceHash:string;slideIds:number[];applicationVisible:boolean;slideId:number;slideIndex:number;clickIndex:number;clickCount:number;capture:CaptureOwner|null};
type WorkerLaunch=(file:string,args:readonly string[],options:{windowsHide:true;shell:false;detached:boolean;stdio:['pipe','pipe','pipe']})=>ChildProcessWithoutNullStreams;
type Options={executable:string;sourceHash:string;sourcePath:string;slideIds:number[];bounds:Bounds;spawnWorker?:WorkerLaunch;onDiagnostic?:(text:string)=>void};
const exact=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const integer=(v:unknown,min:number,max:number)=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
const uint64=(v:unknown):v is string=>typeof v==='string'&&/^[1-9][0-9]{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n;
const problem=(code:string)=>Error('POWERPOINT_HOST_'+code);

/** Trusted Main only. This client and its HWND identity never enter preload. */
export async function startPowerPointHost(options:Options){
 const{executable,sourceHash,sourcePath,slideIds,bounds}=options;
 if(!path.isAbsolute(executable)||!/^[a-f0-9]{64}$/.test(sourceHash)||!path.isAbsolute(sourcePath)
   ||path.basename(sourcePath)!==sourceHash+'.pptx'||path.basename(path.dirname(sourcePath))!=='powerpoint-sources'
   ||!Array.isArray(slideIds)||!slideIds.length||slideIds.length>1000||new Set(slideIds).size!==slideIds.length||slideIds.some(id=>!integer(id,1,2147483647))
   ||!exact(bounds,['x','y','width','height'])||!integer(bounds.x,-100000,100000)||!integer(bounds.y,-100000,100000)||!integer(bounds.width,64,4096)||!integer(bounds.height,64,2160))throw problem('CONFIG');
 const expectedIds=Object.freeze([...slideIds]),preparedBounds={...bounds};
 const session=randomBytes(16).toString('hex'),generation=randomBytes(16).toString('hex');
 const child=(options.spawnWorker??spawn)(executable,[],{windowsHide:true,shell:false,detached:process.platform==='win32',stdio:['pipe','pipe','pipe']}) as ChildProcessWithoutNullStreams;
 let pending:{id:number;resolve:(state:PowerPointHostState)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}|null=null;
 let sequence=0,current:PowerPointHostState|undefined,hello=false,closing=false,fault:Error|undefined,tail=Buffer.alloc(0),killTimer:ReturnType<typeof setTimeout>|undefined,exitCode:number|null|undefined;
 const listeners=new Set<(state:PowerPointHostState)=>void>(),faultListeners=new Set<(error:Error)=>void>();
 let readyResolve:()=>void=()=>{},readyReject:(error:Error)=>void=()=>{};
 const ready=new Promise<void>((resolve,reject)=>{readyResolve=resolve;readyReject=reject});
 const exited=new Promise<number|null>(resolve=>child.once('exit',code=>{exitCode=code;clearTimeout(killTimer);if(!closing)fail(problem('EXITED'));resolve(code)}));
 function fail(error:Error){if(fault)return;fault=error;clearTimeout(helloTimer);if(pending){clearTimeout(pending.timer);pending.reject(error);pending=null}readyReject(error);child.stdin.end();killTimer=setTimeout(()=>{if(exitCode===undefined)child.kill()},2000);killTimer.unref?.();for(const listener of faultListeners){try{listener(error)}catch{}}}
 function snapshot(){if(!current)throw problem('NOT_READY');return structuredClone(current)}
 function state(value:any):PowerPointHostState{
  if(!exact(value,['phase','sourceHash','slideIds','applicationVisible','slideId','slideIndex','clickIndex','clickCount','capture'])
    ||!['prepared','paused','playing','ended','faulted','closed'].includes(value.phase)||value.sourceHash!==sourceHash||typeof value.applicationVisible!=='boolean'
    ||!Array.isArray(value.slideIds)||value.slideIds.length!==expectedIds.length||value.slideIds.some((id:number,index:number)=>id!==expectedIds[index])
    ||!integer(value.slideId,0,2147483647)||!integer(value.slideIndex,0,slideIds.length)||!integer(value.clickIndex,-1,100000)||!integer(value.clickCount,0,100000)
    ||(value.slideId!==0&&expectedIds[value.slideIndex-1]!==value.slideId))throw problem('PROTOCOL');
  const owner=value.capture;
  if(owner!==null){
   if(!exact(owner,['rootWindowHandle','childWindowHandle','processId','createdAt','lifetimeProperty','lifetimeValue','crop'])
     ||!uint64(owner.rootWindowHandle)||!uint64(owner.childWindowHandle)||owner.rootWindowHandle===owner.childWindowHandle||!integer(owner.processId,1,0xffffffff)
     ||!uint64(owner.createdAt)||owner.lifetimeProperty!=='GDR.PowerPoint.'+generation||!uint64(owner.lifetimeValue)||BigInt(owner.lifetimeValue)>2147483647n
     ||!exact(owner.crop,['x','y','width','height','outerWidth','outerHeight']))throw problem('PROTOCOL');
   const c=owner.crop;if(!integer(c.x,0,4096)||!integer(c.y,0,2160)||!integer(c.width,1,4096)||!integer(c.height,1,2160)
     ||!integer(c.outerWidth,1,4096)||!integer(c.outerHeight,1,2160)||c.x+c.width>c.outerWidth||c.y+c.height>c.outerHeight)throw problem('PROTOCOL');
  }
  if((value.phase==='paused'||value.phase==='playing')&&(!owner||!value.slideId))throw problem('PROTOCOL');
  return structuredClone(value);
 }
 function message(value:any){
  if(fault)return;
  if(!hello){if(!exact(value,['kind','protocol'])||value.kind!=='hello'||value.protocol!==1)throw problem('PROTOCOL');hello=true;clearTimeout(helloTimer);readyResolve();return;}
  if(value?.kind==='error'){
   if(!exact(value,['kind','id','code'])||!integer(value.id,0,Number.MAX_SAFE_INTEGER)||typeof value.code!=='string'||!/^POWERPOINT_[A-Z0-9_]{1,80}$/.test(value.code))throw problem('PROTOCOL');
   if(value.id!==0&&value.id!==pending?.id)throw problem('PROTOCOL');throw Error(value.code);
  }
  const isState=value?.kind==='state',keys=isState?['kind','session','generation','state']:['kind','id','session','generation','state'];
  if(!exact(value,keys)||(!isState&&value.kind!=='reply')||value.session!==session||value.generation!==generation||(!isState&&value.id!==pending?.id))throw problem('PROTOCOL');
  current=state(value.state);
  if(!isState&&pending){const request=pending;pending=null;clearTimeout(request.timer);request.resolve(snapshot())}
  for(const listener of listeners){try{listener(snapshot())}catch{}}
 }
 const helloTimer=setTimeout(()=>fail(problem('TIMEOUT')),5000);helloTimer.unref?.();
 child.on('error',()=>fail(problem('SPAWN')));child.stdin.on('error',()=>fail(problem('PIPE')));
 let diagnosticLength=0;child.stderr.on('data',(bytes:Buffer)=>{if(diagnosticLength>=8192)return;const text=bytes.toString('utf8').slice(0,8192-diagnosticLength);diagnosticLength+=text.length;try{options.onDiagnostic?.(text)}catch{}}); // Main-private only; never forwarded to visitors.
 child.stdout.on('data',(bytes:Buffer)=>{try{
  if(fault)return;tail=Buffer.concat([tail,bytes]);let at;
  while((at=tail.indexOf(10))>=0){if(at>65536)throw problem('PROTOCOL');const line=new TextDecoder('utf-8',{fatal:true}).decode(tail.subarray(0,at));tail=tail.subarray(at+1);message(JSON.parse(line))}
  if(tail.length>65536)throw problem('PROTOCOL');
 }catch(error){fail(error instanceof Error&&error.message.startsWith('POWERPOINT_')?error:problem('PROTOCOL'))}});
 function request(op:string,extra:Record<string,unknown>={},timeout=3000){
  if(fault)return Promise.reject(fault);if(pending)return Promise.reject(problem('BUSY'));if(exitCode!==undefined)return Promise.reject(problem('EXITED'));
  const id=++sequence;return new Promise<PowerPointHostState>((resolve,reject)=>{const timer=setTimeout(()=>fail(problem('TIMEOUT')),timeout);timer.unref?.();pending={id,resolve,reject,timer};child.stdin.write(JSON.stringify({id,op,session,generation,...extra})+'\n')});
 }
 let closePromise:Promise<void>|undefined;
 const client={session,generation,snapshot,
  command(op:'begin'|'play'|'pause'|'next'|'previous'|'status'|'goto',argument?:number|string){if(closing)return Promise.reject(problem('CLOSED'));if(op==='goto'&&(typeof argument!=='number'||!expectedIds.includes(argument)))return Promise.reject(problem('SLIDE_ID'));if(op==='begin'&&argument!==undefined&&!uint64(argument))return Promise.reject(problem('OUTPUT_GUARD'));return request(op,op==='goto'?{slideId:argument}:op==='begin'&&argument!==undefined?{outputWindowHandle:argument}:{},op==='begin'?15000:3000)},
  subscribe(listener:(value:PowerPointHostState)=>void){listeners.add(listener);return()=>{listeners.delete(listener)}},
  onFault(listener:(error:Error)=>void){faultListeners.add(listener);if(fault)listener(fault);return()=>{faultListeners.delete(listener)}},
  close(){return closePromise??=(async()=>{closing=true;try{await request('close');child.stdin.end();const exitTimer=setTimeout(()=>fail(problem('TIMEOUT')),3000);exitTimer.unref?.();try{if(await exited!==0)throw problem('EXITED')}finally{clearTimeout(exitTimer)}}finally{listeners.clear();faultListeners.clear()}})()},
 };
 try{await ready;await request('prepare',{sourceHash,sourcePath,bounds:preparedBounds},30000);return client;}catch(error){fail(error instanceof Error?error:problem('FAILED'));throw error;}
}
