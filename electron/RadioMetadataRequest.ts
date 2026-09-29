import https from 'node:https';
import type {ClientRequest,IncomingMessage} from 'node:http';

type GetRequest=(url:string,options:Record<string,unknown>,callback:(response:IncomingMessage)=>void)=>ClientRequest;

export function openRadioMetadataStream(streamUrl:string,onOpen:(response:IncomingMessage)=>void,get:GetRequest=https.get,maxRedirects=5){
  let current:ClientRequest|undefined,stopped=false;
  const open=(url:string,redirectsLeft:number)=>{
    current=get(url,{headers:{'Icy-MetaData':'1','User-Agent':'GottesdienstRegie/66'},timeout:12_000},response=>{
      const location=response.headers.location,status=response.statusCode??0;
      if(status>=300&&status<400&&location&&redirectsLeft>0){response.resume();if(!stopped)open(new URL(location,url).toString(),redirectsLeft-1);return}
      onOpen(response);
    });
    current.on('error',()=>{});
  };
  open(streamUrl,maxRedirects);
  return{destroy(){stopped=true;current?.destroy()}};
}
