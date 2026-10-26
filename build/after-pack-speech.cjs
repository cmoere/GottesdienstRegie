const path=require('node:path'),fs=require('node:fs/promises');
module.exports=async context=>{
 const platform=context.electronPlatformName,arch=require('builder-util').Arch[context.arch];
 const root=await require('../scripts/prepare-neural-speech.cjs').prepare(platform,arch);
 await require('../scripts/check-neural-speech.cjs').check(root,platform);
 const resources=platform==='darwin'?path.join(context.appOutDir,context.packager.appInfo.productFilename+'.app','Contents/Resources'):path.join(context.appOutDir,'resources');
 await fs.cp(root,path.join(resources,'speech'),{recursive:true,dereference:true,filter:source=>!source.includes(path.sep+'runtime-extract')&&!source.endsWith('verified-speech.wav')});
 const importer=await require('../scripts/prepare-document-import.cjs').prepare(platform,arch);
 await fs.cp(importer,path.join(resources,'document-import'),{recursive:true,dereference:true});
 const powerpoint=await require('../scripts/prepare-powerpoint.cjs').preparePowerPoint(platform,arch);
 if(powerpoint){const target=path.join(resources,'powerpoint');await fs.mkdir(target,{recursive:true});for(const file of['PowerPointHost.exe','PowerPointCapture.exe','manifest.json'])await fs.copyFile(path.join(powerpoint,file),path.join(target,file))}
 console.log('Verified offline speech included in '+platform+'-'+arch+' package');
};
