import {randomUUID} from 'node:crypto';
export type ShareDescription={type:'offer'|'answer';sdp:string};
export type ShareStatus={id:string;deviceId:string;deviceName:string;phase:'connecting'|'ready';onMain:boolean};
export type ShareEvent={type:'offer';id:string;deviceId:string;deviceName:string;description:ShareDescription}|{type:'state';state:ShareStatus|null}|{type:'ended';id:string};
export function readShareDescription(value:unknown,type:'offer'|'answer'):ShareDescription|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;const p=value as Record<string,unknown>;
 if(Object.keys(p).some(k=>!['type','sdp'].includes(k))||p.type!==type||typeof p.sdp!=='string'||p.sdp.length>60000||!/^v=0\r?\n/.test(p.sdp)||!/(?:^|\n)m=video /.test(p.sdp)||/(?:^|\n)m=(?:audio|application) /.test(p.sdp))return null;
 return{type,sdp:p.sdp};
}
/** One ephemeral, owner-bound LAN share; no records or signaling survive restart. */
export class ScreenShareBroker{
 private active:(ShareStatus&{answer?:ShareDescription;lastSeen:number;createdAt:number})|null=null;private onAir=false;
 constructor(private emit:(event:ShareEvent)=>void,private now:()=>number=Date.now){}
 current():ShareStatus|null{const a=this.active;return a?{id:a.id,deviceId:a.deviceId,deviceName:a.deviceName,phase:a.phase,onMain:a.onMain}:null}
 begin(device:{id:string;name:string},value:unknown):ShareStatus{this.expire();const description=readShareDescription(value,'offer');if(!description)throw Error('INVALID_SCREEN_SHARE_DESCRIPTION');if(this.active)throw Error('SCREEN_SHARE_BUSY');const now=this.now();this.active={id:randomUUID(),deviceId:device.id,deviceName:device.name,phase:'connecting',onMain:false,lastSeen:now,createdAt:now};const state=this.current()!;this.emit({type:'offer',id:state.id,deviceId:device.id,deviceName:device.name,description});this.emit({type:'state',state});return state}
 poll(deviceId:string,id:string){this.expire();const a=this.active;if(!a||a.deviceId!==deviceId||a.id!==id)return null;a.lastSeen=this.now();return{...this.current()!,...(a.answer?{answer:structuredClone(a.answer)}:{})}}
 answer(id:string,value:unknown){const description=readShareDescription(value,'answer'),a=this.active;if(!a||a.id!==id||!description)return false;if(a.answer)return a.answer.sdp===description.sdp;a.answer=description;return true}
 ready(id:string){if(!this.active||this.active.id!==id||!this.active.answer)return false;this.active.phase='ready';this.emit({type:'state',state:this.current()});return true}
 take(id:string){if(!this.onAir||!this.active||this.active.id!==id||this.active.phase!=='ready')return false;this.active.onMain=true;this.emit({type:'state',state:this.current()});return true}
 setOnAir(value:boolean){const previous=this.onAir;this.onAir=value;if(previous&&!value)this.stop()}
 stop(id?:string,deviceId?:string){const a=this.active;if(!a||(id!==undefined&&a.id!==id)||(deviceId!==undefined&&a.deviceId!==deviceId))return false;this.active=null;this.emit({type:'ended',id:a.id});this.emit({type:'state',state:null});return true}
 revoke(deviceId:string){if(this.active?.deviceId===deviceId)this.stop()}
 expire(){const a=this.active;if(a&&(this.now()-a.lastSeen>15000||(a.phase==='connecting'&&this.now()-a.createdAt>60000)))this.stop()}
}
