import {randomUUID} from 'node:crypto';
type Runner=(directory:string,prompt:string,signal:AbortSignal)=>Promise<Buffer>;
type Save=(input:{name:string;kind:'image';extension:'png';data:Buffer})=>Promise<{url:string}>;
export class LocalImageService{
 private controller?:AbortController;
 private images=new Map<string,Buffer>();
 constructor(private readonly pack:{verifiedDirectory:(signal?:AbortSignal)=>Promise<string>},private readonly run:Runner,private readonly save:Save,private readonly blocked:()=>boolean){}
 get busy(){return Boolean(this.controller)}
 cancel(){this.controller?.abort()}
 discard(){this.cancel();this.images.clear()}
 async generate(prompt:unknown){
  if(this.blocked()||this.busy)throw Error('LOCAL_IMAGE_BUSY');
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>900||/[<>\u0000-\u001f]/.test(prompt)||this.images.size>=8)throw Error('LOCAL_IMAGE_INVALID');
  const controller=new AbortController();this.controller=controller;
  try{
   const directory=await this.pack.verifiedDirectory(controller.signal);
   if(controller.signal.aborted||this.blocked())throw Error('LOCAL_IMAGE_CANCELLED');
   const data=await this.run(directory,prompt.trim(),controller.signal);
   if(controller.signal.aborted||this.blocked())throw Error('LOCAL_IMAGE_CANCELLED');
   if(data.length>16*1024*1024)throw Error('LOCAL_IMAGE_INVALID');
   const sharp=(await import('sharp')).default;
   const metadata=await sharp(data,{limitInputPixels:1920*1080}).metadata();
   if(metadata.format!=='png'||metadata.width!==1024||metadata.height!==576)throw Error('LOCAL_IMAGE_INVALID');
   if(controller.signal.aborted||this.blocked())throw Error('LOCAL_IMAGE_CANCELLED');
   const id=randomUUID();this.images.set(id,data);return{id,preview:'data:image/png;base64,'+data.toString('base64')};
  }finally{if(this.controller===controller)this.controller=undefined}
 }
 async accept(ids:unknown){
  if(this.blocked()||this.busy)throw Error('LOCAL_IMAGE_BUSY');
  if(!Array.isArray(ids)||ids.length>8||ids.some(id=>typeof id!=='string'||!this.images.has(id)))throw Error('LOCAL_IMAGE_INVALID');
  const result:string[]=[];
  for(const id of ids){if(this.blocked())throw Error('LOCAL_IMAGE_BUSY');const asset=await this.save({name:'KI-Motiv',kind:'image',extension:'png',data:this.images.get(id)!});result.push(asset.url)}
  return result;
 }
}
