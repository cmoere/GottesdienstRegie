'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {getGermanDocumentationSource,loadLocalDataModule}=require('./export-regional-corpus.cjs');
const root=path.resolve(__dirname,'..');
const {validateRegionalDocumentation}=loadLocalDataModule(root,'src/regional/documentation.ts');
function checkDocumentationPacks(regions,source,docs){
  const issues=[];
  for(const {id} of regions){
    if(!Object.hasOwn(docs,id)){issues.push(`${id}: missing documentation pack`);continue}
    for(const issue of validateRegionalDocumentation(docs[id],id,source))issues.push(`${id}: ${issue}`);
  }
  return {regions:regions.length,sourceHelpArticles:Object.keys(source.help).length,
    sourceReleaseFields:Object.keys(source.releases).length,complete:issues.length===0,issues};
}
function checkDocumentationCorpus(directory=root){
  const {releaseRegionalVariants}=loadLocalDataModule(directory,'shared/regional/catalog.ts');
  const source=getGermanDocumentationSource(directory),docs={};
  for(const {id} of releaseRegionalVariants){
    const filename=path.join(directory,'src/regional/docs',`${id}.json`);
    if(fs.existsSync(filename))docs[id]=JSON.parse(fs.readFileSync(filename,'utf8'));
  }
  return checkDocumentationPacks(releaseRegionalVariants,source,docs);
}
module.exports={checkDocumentationPacks,checkDocumentationCorpus};
if(require.main===module){
  const result=checkDocumentationCorpus();
  console.log(JSON.stringify({...result,issues:result.issues.slice(0,15)},null,2));
  if(!result.complete)process.exitCode=1;
}
