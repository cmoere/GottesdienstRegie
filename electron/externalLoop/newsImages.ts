import sharp from 'sharp';
import type {NewsSource} from '../../shared/externalLoop';

export type ImageSource=NewsSource|'football';
const hosts:Record<ImageSource,string[]>={
 'westfalen-blatt':['asc-images.forward-publishing.io','www.westfalen-blatt.de'],
 'wdr-owl':['www1.wdr.de','www.wdr.de','images.wdr.de'],
 football:['upload.wikimedia.org','i.imgur.com','assets.dfb.de','www.openligadb.de','www.bundesliga.com'],
};
export function approvedImageUrl(source:ImageSource,value:string):string|null{
 try{
  const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port||!hosts[source].includes(url.hostname))return null;
  url.hash='';
  // Wikimedia provides raster thumbnails, so untrusted SVG is never decoded here.
  if(source==='football'&&url.hostname==='upload.wikimedia.org'&&url.pathname.endsWith('.svg')&&!url.pathname.includes('/thumb/')){
   const parts=url.pathname.split('/');parts.splice(3,0,'thumb');url.pathname=parts.join('/')+'/250px-'+parts.at(-1)+'.png';
  }
  if(/\.svg(?:$|[/?])/i.test(url.pathname)&&!url.pathname.endsWith('.png'))return null;
  return url.href;
 }catch{return null}
}
/** Bounded central raster preparation. Outputs receive data, never remote URLs. */
export function createPreparedImageLoader(fetchImpl:typeof fetch=fetch){
 const cached=new Map<string,{at:number;data:Promise<string|null>}>();let active=0;
 const queue:Array<()=>void>=[];
 return async(source:ImageSource,value:string,signal:AbortSignal):Promise<string|null>=>{
  const url=approvedImageUrl(source,value);if(!url||signal.aborted)return null;
  const old=cached.get(url);if(old&&Date.now()-old.at<21600000)return old.data;
  if(queue.length>=32)return null;
  const work=(async()=>{
   if(active>=4)await new Promise<void>(resolve=>queue.push(resolve));active++;
   try{
    if(signal.aborted)return null;
    let rejectDeadline:(error:Error)=>void=()=>{};const deadline=new Promise<never>((_resolve,reject)=>{rejectDeadline=reject});
    const controller=new AbortController(),abort=()=>{controller.abort();rejectDeadline(Error('image-timeout-or-abort'))};signal.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,10000);
    try{
     let next=url,bytes:Buffer|null=null;
     for(let redirects=0;redirects<=3;redirects++){
      const response=await Promise.race([fetchImpl(next,{signal:controller.signal,redirect:'manual',headers:{Accept:'image/jpeg,image/png,image/webp','User-Agent':'GottesdienstRegie/ExternalLoop'}}),deadline]);
      if([301,302,303,307,308].includes(response.status)){
       await response.body?.cancel();const location=response.headers.get('location'),target=location?approvedImageUrl(source,new URL(location,next).href):null;
       if(!target||new URL(target).origin!==new URL(url).origin||redirects===3)return null;next=target;continue;
      }
      if(!response.ok||!/^image\/(jpeg|png|webp)(?:;|$)/i.test(response.headers.get('content-type')??'')||Number(response.headers.get('content-length'))>4194304){await response.body?.cancel();return null}
      const reader=response.body?.getReader();if(!reader)return null;let size=0;const chunks:Buffer[]=[];
      const cancel=()=>{void reader.cancel().catch(()=>{})};controller.signal.addEventListener('abort',cancel,{once:true});
      try{while(true){const part=await Promise.race([reader.read(),deadline]);if(controller.signal.aborted)return null;if(part.done)break;size+=part.value.byteLength;if(size>4194304){await reader.cancel();return null}chunks.push(Buffer.from(part.value))}}finally{controller.signal.removeEventListener('abort',cancel);reader.releaseLock()}
      bytes=Buffer.concat(chunks);break;
     }
     if(!bytes||controller.signal.aborted)return null;
     const raster=bytes.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]))||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP');
     if(!raster)return null;
     const meta=await sharp(bytes,{limitInputPixels:16777216,animated:false}).metadata();
     if(!['jpeg','png','webp'].includes(meta.format??'')||(meta.pages??1)>1)return null;
     const stages=source==='football'?[[128,128,72]]:[[1024,720,72],[1024,720,54],[768,576,50],[640,480,40]];
     for(const [width,height,quality] of stages){
      if(controller.signal.aborted)return null;
      const output=await sharp(bytes,{limitInputPixels:16777216}).timeout({seconds:3}).rotate().resize(width,height,{fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality}).toBuffer();
      if(!controller.signal.aborted&&output.length<=(source==='football'?16384:98304))return 'data:image/jpeg;base64,'+output.toString('base64');
     }
     return null;
    }finally{clearTimeout(timer);signal.removeEventListener('abort',abort)}
   }catch{return null}finally{active--;queue.shift()?.()}
  })();
  cached.set(url,{at:Date.now(),data:work});while(cached.size>64)cached.delete(cached.keys().next().value!);
  const result=await work;if(result===null)cached.delete(url);return result;
 };
}
