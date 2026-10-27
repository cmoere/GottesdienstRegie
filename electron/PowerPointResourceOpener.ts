import type {PowerPointSourceStore} from './PowerPointSourceStore';
import type {startPowerPointHost} from './PowerPointHostClient';
import type {PowerPointResources} from './PowerPointPlayback';

type Host=Awaited<ReturnType<typeof startPowerPointHost>>;
type Dependencies={
 source:PowerPointSourceStore['get'];
 assets():Promise<{host:string;capture:string}>;
 guard():{handle:string;restore():void};
 startHost:typeof startPowerPointHost;
 startProducer(options:Record<string,unknown>):Promise<PowerPointResources['producer']>;
 createBroker(producer:PowerPointResources['producer']):PowerPointResources['broker'];
 cwd:string;
 bounds:{x:number;y:number;width:number;height:number};
};

/** Main-only source resolution and owned resource acquisition. No renderer
 * supplies file paths, executable paths, HWNDs, bounds or capture identities. */
export function createPowerPointResourceOpener(dependencies:Dependencies){
 return async(hash:string,slideId:number):Promise<PowerPointResources>=>{
  if(!/^[a-f0-9]{64}$/.test(hash)||!Number.isSafeInteger(slideId)||slideId<1)throw Error('POWERPOINT_TAKE_INVALID');
  const source=await dependencies.source(hash);
  const slideIds=source.inspection.slides.map(slide=>Number(slide.sourceId));
  if(!slideIds.includes(slideId))throw Error('POWERPOINT_SLIDE_MISSING');
  if(source.inspection.originalBlockers.length)throw Error('POWERPOINT_UNSUPPORTED_CONTENT');
  const assets=await dependencies.assets();
  let host:Host|undefined,producer:PowerPointResources['producer']|undefined;
  const guard=dependencies.guard();
  try{
   host=await dependencies.startHost({executable:assets.host,sourceHash:hash,sourcePath:source.path,slideIds,bounds:dependencies.bounds});
   const begun=await host.command('begin',guard.handle);
   await host.command('goto',slideId);
   if(!begun.capture)throw Error('POWERPOINT_CAPTURE_UNAVAILABLE');
   const capture=begun.capture;
   producer=await dependencies.startProducer({executable:assets.capture,cwd:dependencies.cwd,sessionId:host.session,generation:host.generation,owner:{...capture,hwnd:capture.rootWindowHandle,pid:capture.processId}});
   const broker=dependencies.createBroker(producer),own=host;let closed=false;
   return{host:{...own,async close(){if(closed)return;closed=true;try{await own.close()}finally{guard.restore()}}},producer,broker};
  }catch(error){
   // No frame imports exist before returning resources; a failed acquisition
   // can safely stop this exact producer and close this exact owned document.
   try{await producer?.stop()}finally{try{await host?.close()}finally{guard.restore()}}
   throw error;
  }
 };
}
