import type{PowerPointHostState}from'./PowerPointHostClient';

export type PowerPointBinding={sessionId:string;generation:string};
export type PowerPointTake=PowerPointBinding&Pick<PowerPointHostState,'sourceHash'|'slideId'|'slideIndex'|'clickIndex'|'clickCount'|'phase'>;
type Receiver={id:number;frame:unknown;required:boolean};
type Host={session:string;generation:string;snapshot():PowerPointHostState;command(op:'play'|'pause'|'next'|'previous'|'goto',argument?:number):Promise<PowerPointHostState>;subscribe(fn:(state:PowerPointHostState)=>void):()=>void;onFault(fn:(error:Error)=>void):()=>void;close():Promise<void>};
type Resources={host:Host;producer:{stop():Promise<{drained:boolean}>;onFault?(fn:(error:Error&{terminal?:boolean})=>void):()=>void};broker:{register(value:{id:number;frame:any;close():void}):()=>void;ack(id:number,key:any):boolean;revoke():Promise<void>;status():{drained:boolean}}};
type Dependencies={open(hash:string,slideId:number):Promise<Resources>;sendBinding(id:number,binding:PowerPointBinding):void;onState(take:PowerPointTake):void;onFault(code:string):void};
const validBinding=(value:any):value is PowerPointBinding=>value&&Object.keys(value).length===2&&typeof value.sessionId==='string'&&/^[a-f0-9]{32}$/.test(value.sessionId)&&typeof value.generation==='string'&&/^[a-f0-9]{32}$/.test(value.generation);
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

/** Main-only orchestration. The caller supplies only its own registered main
 * frames. Source HWNDs, shared handles and paths never leave this boundary. */
