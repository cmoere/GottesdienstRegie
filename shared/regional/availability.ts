import {regionalVariants} from './catalog';
/** Never expose a partial list as the finished31-variant feature. */
export function isRegionalSelectionAvailable(value:unknown):boolean{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  if(!['schemaVersion','complete','regionIds'].every(key=>Object.hasOwn(value,key)))return false;
  const item=value as {schemaVersion?:unknown;complete?:unknown;regionIds?:unknown};
  return item.schemaVersion===1&&item.complete===true&&Array.isArray(item.regionIds)
    &&item.regionIds.length===regionalVariants.length
    &&regionalVariants.every((region,index)=>(item.regionIds as unknown[])[index]===region.id);
}
