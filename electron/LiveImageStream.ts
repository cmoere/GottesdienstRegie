import type {ServerResponse} from 'node:http';
/** A single newest frame per viewer. Backpressure never creates a frame queue. */
export async function streamLiveImages(res:ServerResponse,read:()=>Promise<Buffer|null>){
 let closed=false;const stop=()=>{closed=true;wake?.()};let wake:(()=>void)|undefined;
 res.once('close',stop);
 const wait=(ms:number)=>new Promise<void>(resolve=>{const finish=()=>{clearTimeout(timer);wake=undefined;resolve()},timer=setTimeout(finish,ms);wake=finish;if(closed)finish()});
 const drain=()=>new Promise<void>(resolve=>{const finish=()=>{res.removeListener('drain',finish);wake=undefined;resolve()};wake=finish;res.once('drain',finish);if(closed)finish()});
 try{
  let started=false;
  while(!closed){
   const at=Date.now(),bytes=await read();if(closed)break;
   if(!bytes){if(!started)res.writeHead(503,{'cache-control':'no-store'});break}
   if(!started){res.writeHead(200,{'content-type':'multipart/x-mixed-replace; boundary=regieframe','cache-control':'no-store, no-cache','x-content-type-options':'nosniff','x-accel-buffering':'no'});res.socket?.setNoDelay(true);started=true}
   const frame=Buffer.concat([Buffer.from('--regieframe\r\nContent-Type: image/jpeg\r\nContent-Length: '+bytes.length+'\r\n\r\n'),bytes,Buffer.from('\r\n')]);
   if(!res.write(frame))await drain();
   if(!closed)await wait(Math.max(0,80-(Date.now()-at)));
  }
 }finally{res.removeListener('close',stop);if(!closed)res.end()}
}
