import {readSlideDraftRequest,parseSlideDraft,parseSlideQuestions,type SlideDraftRequest} from '../../shared/localSlideDraft';
type ModelPack={verifiedDirectory:(signal?:AbortSignal)=>Promise<string>};
type Runner=(directory:string,request:SlideDraftRequest,signal:AbortSignal)=>Promise<string>;
export class LocalSlideService{
 private controller?:AbortController;
 constructor(private readonly pack:ModelPack,private readonly run:Runner,private readonly startingOutput:()=>boolean){}
 get busy(){return Boolean(this.controller)}
 cancel(){this.controller?.abort()}
 async generate(value:unknown){
  const request=readSlideDraftRequest(value);
  if(!request||request.clarify)throw Error('SLIDE_DRAFT_REQUEST_INVALID');
  return this.infer(request,text=>{
   const drafts=parseSlideDraft(text,request.count);
   if(request.design&&drafts.some(draft=>!draft.design))throw Error('SLIDE_DRAFT_INVALID');
   return drafts;
  });
 }
 async clarify(value:unknown){
  const request=readSlideDraftRequest(value);
  if(!request)throw Error('SLIDE_DRAFT_REQUEST_INVALID');
  return this.infer({...request,clarify:true,design:false},parseSlideQuestions);
 }
 private async infer<T>(request:SlideDraftRequest,parse:(text:string)=>T){
  if(this.startingOutput())throw Error('SLIDE_DRAFT_ON_AIR');
  if(this.controller)throw Error('SLIDE_DRAFT_BUSY');
  const controller=new AbortController();this.controller=controller;
  try{
   const directory=await this.pack.verifiedDirectory(controller.signal);
   if(controller.signal.aborted)throw Error('SLIDE_DRAFT_CANCELLED');
   const text=await this.run(directory,request,controller.signal);
   if(controller.signal.aborted)throw Error('SLIDE_DRAFT_CANCELLED');
   return parse(text);
  }finally{if(this.controller===controller)this.controller=undefined}
 }
}