export function createPowerPointPlayback(dependencies:Dependencies){
 const receivers=new Map<number,Receiver>(),registered=new Map<number,()=>void>(),painted=new Set<number>();
 let active:Resources|undefined,off:Array<()=>void>=[],epoch=0,chain:Promise<unknown>=Promise.resolve(),faulted=false,releasing=false;
 let staged:{resolve():void;reject(error:Error):void;timer:ReturnType<typeof setTimeout>}|undefined;
 const binding=():PowerPointBinding|null=>active?{sessionId:active.host.session,generation:active.host.generation}:null;
 const matches=(value:unknown)=>{const own=binding();return validBinding(value)&&own?.sessionId===value.sessionId&&own.generation===value.generation};
 function publicState(state:PowerPointHostState):PowerPointTake{const own=binding();if(!own)throw Error('POWERPOINT_NOT_READY');return{...own,sourceHash:state.sourceHash,slideId:state.slideId,slideIndex:state.slideIndex,clickIndex:state.clickIndex,clickCount:state.clickCount,phase:state.phase}}
 function cancelStage(error:Error){if(!staged)return;const old=staged;staged=undefined;clearTimeout(old.timer);old.reject(error)}
 function fault(code:string){if(faulted)return;faulted=true;cancelStage(Error(code));dependencies.onFault(code)}
 function checkStaged(){if(!staged)return;const required=[...receivers.values()].filter(receiver=>receiver.required);if(!required.length||required.some(receiver=>!painted.has(receiver.id)))return;const old=staged;staged=undefined;clearTimeout(old.timer);old.resolve()}
 function serial<T>(run:()=>Promise<T>):Promise<T>{const result=chain.then(run,run);chain=result.catch(()=>{});return result}
 async function release(){
  if(!active)return;releasing=true;try{for(const stop of off.splice(0))stop();for(const stop of registered.values())stop();registered.clear();painted.clear();
  const resources=active;await resources.broker.revoke();const until=Date.now()+2000;while(!resources.broker.status().drained&&Date.now()<until)await sleep(10);
  if(!resources.broker.status().drained){fault('POWERPOINT_FRAME_DRAIN_TIMEOUT');throw Error('POWERPOINT_FRAME_DRAIN_TIMEOUT')}
  // Keep the native owner alive until actual Electron release callbacks, not
  // renderer credit ACKs, have drained all imports. Failed drains quarantine it.
  const stopped=await resources.producer.stop();if(!stopped.drained){fault('POWERPOINT_FRAME_DRAIN_TIMEOUT');throw Error('POWERPOINT_FRAME_DRAIN_TIMEOUT')}
  await resources.host.close();if(active===resources)active=undefined;}finally{releasing=false}
 }
 return{
  binding,
  addReceiver(receiver:Receiver){if(!Number.isSafeInteger(receiver.id)||receiver.id<1||!receiver.frame||receivers.has(receiver.id)||receivers.size>=4)throw Error('POWERPOINT_RECEIVER_INVALID');receivers.set(receiver.id,receiver);const own=binding();if(own)dependencies.sendBinding(receiver.id,own);return()=>{registered.get(receiver.id)?.();registered.delete(receiver.id);receivers.delete(receiver.id);painted.delete(receiver.id);if(receiver.required&&staged)fault('POWERPOINT_REQUIRED_RECEIVER_LOST')}},
  ready(id:number,value:unknown){if(!active||!receivers.has(id)||!matches(value)||faulted||releasing)return false;if(!registered.has(id)){const receiver=receivers.get(id)!,source=active;registered.set(id,source.broker.register({id,frame:receiver.frame,close:()=>{if(active!==source)return;registered.delete(id);if(receiver.required&&!releasing)fault('POWERPOINT_REQUIRED_RECEIVER_LOST')}}))}return true},
  ack(id:number,key:any){if(!active||!registered.has(id)||!key||!matches({sessionId:key.sessionId,generation:key.generation})||!active.broker.ack(id,key))return false;painted.add(id);checkStaged();return true},
  frameFault(id:number,value:any){if(registered.has(id)&&matches({sessionId:value?.sessionId,generation:value?.generation}))fault('POWERPOINT_FRAME_RENDER_FAILED')},
  take(hash:string,slideId:number){
   if(!/^[a-f0-9]{64}$/.test(hash)||!Number.isSafeInteger(slideId)||slideId<1)return Promise.reject(Error('POWERPOINT_TAKE_INVALID'));
   const requested=++epoch;cancelStage(Error('POWERPOINT_TAKE_SUPERSEDED'));
   return serial(async()=>{
    if(requested!==epoch)throw Error('POWERPOINT_TAKE_SUPERSEDED');
    if(active&&!faulted&&active.host.snapshot().sourceHash===hash){if(active.host.snapshot().slideId!==slideId)await active.host.command('goto',slideId);return publicState(active.host.snapshot())}
    await release();faulted=false;active=await dependencies.open(hash,slideId);
    if(requested!==epoch){await release();throw Error('POWERPOINT_TAKE_SUPERSEDED')}
    const resources=active;
    off.push(resources.host.subscribe(state=>{if(active===resources&&!faulted)dependencies.onState(publicState(state))}),resources.host.onFault(()=>fault('POWERPOINT_SOURCE_UNAVAILABLE')));
    const stopProducerFault=resources.producer.onFault?.(error=>{if(error.terminal!==false)fault('POWERPOINT_CAPTURE_UNAVAILABLE')});if(stopProducerFault)off.push(stopProducerFault);
    if(faulted){await release();throw Error('POWERPOINT_SOURCE_UNAVAILABLE')}
    const paintedFrame=new Promise<void>((resolve,reject)=>{staged={resolve,reject,timer:setTimeout(()=>fault('POWERPOINT_FIRST_FRAME_TIMEOUT'),5000)}});
    for(const receiver of receivers.values())dependencies.sendBinding(receiver.id,binding()!);
    try{await paintedFrame;if(requested!==epoch)throw Error('POWERPOINT_TAKE_SUPERSEDED');return publicState(resources.host.snapshot())}catch(error){await release();throw error}
   });
  },
  command(op:'play'|'pause'|'next'|'previous'|'goto',argument?:number){return serial(async()=>{if(!active||faulted)throw Error('POWERPOINT_NOT_READY');if(!['play','pause','next','previous','goto'].includes(op))throw Error('POWERPOINT_COMMAND_INVALID');const result=await active.host.command(op,argument);return publicState(result)})},
  close(){++epoch;cancelStage(Error('POWERPOINT_CLOSED'));return serial(release)},
 };
}
