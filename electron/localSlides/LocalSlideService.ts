import {readSlideDraftRequest,parseSlideDraft,type SlideDraftRequest} from '../../shared/localSlideDraft';
type ModelPack={verifiedDirectory:(signal?:AbortSignal)=>Promise<string>};
type Runner=(directory:string,request:SlideDraftRequest,signal:AbortSignal)=>Promise<string>;
export class LocalSlideService{
 private controller?:AbortController;
 constructor(private readonly pack:ModelPack,private readonly run:Runner,private readonly startingOutput:()=>boolean){}
 get busy(){return Boolean(this.controller)}
 cancel(){this.controller?.abort()}
 async generate(value:unknown){
  if(this.startingOutput())throw Error('SLIDE_DRAFT_ON_AIR');
  if(this.controller)throw Error('SLIDE_DRAFT_BUSY');
  const request=readSlideDraftRequest(value);if(!request)throw Error('SLIDE_DRAFT_REQUEST_INVALID');
  const controller=new AbortController();this.controller=controller;
  try{
   const directory=await this.pack.verifiedDirectory(controller.signal);
   if(controller.signal.aborted)throw Error('SLIDE_DRAFT_CANCELLED');
   const text=await this.run(directory,request,controller.signal);
   if(controller.signal.aborted)throw Error('SLIDE_DRAFT_CANCELLED');
   const drafts=parseSlideDraft(text,request.count);
   if(request.design&&drafts.some(draft=>!draft.design))throw Error('SLIDE_DRAFT_INVALID');
   return drafts;
  }finally{if(this.controller===controller)this.controller=undefined}
 }
}
