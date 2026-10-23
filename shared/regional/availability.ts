import {releaseRegionalVariants} from './catalog';
export const REGIONAL_PARTIAL_NOTICE='Regionalvarianten sind noch nicht vollständig übersetzt. Fehlende UI-Texte werden auf Hochdeutsch angezeigt.';
type PartialRelease={version:'0.84.0'|'0.85.0'|'0.86.0'|'0.87.0';inventoryFingerprint:string;notice:typeof REGIONAL_PARTIAL_NOTICE};
function manifest(value:unknown):value is {schemaVersion:1;complete:boolean;regionIds:unknown[];partialRelease?:unknown}{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  if(!['schemaVersion','complete','regionIds'].every(key=>Object.hasOwn(value,key)))return false;
  if(Object.keys(value).some(key=>!['schemaVersion','complete','regionIds','partialRelease'].includes(key)))return false;
  const item=value as {schemaVersion?:unknown;complete?:unknown;regionIds?:unknown};
  return item.schemaVersion===1&&typeof item.complete==='boolean'&&Array.isArray(item.regionIds)
    &&item.regionIds.length===releaseRegionalVariants.length
    &&releaseRegionalVariants.every((region,index)=>(item.regionIds as unknown[])[index]===region.id);
}

/** Explicit version-pinned normal-update approvals never claim complete UI coverage. */
export function getRegionalPartialRelease(value:unknown):PartialRelease|null{
  if(!manifest(value)||value.complete!==false||!Object.hasOwn(value,'partialRelease'))return null;
  const partial=value.partialRelease;
  if(!partial||typeof partial!=='object'||Array.isArray(partial))return null;
  if(!['version','inventoryFingerprint','notice'].every(key=>Object.hasOwn(partial,key))||Object.keys(partial).length!==3)return null;
  const item=partial as PartialRelease;
  return (item.version==='0.84.0'||item.version==='0.85.0'||item.version==='0.86.0'||item.version==='0.87.0')&&typeof item.inventoryFingerprint==='string'&&/^[a-f0-9]{64}$/.test(item.inventoryFingerprint)
    &&item.notice===REGIONAL_PARTIAL_NOTICE?item:null;
}

/** Finished editions or an explicitly disclosed partial release; all other drafts stay hidden. */
export function isRegionalSelectionAvailable(value:unknown):boolean{
  return manifest(value)&&((value.complete===true&&!Object.hasOwn(value,'partialRelease'))||getRegionalPartialRelease(value)!==null);
}
