import type {OutputDisplayIdentity,OutputDisplayProfile,OutputDisplayProfileState,OutputDisplayRole,OutputDisplayWriteOptions} from '../src/outputDisplayProfileTypes';
export type {OutputDisplayProfile,OutputDisplayProfileState} from '../src/outputDisplayProfileTypes';
export interface ProfileDisplay {id:number;label:string;identityLabel?:string;bounds:{width:number;height:number};scaleFactor:number;rotation:number}
const roles:OutputDisplayRole[]=['operator','main','stage','notes','livestream','lobby'];
function identity(display:ProfileDisplay):OutputDisplayIdentity {
  const width=Math.round(display.bounds.width*display.scaleFactor),height=Math.round(display.bounds.height*display.scaleFactor);
  return {label:(display.identityLabel??display.label).trim(),pixelWidth:Math.min(width,height),pixelHeight:Math.max(width,height)};
}
function matches(a:OutputDisplayIdentity,b:OutputDisplayIdentity){return a.label===b.label&&a.pixelWidth===b.pixelWidth&&a.pixelHeight===b.pixelHeight}
export function normalizeOutputDisplayProfile(value:unknown):OutputDisplayProfile|null {
  if(!value||typeof value!=='object')return null;
  const profile=value as OutputDisplayProfile;
  if(profile.version!==1||!Array.isArray(profile.assignments))return null;
  const seen=new Set<string>();
  for(const entry of profile.assignments){
    if(!entry||!roles.includes(entry.role)||!Number.isFinite(entry.lastDisplayId)||!entry.identity||typeof entry.identity.label!=='string'||!Number.isFinite(entry.identity.pixelWidth)||entry.identity.pixelWidth<=0||!Number.isFinite(entry.identity.pixelHeight)||entry.identity.pixelHeight<=0||seen.has(entry.role))return null;
    seen.add(entry.role);
  }
  return structuredClone(profile);
}
export function captureOutputDisplayProfile(assignments:Record<string,string>,displays:ProfileDisplay[]):OutputDisplayProfile {
  const entries:OutputDisplayProfile['assignments']=[],seen=new Set<string>();
  for(const [displayId,role] of Object.entries(assignments)){
    if(role==='unassigned'||role==='')continue;
    if(!roles.includes(role as OutputDisplayRole)||seen.has(role))throw new Error('Ungültige oder doppelte Bildschirmrolle.');
    const display=displays.find(item=>item.id===Number(displayId));
    if(!display)throw new Error('Der zugewiesene Bildschirm ist nicht mehr verbunden.');
    entries.push({role:role as OutputDisplayRole,lastDisplayId:display.id,identity:identity(display)});seen.add(role);
  }
  return {version:1,assignments:entries};
}
export function resolveOutputDisplayProfile(value:unknown,displays:ProfileDisplay[]):OutputDisplayProfileState {
  const profile=normalizeOutputDisplayProfile(value),assignments:Record<string,string>={},unresolved:OutputDisplayProfileState['unresolved']=[];
  const candidates=(profile?.assignments??[]).map(entry=>{
    const exact=displays.find(display=>display.id===entry.lastDisplayId&&matches(entry.identity,identity(display)));
    const matching=exact?[exact]:entry.identity.label?displays.filter(display=>matches(entry.identity,identity(display))):[];
    return {entry,matching};
  });
  for(const {entry,matching} of candidates){
    const display=matching.length===1?matching[0]:undefined;
    const collision=display&&candidates.some(candidate=>candidate.entry!==entry&&candidate.matching.length===1&&candidate.matching[0].id===display.id);
    if(display&&!collision)assignments[String(display.id)]=entry.role;
    else unresolved.push({role:entry.role,lastDisplayId:entry.lastDisplayId,label:entry.identity.label,reason:matching.length>1||collision?'ambiguous':'missing'});
  }
  return {profile,assignments,unresolved};
}
export function mergeOutputDisplayProfile(previous:unknown,assignments:Record<string,string>,displays:ProfileDisplay[],options:OutputDisplayWriteOptions={}):OutputDisplayProfile {
  const next=captureOutputDisplayProfile(assignments,displays),old=resolveOutputDisplayProfile(previous,displays);
  const clear=options.clearRoles??[];
  if(!Array.isArray(clear)||clear.some(role=>!roles.includes(role)))throw new Error('Ungültige Bildschirmrolle.');
  const retained=new Set(old.unresolved.map(entry=>entry.role));
  for(const entry of old.profile?.assignments??[]){
    if(retained.has(entry.role)&&!clear.includes(entry.role)&&!next.assignments.some(item=>item.role===entry.role))next.assignments.push(entry);
  }
  return next;
}
