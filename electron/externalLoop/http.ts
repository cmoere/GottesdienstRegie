export const EXTERNAL_RESPONSE_LIMIT=2*1024*1024;
const hosts=new Set(['www.westfalen-blatt.de','www1.wdr.de','api.openligadb.de','api.open-meteo.com','geocoding-api.open-meteo.com','maps.dwd.de']);
function approved(value:string):URL{
 const url=new URL(value);
 if(url.protocol!=='https:'||!hosts.has(url.hostname)||url.username||url.password||url.port)throw Error('blocked-url');
 url.hash='';return url;
}
/** One deadline covers redirects, response headers and the complete streamed body. */
export function createBoundedFetcher(fetchImpl:typeof fetch=fetch){
 return async(value:string,signal:AbortSignal):Promise<string>=>{
  const initial=approved(value);
  if(signal.aborted)throw Error('cancelled');
  const controller=new AbortController();
  let rejectDeadline:(error:Error)=>void=()=>{};
  const deadline=new Promise<never>((_resolve,reject)=>{rejectDeadline=reject});
  const cancel=()=>{controller.abort();rejectDeadline(Error('cancelled'))};
  signal.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(()=>{controller.abort();rejectDeadline(Error('timeout'))},10000);
  const operation=async()=>{
   let url=initial;
   for(let redirects=0;redirects<=3;redirects++){
    const response=await fetchImpl(url.href,{signal:controller.signal,redirect:'manual',headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, application/json, text/xml','User-Agent':'GottesdienstRegie/ExternalLoop'}});
    if(controller.signal.aborted){await response.body?.cancel();throw Error('cancelled')}
    if([301,302,303,307,308].includes(response.status)){
     await response.body?.cancel();
     if(redirects===3)throw Error('redirect-limit');
     const location=response.headers.get('location');
     if(!location)throw Error('blocked-redirect');
     try{const next=approved(new URL(location,url).href);if(next.origin!==initial.origin)throw Error();url=next}catch{throw Error('blocked-redirect')}
     continue;
    }
    if(!response.ok){await response.body?.cancel();throw Error('http-status')}
    if(Number(response.headers.get('content-length'))>EXTERNAL_RESPONSE_LIMIT){await response.body?.cancel();throw Error('size-limit')}
    const reader=response.body?.getReader();if(!reader)return '';
    const cancelBody=()=>{void reader.cancel().catch(()=>{})};
    controller.signal.addEventListener('abort',cancelBody,{once:true});
    const decoder=new TextDecoder('utf-8',{fatal:true});let bytes=0,text='';
    try{
     while(true){const part=await reader.read();if(controller.signal.aborted)throw Error('cancelled');if(part.done)break;bytes+=part.value.byteLength;if(bytes>EXTERNAL_RESPONSE_LIMIT)throw Error('size-limit');text+=decoder.decode(part.value,{stream:true})}
     return text+decoder.decode();
    }catch(error){await reader.cancel().catch(()=>{});throw error}finally{controller.signal.removeEventListener('abort',cancelBody);reader.releaseLock()}
   }
   throw Error('redirect-limit');
  };
  try{return await Promise.race([operation(),deadline])}finally{clearTimeout(timer);signal.removeEventListener('abort',cancel)}
 };
}
export const fetchBounded=createBoundedFetcher();
