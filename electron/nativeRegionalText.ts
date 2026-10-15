import {normalizeRegionalSelection} from '../shared/regional/selection';
import {nativeBaseTemplates,type NativeRegionalTextKey} from '../shared/regional/nativeBase';
import {formatRegionalTemplate,validateRegionalPack} from '../shared/regional/validation';
import type {GermanRegionId,RegionalSelection} from '../shared/regional/catalog';

const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);

/** Independent from renderer state: new dialogs use the last selected validated snapshot. */
export function createNativeRegionalText(load:(id:GermanRegionId)=>Promise<unknown>){
  let selection:RegionalSelection={language:'de',germanRegion:null};
  const cache=new Map<GermanRegionId,Readonly<Record<NativeRegionalTextKey,string>>>();
  const pending=new Map<GermanRegionId,Promise<boolean>>();
  async function select(value:unknown):Promise<boolean>{
    const selected=normalizeRegionalSelection(value);
    selection=selected;
    const id=selected.germanRegion;
    if(selected.language!=='de'||!id)return true;
    if(cache.has(id))return true;
    const previous=pending.get(id);
    if(previous)return previous;
    const task=Promise.resolve().then(()=>load(id)).then(candidate=>{
      if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||!own(candidate,'id')||!own(candidate,'native'))return false;
      const fields=candidate as {id:unknown;native:unknown};
      if(validateRegionalPack({id:fields.id,ui:{},native:fields.native},id,{ui:{},native:nativeBaseTemplates}).length)return false;
      cache.set(id,Object.freeze({...fields.native as Record<NativeRegionalTextKey,string>}));
      return true;
    }).catch(()=>false).finally(()=>pending.delete(id));
    pending.set(id,task);
    return task;
  }
  function text(key:NativeRegionalTextKey,values:Record<string,string|number>={}):string{
    const translated=selection.language==='de'&&selection.germanRegion?cache.get(selection.germanRegion)?.[key]:undefined;
    return formatRegionalTemplate(translated??nativeBaseTemplates[key],values);
  }
  return {select,text};
}
