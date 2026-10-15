import {normalizeGermanRegion,type GermanRegionId,type RegionalSelection} from '../../shared/regional/catalog';
import {validateRegionalPack} from '../../shared/regional/validation';

export interface DocumentationSource {
  help:Record<string,{title:string;body:string;related?:readonly string[]}>;
  helpUI:Record<string,string>;
  releases:Record<string,string>;
}
export interface RegionalDocumentation extends DocumentationSource {id:GermanRegionId}
const record=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(object:object,key:string)=>Object.prototype.hasOwnProperty.call(object,key);
const links=(text:string)=>(text.match(/https?:\/\/[^\s<>)\]]+/g)??[]).sort();

/** Full-document validation: fallback never turns a partial translation into a completed pack. */
export function validateRegionalDocumentation(candidate:unknown,id:GermanRegionId,source:DocumentationSource):string[]{
  if(!record(candidate)||candidate.id!==id)return ['id: mismatch'];
  const issues:string[]=[];
  function exactKeys(value:unknown,expected:object,prefix:string):value is Record<string,unknown>{
    if(!record(value)){issues.push(`${prefix}: missing-object`);return false}
    for(const key of Object.keys(value))if(!own(expected,key))issues.push(`${prefix}.${key}: unexpected-key`);
    return true;
  }
  function text(value:unknown,base:string,key:string){
    if(typeof value!=='string'||!value.trim()){issues.push(`${key}: missing-text`);return}
    const errors=validateRegionalPack({id,ui:{text:value},native:{}},id,{ui:{text:base},native:{}});
    if(errors.length)issues.push(`${key}: ${errors[0].code}`);
    if(JSON.stringify(links(value))!==JSON.stringify(links(base)))issues.push(`${key}: link-mismatch`);
    if(base.includes('\n\n')&&value.split(/\n\s*\n/).length!==base.split(/\n\s*\n/).length)issues.push(`${key}: paragraph-mismatch`);
  }
  for(const key of Object.keys(candidate))if(!['id','help','helpUI','releases'].includes(key))issues.push(`${key}: unexpected-key`);
  if(exactKeys(candidate.help,source.help,'help'))for(const [key,base] of Object.entries(source.help)){
    const article=candidate.help[key];
    if(!exactKeys(article,{title:0,body:0,related:0},`help.${key}`))continue;
    text(article.title,base.title,`help.${key}.title`);text(article.body,base.body,`help.${key}.body`);
    if(JSON.stringify(article.related??[])!==JSON.stringify(base.related??[]))issues.push(`help.${key}.related: identity-mismatch`);
  }
  for(const namespace of ['helpUI','releases'] as const){
    const translated=candidate[namespace];
    if(exactKeys(translated,source[namespace],namespace))for(const [key,base] of Object.entries(source[namespace]))text(translated[key],base,`${namespace}.${key}`);
  }
  return issues;
}

type Loader=()=>Promise<unknown>;
export function createRegionalDocumentationStore(loaders:Partial<Record<GermanRegionId,Loader>>,source:DocumentationSource){
  const cached=new Map<GermanRegionId,RegionalDocumentation>();
  const pending=new Map<GermanRegionId,Promise<boolean>>();
  const listeners=new Set<()=>void>();let revision=0;
  function load(value:unknown):Promise<boolean>{
    const id=normalizeGermanRegion(value);
    if(!id||!own(loaders,id)||typeof loaders[id]!=='function')return Promise.resolve(false);
    if(cached.has(id))return Promise.resolve(true);
    const previous=pending.get(id);if(previous)return previous;
    const operation=Promise.resolve().then(()=>loaders[id]!()).then(candidate=>{
      if(validateRegionalDocumentation(candidate,id,source).length)return false;
      const pack=candidate as RegionalDocumentation;
      const help=Object.fromEntries(Object.entries(pack.help).map(([key,article])=>[key,Object.freeze({title:article.title,body:article.body,...(article.related?{related:Object.freeze([...article.related])}:{})})]));
      cached.set(id,Object.freeze({id,help:Object.freeze(help),helpUI:Object.freeze({...pack.helpUI}),releases:Object.freeze({...pack.releases})}));
      revision++;for(const listener of listeners)listener();return true;
    }).catch(()=>false).finally(()=>pending.delete(id));
    pending.set(id,operation);return operation;
  }
  return {load,get:(selection:RegionalSelection)=>selection.language==='de'&&selection.germanRegion?cached.get(selection.germanRegion):undefined,
    getSnapshot:()=>revision,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}};
}
