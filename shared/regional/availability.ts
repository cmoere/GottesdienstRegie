import {releaseRegionalVariants} from './catalog';
/** Only the explicitly approved release scope can be enabled; drafts remain hidden. */
export function isRegionalSelectionAvailable(value:unknown):boolean{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  if(!['schemaVersion','complete','regionIds'].every(key=>Object.hasOwn(value,key)))return false;
  const item=value as {schemaVersion?:unknown;complete?:unknown;regionIds?:unknown};
  return item.schemaVersion===1&&item.complete===true&&Array.isArray(item.regionIds)
    &&item.regionIds.length===releaseRegionalVariants.length
    &&releaseRegionalVariants.every((region,index)=>(item.regionIds as unknown[])[index]===region.id);
}
