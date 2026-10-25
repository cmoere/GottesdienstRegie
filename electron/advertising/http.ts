import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {advertisingUrl} from '../../shared/advertising';
export function publicAdAddress(address:string):boolean{
 const family=isIP(address);if(family===4){const [a,b]=address.split('.').map(Number);return a!==0&&a!==10&&a!==127&&a<224&&!(a===169&&b===254)&&!(a===172&&b>=16&&b<=31)&&!(a===192&&(b===168||b===0))&&!(a===100&&b>=64&&b<=127)&&!(a===198&&(b===18||b===19))}
 if(family===6){const value=address.toLowerCase();return value!=='::'&&value!=='::1'&&!/^(fc|fd|fe[89ab]|ff|::ffff:)/.test(value)}return false;
}
export async function fetchAdBytes(value:string,limit:number,deadline=Date.now()+20000,redirects=0):Promise<{bytes:Buffer;type:string}>{
 const url=new URL(advertisingUrl(value)),hostname=url.hostname.replace(/^\[|\]$/g,'');
 let timer:ReturnType<typeof setTimeout>|undefined;
 const addresses=isIP(hostname)?[{address:hostname,family:isIP(hostname)}]:await Promise.race([lookup(hostname,{all:true}),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(Error('Die Werbequelle konnte nicht aufgelöst werden.')),Math.max(1,Math.min(10000,deadline-Date.now())))})]).finally(()=>clearTimeout(timer));
 if(!addresses.length||addresses.some(item=>!publicAdAddress(item.address)))throw Error('Die Werbequelle verwendet keine öffentliche Adresse.');
 const remaining=deadline-Date.now();if(remaining<=0)throw Error('Die Werbequelle antwortet nicht rechtzeitig.');
 return new Promise((resolve,reject)=>{
  const request=https.get(url,{headers:{'User-Agent':'GottesdienstRegie/Advertising','Accept':'video/mp4,video/webm,image/png,image/jpeg,image/webp,application/xml,text/xml'},lookup:((_host:any,options:any,callback:any)=>{if(options?.all)callback(null,addresses);else callback(null,addresses[0].address,addresses[0].family)}) as any},response=>{
   const status=response.statusCode??0;
   if([301,302,303,307,308].includes(status)){const location=response.headers.location;response.destroy();if(!location||redirects>=3){reject(Error('Zu viele Weiterleitungen der Werbequelle.'));return}void fetchAdBytes(new URL(location,url).href,limit,deadline,redirects+1).then(resolve,reject);return}
   if(status<200||status>=300||Number(response.headers['content-length'])>limit){response.destroy();reject(Error('Die Werbequelle ist nicht verfügbar oder zu groß.'));return}
   let size=0;const chunks:Buffer[]=[];response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>limit){response.destroy();reject(Error('Das Werbemedium ist zu groß.'))}else chunks.push(chunk)});response.on('error',reject);response.on('end',()=>resolve({bytes:Buffer.concat(chunks),type:String(response.headers['content-type']??'').split(';')[0].trim()}));
  });
  const timer=setTimeout(()=>request.destroy(Error('Die Werbequelle antwortet nicht rechtzeitig.')),remaining);request.on('error',reject);request.on('close',()=>clearTimeout(timer));
 });
}
