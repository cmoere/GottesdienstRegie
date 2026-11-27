/** Fixed public display contract. Worker administration never crosses this boundary. */
export const TRANSIT_STOP_ID='de:05711:5075';
export const TRANSIT_STOP_NAME='Bielefeld, Beckhausstraße';
export const TRANSIT_KEY='transit:beckhausstrasse';
export const TRANSIT_MAX_AGE_MS=120000;
export const TRANSIT_LINES=['2','27','N8','N12','SEV'] as const;
export const TRANSIT_DESIGNS=['classic','board','clear','split','tiles','focus'] as const;
export type TransitDesign=typeof TRANSIT_DESIGNS[number];
export type TransitDeparture={line:string;destination:string;platform:string;plannedAt:number;effectiveAt:number;delayMinutes:number;cancelled:boolean;status:string;via:string[]};
export type TransitMessage={id:string;title:string;text:string;lines:string[]};
export type TransitPayload={kind:'transit';stopId:typeof TRANSIT_STOP_ID;stopName:typeof TRANSIT_STOP_NAME;walkMinutes:6;messagesUpdatedAt:number;departures:TransitDeparture[];messages:TransitMessage[]};
export type TransitSettings={kind:'transit';design:TransitDesign;limit:number;rows:number;lines:string[];showPlatform:boolean;showRealtime:boolean;showVia:boolean;showMessages:boolean;durationSeconds:number};
const bounded=(value:unknown,min:number,max:number,fallback:number)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback};
export function transitSettings(input:Record<string,unknown>):TransitSettings{
 const source=input.transitLines===undefined?TRANSIT_LINES:Array.isArray(input.transitLines)?input.transitLines:String(input.transitLines).split(',');
 return{kind:'transit',design:TRANSIT_DESIGNS.includes(input.transitDesign as TransitDesign)?input.transitDesign as TransitDesign:'classic',limit:bounded(input.transitLimit,4,24,12),rows:bounded(input.transitRows,4,6,6),lines:TRANSIT_LINES.filter(line=>source.includes(line)),showPlatform:input.transitShowPlatform!==false,showRealtime:input.transitShowRealtime!==false,showVia:input.transitShowVia===true,showMessages:input.transitShowMessages!==false,durationSeconds:bounded(input.durationSeconds,1,86400,30)};
}
export function transitSettingsMetadata(settings:TransitSettings):Record<string,string|number|boolean>{return{externalKind:'transit',transitDesign:settings.design,transitLimit:settings.limit,transitRows:settings.rows,transitLines:settings.lines.join(','),transitShowPlatform:settings.showPlatform,transitShowRealtime:settings.showRealtime,transitShowVia:settings.showVia,transitShowMessages:settings.showMessages,durationSeconds:settings.durationSeconds}}
export function visibleTransit(payload:TransitPayload,settings:TransitSettings,now?:number):TransitPayload{
 return{...payload,departures:payload.departures.filter(row=>settings.lines.includes(row.line)&&(now===undefined||(row.cancelled?row.plannedAt:row.effectiveAt)>now)).slice(0,settings.limit),messages:settings.showMessages?payload.messages.filter(message=>!message.lines.length||message.lines.some(line=>settings.lines.includes(line))):[]};
}
export function transitPageSize(settings:TransitSettings){return settings.design==='focus'?2:settings.rows}
export function transitMessageDuration(message:TransitMessage,settings:TransitSettings){
 const split=settings.design==='split',font=split?35:31,width=split?530:1730,height=split?570:100;
 const lines=[message.title,message.text].join('\n').split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(line.length/Math.floor(width/(font*.8)))),0);
 return Math.max(12000,10000+Math.max(0,lines*font*1.45-height)/24*2000);
}
export function transitPageDuration(rows:TransitDeparture[],settings:TransitSettings){
 const split=settings.design==='split'&&settings.showMessages,font=settings.design==='focus'?60:settings.design==='tiles'?32:split?35:41,width=settings.design==='tiles'?450:split?520:settings.design==='focus'?850:1100;
 const overflow=Math.max(0,...rows.flatMap(row=>[row.destination.length*font*.8-width,settings.showVia?('über '+row.via.join(' · ')).length*22*.8-width:0,row.status.length*20*.8-280]));
 return Math.max(12000,10000+overflow/35*2000);
}
export function transitPages(payload:TransitPayload,settings:TransitSettings){const visible=visibleTransit(payload,settings),size=transitPageSize(settings),pages=[];for(let index=0;index<visible.departures.length;index+=size){const rows=visible.departures.slice(index,index+size);pages.push({rows,duration:transitPageDuration(rows,settings)})}return pages.length?pages:[{rows:[],duration:12000}]}
export function transitMinimumDuration(payload:TransitPayload,settings:TransitSettings){const visible=visibleTransit(payload,settings);return Math.max(settings.durationSeconds*1000,transitPages(payload,settings).reduce((sum,page)=>sum+page.duration,0),visible.messages.reduce((sum,message)=>sum+transitMessageDuration(message,settings),0))}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const text=(value:unknown,max:number)=>typeof value==='string'&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const timestamp=(value:unknown)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0&&value<10000000000000;
export function validTransitPayload(value:unknown,key:string):value is TransitPayload{
 if(key!==TRANSIT_KEY||!record(value)||!exact(value,['kind','stopId','stopName','walkMinutes','messagesUpdatedAt','departures','messages'])||value.kind!=='transit'||value.stopId!==TRANSIT_STOP_ID||value.stopName!==TRANSIT_STOP_NAME||value.walkMinutes!==6||typeof value.messagesUpdatedAt!=='number'||!Number.isSafeInteger(value.messagesUpdatedAt)||value.messagesUpdatedAt<0||value.messagesUpdatedAt>10000000000000||!Array.isArray(value.departures)||value.departures.length>24||!Array.isArray(value.messages)||value.messages.length>25)return false;
 return value.departures.every(row=>record(row)&&exact(row,['line','destination','platform','plannedAt','effectiveAt','delayMinutes','cancelled','status','via'])&&TRANSIT_LINES.includes(row.line as typeof TRANSIT_LINES[number])&&text(row.destination,2000)&&!!row.destination&&text(row.platform,300)&&timestamp(row.plannedAt)&&timestamp(row.effectiveAt)&&typeof row.delayMinutes==='number'&&Number.isFinite(row.delayMinutes)&&Math.abs(row.delayMinutes)<=1440&&typeof row.cancelled==='boolean'&&text(row.status,3000)&&Array.isArray(row.via)&&row.via.length<=40&&row.via.every(stop=>text(stop,1000)))&&value.messages.every(message=>record(message)&&exact(message,['id','title','text','lines'])&&text(message.id,128)&&!!message.id&&text(message.title,3000)&&text(message.text,12000)&&!!(message.title||message.text)&&Array.isArray(message.lines)&&message.lines.length<=5&&message.lines.every(line=>TRANSIT_LINES.includes(line as typeof TRANSIT_LINES[number])));
}
