import {getResponder,type Responder,type CiaoService} from '@homebridge/ciao';
import {LOCAL_MONITOR_HOSTNAME,type LocalMonitorAddressState} from '../shared/localMonitorAddress';

/** Uses mDNS probing and interface updates; never changes the operating-system hostname. */
export class LocalMonitorAddress{
 private responder?:Responder;
 private service?:CiaoService;
 private generation=0;
 private timer?:ReturnType<typeof setTimeout>;
 private cancelStart?:()=>void;
 constructor(private readonly changed:(state:LocalMonitorAddressState)=>void){}
 private release(){
  this.cancelStart?.();this.cancelStart=undefined;
  if(this.timer)clearTimeout(this.timer);this.timer=undefined;this.service=undefined;
  const responder=this.responder;this.responder=undefined;
  if(responder)void responder.shutdown().catch(()=>{});
 }
 async start(port:number){
  if(this.responder)return;
  const generation=++this.generation;
  this.changed({status:'starting'});
  const unavailable=()=>{if(generation!==this.generation)return;++this.generation;this.changed({status:'unavailable'});this.release()};
  try{
   const responder=this.responder=getResponder();
   const service=this.service=responder.createService({name:'GottesdienstRegie',hostname:'regie',type:'https',port,disabledIpv6:true,txt:{path:'/lichtoperator'}});
   service.on('hostname-change',()=>{
    if(generation!==this.generation)return;
    ++this.generation;this.changed({status:'conflict'});this.release();
   });
   await Promise.race([service.advertise(),new Promise<never>((_,reject)=>{this.timer=setTimeout(()=>reject(Error('MDNS_TIMEOUT')),10000);this.cancelStart=()=>reject(Error('MDNS_STOPPED'))})]);
   if(generation!==this.generation)return;
   if(this.timer)clearTimeout(this.timer);this.timer=undefined;this.cancelStart=undefined;
   if(service.getHostname().toLowerCase().replace(/\.$/,'')!==LOCAL_MONITOR_HOSTNAME){++this.generation;this.changed({status:'conflict'});this.release();return}
   this.changed({status:'ready',hostname:LOCAL_MONITOR_HOSTNAME});
  }catch{unavailable()}
 }
 stop(){++this.generation;this.release();this.changed({status:'unavailable'})}
}
