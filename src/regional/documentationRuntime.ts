import {normalizeGermanRegion,type GermanRegionId,type RegionalSelection} from '../../shared/regional/catalog';
import {createRegionalDocumentationStore,type DocumentationSource} from './documentation';
import {indexReleaseTextObjects} from './releaseIdentity';
type Loaders=Partial<Record<GermanRegionId,()=>Promise<unknown>>>;

/** Source and large packages stay lazy. Failed local reads are retryable, never marked complete. */
export function createDocumentationRuntime(loadSource:()=>Promise<DocumentationSource>,loaders:Loaders){
  let store:ReturnType<typeof createRegionalDocumentationStore>|undefined;
  let initializing:Promise<typeof store>|undefined;
  let revision=0;const listeners=new Set<()=>void>();
  async function initialize(){
    if(store)return store;
    if(!initializing)initializing=loadSource().then(source=>{
      store=createRegionalDocumentationStore(loaders,source);
      store.subscribe(()=>{revision++;for(const listener of listeners)listener()});return store;
    }).finally(()=>{initializing=undefined});
    return initializing;
  }
  return {
    async load(value:unknown){
      const id=normalizeGermanRegion(value);if(!id||!Object.hasOwn(loaders,id))return false;
      try{return await (await initialize())!.load(id)}catch{return false}
    },
    get:(selection:RegionalSelection)=>store?.get(selection),getSnapshot:()=>revision,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}},
  };
}

const imports=import.meta.glob('./docs/*.json',{import:'default'});
const loaders:Loaders={};
for(const [filename,load] of Object.entries(imports)){
  const id=normalizeGermanRegion(filename.split('/').at(-1)?.replace(/\.json$/,''));if(id)loaders[id]=load;
}
export const regionalDocumentationRuntime=createDocumentationRuntime(async()=>{
  const [{getHelpCatalog},releases]=await Promise.all([import('../help/base'),fetch('./releases.json').then(response=>response.json())]);
  const catalog=getHelpCatalog('de');
  return {help:Object.fromEntries(catalog.topics.map(article=>[article.id,{title:article.title,body:article.body,related:article.related}])),
    helpUI:catalog.ui,releases:indexReleaseTextObjects(releases).texts};
},loaders);
export const loadRegionalDocumentation=regionalDocumentationRuntime.load;
