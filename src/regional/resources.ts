import { normalizeGermanRegion, type GermanRegionId, type RegionalPack, type RegionalSelection } from '../../shared/regional/catalog';
import { formatRegionalTemplate, validateRegionalPack, type RegionalBaseTemplates } from '../../shared/regional/validation';
import { germanBaseTemplates, getBaseTemplate, type TranslationKey } from '../i18nBase';
import type { Language } from '../preferences';

type PackageLoader=()=>Promise<unknown>;
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);

/** Packages are cached by ID, never in a mutable single "current dialect" slot. */
export function createRegionalResourceStore(loaders:Partial<Record<GermanRegionId,PackageLoader>>,base:RegionalBaseTemplates){
  const loaded=new Map<GermanRegionId,RegionalPack>();
  const pending=new Map<GermanRegionId,Promise<boolean>>();
  const listeners=new Set<()=>void>();
  let revision=0;
  function load(value:unknown):Promise<boolean>{
    const id=normalizeGermanRegion(value);
    if(!id||!own(loaders,id)||typeof loaders[id]!=='function')return Promise.resolve(false);
    if(loaded.has(id))return Promise.resolve(true);
    const previous=pending.get(id);
    if(previous)return previous;
    const operation=Promise.resolve().then(()=>loaders[id]!()).then(candidate=>{
      if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||!own(candidate,'id')||!own(candidate,'ui'))return false;
      const fields=candidate as RegionalPack;
      // Each process validates only its consumed namespace. The publication gate validates both.
      if(validateRegionalPack({id:fields.id,ui:fields.ui,native:{}},id,{ui:base.ui,native:{}}).length)return false;
      const pack=candidate as RegionalPack;
      loaded.set(id,Object.freeze({id,ui:Object.freeze({...pack.ui}),native:Object.freeze({})}));
      revision++;
      for(const listener of listeners)listener();
      return true;
    }).catch(()=>false).finally(()=>pending.delete(id));
    pending.set(id,operation);
    return operation;
  }
  function getTemplate(selection:RegionalSelection,key:string):string|undefined{
    if(selection.language!=='de')return undefined;
    const id=normalizeGermanRegion(selection.germanRegion);
    if(!id)return undefined;
    const pack=loaded.get(id);
    return pack&&own(pack.ui,key)?pack.ui[key]:undefined;
  }
  return {load,getTemplate,getSnapshot:()=>revision,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}};
}

const packageImports=import.meta.glob('../../shared/regional/packs/*.json',{import:'default'});
const loaders:Partial<Record<GermanRegionId,PackageLoader>>={};
for(const [filename,load] of Object.entries(packageImports)){
  const id=normalizeGermanRegion(filename.split('/').at(-1)?.replace(/\.json$/,''));
  if(id)loaders[id]=load;
}

// Native-dialog resources are validated independently in the main process.
export const regionalResourceStore=createRegionalResourceStore(loaders,{ui:germanBaseTemplates,native:{}});
export const loadRegionalInterfacePack=regionalResourceStore.load;

export function resolveRegionalText(selection:RegionalSelection,key:TranslationKey,values:Record<string,string|number>={}):string{
  const template=regionalResourceStore.getTemplate(selection,key)??getBaseTemplate(selection.language as Language,key);
  return formatRegionalTemplate(template,values);
}
