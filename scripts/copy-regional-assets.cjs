'use strict';
const fs=require('node:fs');
const path=require('node:path');
function copyRegionalAssets(source,destination){
  fs.mkdirSync(destination,{recursive:true});
  const files=fs.readdirSync(source).filter(name=>/^[a-z][a-z-]*\.json$/.test(name));
  for(const name of files){
    const content=fs.readFileSync(path.join(source,name));
    const value=JSON.parse(content.toString('utf8'));
    if(value.id!==name.slice(0,-5))throw new Error(`Regional asset ID mismatch: ${name}`);
    fs.writeFileSync(path.join(destination,name),content);
  }
  return files.length;
}
if(require.main===module){
  const root=path.resolve(__dirname,'..');
  console.log(`Copied ${copyRegionalAssets(path.join(root,'shared/regional/packs'),path.join(root,'dist-electron/shared/regional/packs'))} regional assets.`);
}
module.exports={copyRegionalAssets};
