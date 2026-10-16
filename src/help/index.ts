import type {GermanRegionId} from '../../shared/regional/catalog';
import {getHelpCatalog as getBaseHelpCatalog,type HelpArticle,type HelpUI} from './base';
import {regionalDocumentationRuntime} from '../regional/documentationRuntime';
export {helpLanguages,stableGerman} from './base';
export type {HelpArticle,HelpUI} from './base';
const catalogs=new WeakMap<object,{topics:HelpArticle[];ui:HelpUI}>();
export function getHelpCatalog(language:string,germanRegion:GermanRegionId|null=null){
  const base=getBaseHelpCatalog(language);
  const pack=regionalDocumentationRuntime.get({language,germanRegion});
  if(!pack)return base;
  let catalog=catalogs.get(pack);
  if(!catalog){
    catalog={topics:base.topics.map(article=>({...article,...pack.help[article.id],related:article.related})),ui:{...base.ui,...pack.helpUI}};
    catalogs.set(pack,catalog);
  }
  return catalog;
}
export function getHelpArticle(id:string,language:string,germanRegion:GermanRegionId|null=null){
  return getHelpCatalog(language,germanRegion).topics.find(article=>article.id===id);
}
