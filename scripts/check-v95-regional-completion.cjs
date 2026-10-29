'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadLocalDataModule,getGermanDocumentationSource}=require('./export-regional-corpus.cjs');
const {checkRegionalCoverage,checkInventoryFreshness}=require('./check-regional-resources.cjs');
const {checkDocumentationPacks}=require('./check-regional-documentation.cjs');
const {generateInventory}=require('./inventory-regional-texts.cjs');

/** Audits the entire requested catalog, independently of the older 15-region
 * release allowlist. Draft translations never count as runtime coverage. */
function checkV95Completion(directory=path.resolve(__dirname,'..')){
 const read=filename=>{const file=path.join(directory,filename);return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):undefined};
 const {regionalVariants:regions,releaseRegionalVariants}=loadLocalDataModule(directory,'shared/regional/catalog.ts');
 const source=getGermanDocumentationSource(directory);
 const {validateRegionalDocumentation}=loadLocalDataModule(directory,'src/regional/documentation.ts');
 const packs={},docs={},drafts=[];
 for(const {id}of regions){
  const pack=read(`shared/regional/packs/${id}.json`),doc=read(`src/regional/docs/${id}.json`);
  if(pack)packs[id]=pack;if(doc)docs[id]=doc;
  const draft=read(`docs/regional-v95/help-drafts/${id}.json`);
  if(draft){
   const selected=Object.fromEntries(Object.keys(draft.help??{}).filter(key=>Object.hasOwn(source.help,key)).map(key=>[key,source.help[key]]));
   const issues=validateRegionalDocumentation({...draft,releases:{}},id,{help:selected,helpUI:source.helpUI,releases:{}});
   const releaseDraft=read(`docs/regional-v95/release-drafts/${id}.json`);
   const releaseFields=releaseDraft?.releases??{};
   const selectedReleases=Object.fromEntries(Object.keys(releaseFields).filter(key=>Object.hasOwn(source.releases,key)).map(key=>[key,source.releases[key]]));
   const releaseIssues=validateRegionalDocumentation({id,help:{},helpUI:{},releases:releaseFields},id,{help:{},helpUI:{},releases:selectedReleases});
   drafts.push({id,articles:Object.keys(draft.help??{}).length,releaseFields:Object.keys(releaseFields).length,issues:[...issues,...releaseIssues]});
  }
 }
 const inventory=read('src/regional/inventory.json'),availability=read('shared/regional/availability.json');
 const documentation=checkDocumentationPacks(regions,source,docs);
 const issues=[...checkInventoryFreshness(inventory,generateInventory(directory)),
  ...checkRegionalCoverage({regions,inventory,packs,docs}),...documentation.issues,
  ...drafts.flatMap(draft=>draft.issues.map(issue=>`draft ${draft.id}: ${issue}`))];
 const ids=regions.map(region=>region.id);
 if(availability?.complete!==true||JSON.stringify(availability.regionIds)!==JSON.stringify(ids)
   ||JSON.stringify(releaseRegionalVariants.map(region=>region.id))!==JSON.stringify(ids))issues.push('availability: all31 completed variants are not enabled');
 return {complete:issues.length===0,regions:regions.length,interfacePacks:Object.keys(packs).length,
  documentationPacks:Object.keys(docs).length,helpArticlesPerRegion:Object.keys(source.help).length,
  releaseFieldsPerRegion:Object.keys(source.releases).length,
  sourceEntriesAwaitingReview:inventory.entries.filter(entry=>entry.status==='review-required').length,
  draftArticles:drafts.reduce((sum,draft)=>sum+draft.articles,0),drafts,issues};
}
module.exports={checkV95Completion};
if(require.main===module){
 const result=checkV95Completion();
 console.log(JSON.stringify(process.argv.includes('--json')?result:{...result,issues:result.issues.slice(0,12)},null,2));
 if(!result.complete)process.exitCode=1;
}
