const path=require('node:path'),fs=require('node:fs/promises');
module.exports=async context=>{
 const platform=context.electronPlatformName,arch=require('builder-util').Arch[context.arch];
 const root=await require('../scripts/prepare-neural-speech.cjs').prepare(platform,arch);
 const verification=await require('../scripts/check-neural-speech.cjs').check(root,platform,arch);
 const resources=platform==='darwin'?path.join(context.appOutDir,context.packager.appInfo.productFilename+'.app','Contents/Resources'):path.join(context.appOutDir,'resources');
 await fs.cp(root,path.join(resources,'speech'),{recursive:true,dereference:true,filter:source=>!source.includes(path.sep+'runtime-extract')&&!source.endsWith('verified-speech.wav')});
 const importer=await require('../scripts/prepare-document-import.cjs').prepare(platform,arch);
  const imageAi=await require('../scripts/prepare-image-ai.cjs').prepare(platform,arch);
  await fs.cp(imageAi,path.join(resources,'image-ai'),{recursive:true,dereference:true});
  if(platform==='win32'){
    const imageVerification=JSON.parse(await fs.readFile(path.join(imageAi,'verification.json'),'utf8'));
    for(const file of Object.keys(imageVerification.crt.files))await fs.copyFile(path.join(imageAi,file),path.join(context.appOutDir,file));
  }
 await fs.cp(importer,path.join(resources,'document-import'),{recursive:true,dereference:true});
 const powerpoint=await require('../scripts/prepare-powerpoint.cjs').preparePowerPoint(platform,arch);
 if(powerpoint){const target=path.join(resources,'powerpoint');await fs.mkdir(target,{recursive:true});for(const file of['PowerPointHost.exe','PowerPointCapture.exe','manifest.json'])await fs.copyFile(path.join(powerpoint,file),path.join(target,file))}
 console.log('Verified offline speech ('+(verification.runtimeTested?'native synthesis':'cross-target integrity and host synthesis')+') included in '+platform+'-'+arch+' package');
};
