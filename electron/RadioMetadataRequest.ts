import https from 'node:https';
import type {ClientRequest,IncomingMessage} from 'node:http';

type GetRequest=(url:string,options:Record<string,unknown>,callback:(response:IncomingMessage)=>void)=>ClientRequest;

export function openRadioMetadataStream(streamUrl:string,onOpen:(response:IncomingMessage)=>void,get:GetRequest=https.get,maxRedirects=5){
  let current:ClientRequest|undefined;
  let stopped=false;

  const open=(target:string,redirectsLeft:number,base?:URL)=>{
    if(stopped)return;
    let url:URL;
    try{url=new URL(target,base)}catch{return}
    if(url.protocol!=='https:')return;

    current=get(url.href,{headers:{'Icy-MetaData':'1','User-Agent':'GottesdienstRegie/66'},timeout:12_000},response=>{
      const status=response.statusCode??0;
      if(stopped||status<200||status>=300){
        response.resume();
        const location=response.headers.location;
        if(status>=300&&status<400&&location&&redirectsLeft>0){
          open(location,redirectsLeft-1,url);
        }
        return;
      }
      onOpen(response);
    });
    current.on('error',()=>{});
  };

  open(streamUrl,maxRedirects);
  return{destroy(){stopped=true;current?.destroy()}};
}
