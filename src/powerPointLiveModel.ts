import {create} from 'zustand';
export type PowerPointSurface={sessionId:string;generation:string};
export const usePowerPointStatus=create<{phase:'idle'|'preparing'|'playing'|'paused'|'error';code:string;clickIndex:number;clickCount:number}>(()=>({phase:'idle',code:'',clickIndex:0,clickCount:0}));
export function originalPowerPointRequest(item:{metadata?:Record<string,unknown>}|undefined,slide:{sourceSlideId?:unknown}){
 const hash=item?.metadata?.powerPointSourceHash,id=slide.sourceSlideId;
 if(item?.metadata?.importMode!=='original'||typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash)||typeof id!=='string'||!/^\d{1,10}$/.test(id))return null;
 const slideId=Number(id);return Number.isSafeInteger(slideId)&&slideId>0&&slideId<=2147483647?{sourceHash:hash,slideId}:null;
}
export function readPowerPointSurface(value:unknown):PowerPointSurface|null{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!=='generation,sessionId')return null;
 const v=value as PowerPointSurface;
 return typeof v.sessionId==='string'&&/^[a-f0-9]{32}$/.test(v.sessionId)&&typeof v.generation==='string'&&/^[a-f0-9]{32}$/.test(v.generation)?{sessionId:v.sessionId,generation:v.generation}:null;
}
type NativeDirection='next'|'previous';
let navigate:((direction:NativeDirection)=>boolean)|undefined;
let bypass=false;
export function installPowerPointNavigation(handler:(direction:NativeDirection)=>boolean){navigate=handler;return()=>{if(navigate===handler)navigate=undefined}}
export function interceptPowerPointNavigation(direction:NativeDirection){return !bypass&&navigate?.(direction)===true}
export function withoutPowerPointNavigation(action:()=>void){const old=bypass;bypass=true;try{action()}finally{bypass=old}}
