import {readSlideDraftRequest,parseSlideDraft,type SlideDraftRequest} from '../../shared/localSlideDraft';
type ModelPack={verifiedDirectory:()=>Promise<string>};
type Runner=(directory:string,request:SlideDraftRequest,signal:AbortSignal)=>Promise<string>;
export class LocalSlideService{
 private controller?:AbortController;
 constructor(private readonly pack:ModelPack,private readonly run:Runner,private readonly isOnAir:()=>boolean){}
 get busy(){return Boolean(this.controller)}
 cancel(){this.controller?.abort()}
 async generate(value:unknown){
  if(this.isOnAir())throw Error('SLIDE_DRAFT_ON_AIR');
  if(this.controller)throw Error('SLIDE_DRAFT_BUSY');
  const request=readSlideDraftRequest(value);if(!request)throw Error('SLIDE_DRAFT_REQUEST_INVALID');
  const controller=new AbortController();this.controller=controller;
  try{
   const directory=await this.pack.verifiedDirectory();
   if(controller.signal.aborted||this.isOnAir())throw Error('SLIDE_DRAFT_CANCELLED');
   const text=await this.run(directory,request,controller.signal);
   if(controller.signal.aborted||this.isOnAir())throw Error('SLIDE_DRAFT_CANCELLED');
   return parseSlideDraft(text,request.count);
  }finally{if(this.controller===controller)this.controller=undefined}
 }
}
