'use strict';
const fs=require('node:fs');
const path=require('node:path');
function regionalPublicationIssues(version,interfaceIssues,documentationIssues){
  const match=/^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/.exec(version);
  if(!match)return ['invalid release version'];
  if(Number(match[1])===0&&Number(match[2])<84)return [];
  return [...interfaceIssues,...documentationIssues];
}
function runRegionalPublicationGate(directory=path.resolve(__dirname,'..')){
  const read=filename=>JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8'));
  const version=read('package.json').version;
  if(regionalPublicationIssues(version,['required'],[]).length===0){
    console.log(`v84 completeness gate not activated for package ${version}; this does not certify v84 resources.`);return [];
  }
  const {checkRegionalCoverage}=require('./check-regional-resources.cjs');
  const {loadLocalDataModule}=require('./export-regional-corpus.cjs');
  const {checkDocumentationCorpus}=require('./check-regional-documentation.cjs');
  const {regionalVariants:regions}=loadLocalDataModule(directory,'shared/regional/catalog.ts');
  const packs={},docs={};
  for(const {id} of regions){
    const pack=`shared/regional/packs/${id}.json`,doc=`src/regional/docs/${id}.json`;
    if(fs.existsSync(path.join(directory,pack)))packs[id]=read(pack);
    if(fs.existsSync(path.join(directory,doc)))docs[id]=read(doc);
  }
  const issues=regionalPublicationIssues(version,
    checkRegionalCoverage({regions,inventory:read('src/regional/inventory.json'),packs,docs}),
    checkDocumentationCorpus(directory).issues);
  if(issues.length){
    console.error(`v84 publication blocked: ${issues.length} incomplete or invalid resource entries.`);
    for(const issue of issues.slice(0,15))console.error(`- ${issue}`);
  }else console.log('v84 complete regional resource gate passed.');
  return issues;
}
module.exports={regionalPublicationIssues,runRegionalPublicationGate};
if(require.main===module){
  try{if(runRegionalPublicationGate().length)process.exitCode=1}catch(error){console.error(error);process.exitCode=1}
}
