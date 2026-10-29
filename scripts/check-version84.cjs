'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {loadLocalDataModule}=require('./export-regional-corpus.cjs');
const {getRegionalPartialRelease}=loadLocalDataModule(path.resolve(__dirname,'..'),'shared/regional/availability.ts');
function requiresFullRegionalCatalog(version){
  const match=/^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/.exec(version);
  return Boolean(match&&(Number(match[1])>0||Number(match[2])>=95));
}
function regionalPublicationIssues(version,interfaceIssues,documentationIssues,partialScope){
  const match=/^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/.exec(version);
  if(!match)return ['invalid release version'];
  if(Number(match[1])===0&&Number(match[2])<84)return [];
  const partial=getRegionalPartialRelease(partialScope?.manifest),inventory=partialScope?.inventory;
  if(partial&&version===partial.version&&partialScope.disclosed===true&&inventory?.complete===false
    &&partial.inventoryFingerprint===inventory.sourceFingerprint&&Array.isArray(inventory.entries)){
    const disclosedPending=new Set(['inventory: incomplete',...inventory.entries
      .filter(entry=>entry.status==='review-required').map(entry=>`inventory: ${entry.key} requires classification`)]);
    return [...interfaceIssues.filter(issue=>!disclosedPending.has(issue)),...documentationIssues];
  }
  return [...interfaceIssues,...documentationIssues];
}
function runRegionalPublicationGate(directory=path.resolve(__dirname,'..')){
  const read=filename=>JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8'));
  const version=read('package.json').version;
  if(requiresFullRegionalCatalog(version)){
    const result=require('./check-v95-regional-completion.cjs').checkV95Completion(directory);
    if(result.complete)console.log('Complete31-region publication gate passed.');
    else console.error(`Publication blocked: ${result.issues.length} incomplete entries in the full31-region catalog.`);
    return result.issues;
  }
  if(regionalPublicationIssues(version,['required'],[]).length===0){
    console.log(`v84 completeness gate not activated for package ${version}; this does not certify v84 resources.`);return [];
  }
  const {checkRegionalCoverage,checkInventoryFreshness}=require('./check-regional-resources.cjs');
  const {generateInventory}=require('./inventory-regional-texts.cjs');
  const {checkDocumentationCorpus}=require('./check-regional-documentation.cjs');
  const {releaseRegionalVariants:regions}=loadLocalDataModule(directory,'shared/regional/catalog.ts');
  const {isRegionalSelectionAvailable}=loadLocalDataModule(directory,'shared/regional/availability.ts');
  const packs={},docs={};
  for(const {id} of regions){
    const pack=`shared/regional/packs/${id}.json`,doc=`src/regional/docs/${id}.json`;
    if(fs.existsSync(path.join(directory,pack)))packs[id]=read(pack);
    if(fs.existsSync(path.join(directory,doc)))docs[id]=read(doc);
  }
  const inventory=read('src/regional/inventory.json');
  const availability=read('shared/regional/availability.json'),partial=getRegionalPartialRelease(availability);
  const current=read('public/releases.json').versions?.[0]?.builds?.[0];
  const disclosed=Boolean(partial&&current?.version===version&&current.current===true
    &&current.sections?.known?.some(item=>item.text?.de?.includes(partial.notice))
    &&fs.readFileSync(path.join(directory,'RELEASE_NOTES.md'),'utf8').includes(partial.notice));
  const issues=regionalPublicationIssues(version,
    [...checkInventoryFreshness(inventory,generateInventory(directory)),...checkRegionalCoverage({regions,inventory,packs,docs})],
    [...checkDocumentationCorpus(directory).issues,...(isRegionalSelectionAvailable(availability)?[]:[`regional selector: approved${regions.length}-variant manifest not enabled`])],
    {manifest:availability,inventory,disclosed});
  if(issues.length){
    console.error(`v84 publication blocked: ${issues.length} incomplete or invalid resource entries.`);
    for(const issue of issues.slice(0,15))console.error(`- ${issue}`);
  }else console.log(partial?'v84 disclosed partial UI release gate passed; this does not certify complete localization.':'v84 complete regional resource gate passed.');
  return issues;
}
module.exports={regionalPublicationIssues,runRegionalPublicationGate,requiresFullRegionalCatalog};
if(require.main===module){
  try{if(runRegionalPublicationGate().length)process.exitCode=1}catch(error){console.error(error);process.exitCode=1}
}
