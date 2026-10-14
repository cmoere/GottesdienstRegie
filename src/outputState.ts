import type {AppModeState} from './appMode';
import type {PublicBannerAnnouncement} from './community/AnnouncementService';
import type {BannerPosition} from './announcementBannerModel';
export type BannerOutputState={revision:number;position:BannerPosition;items:PublicBannerAnnouncement[];cycleStartedAtMs:number;reserved:boolean;textWidth?:number;reducedMotion?:boolean};
export type OutputStateSnapshot={revision:number;slide:unknown|null;quick:unknown|null;appMode:AppModeState;slideRevision?:number;quickRevision?:number;banner?:BannerOutputState|null};
export function shouldApplyOutputState(currentRevision:number,incomingRevision:number){return Number.isFinite(incomingRevision)&&incomingRevision>currentRevision}
export function changedOutputLayers(previous:OutputStateSnapshot|null,next:OutputStateSnapshot){
  const none={slide:false,quick:false,banner:false,appMode:false};
  if(previous&&!shouldApplyOutputState(previous.revision,next.revision))return none;
  return {slide:!previous||(next.slideRevision===undefined?previous.slide!==next.slide:previous.slideRevision!==next.slideRevision),quick:!previous||(next.quickRevision===undefined?previous.quick!==next.quick:previous.quickRevision!==next.quickRevision),banner:!previous||previous.banner?.revision!==next.banner?.revision||Boolean(previous.banner)!==Boolean(next.banner),appMode:!previous||previous.appMode.mode!==next.appMode.mode||previous.appMode.onAir!==next.appMode.onAir};
}
/** Undefined means invalid; null deliberately clears the layer. Reject private keys. */
export function readBannerOutputState(value:unknown):BannerOutputState|null|undefined{
  if(value===null)return null;
  if(!value||typeof value!=='object'||Array.isArray(value))return;
  const state=value as BannerOutputState;
  if(Object.keys(state).some(key=>!['revision','position','items','cycleStartedAtMs','reserved','textWidth','reducedMotion'].includes(key))||!Number.isSafeInteger(state.revision)||state.revision<0||!['top','bottom'].includes(state.position)||!Number.isFinite(state.cycleStartedAtMs)||typeof state.reserved!=='boolean'||!Array.isArray(state.items))return;
  if(state.textWidth!==undefined&&(!Number.isFinite(state.textWidth)||state.textWidth<0))return;
  if(state.reducedMotion!==undefined&&typeof state.reducedMotion!=='boolean')return;
  for(const item of state.items){
    if(!item||Object.keys(item).some(key=>!['id','text','priority','validFrom','validUntil'].includes(key))||typeof item.id!=='string'||!item.id||typeof item.text!=='string'||!item.text.trim()||!['normal','important','urgent'].includes(item.priority))return;
    for(const date of [item.validFrom,item.validUntil])if(date!==undefined&&(typeof date!=='string'||!Number.isFinite(Date.parse(date))))return;
  }
  return structuredClone(state);
}
