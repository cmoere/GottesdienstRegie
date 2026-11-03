const fs=require('node:fs/promises'),path=require('node:path'),JSZip=require('jszip'),{execFileSync}=require('node:child_process');
const {download}=require('./prepare-neural-speech.cjs'),{extractZip,safeEntry}=require('./prepare-bundled-speech.cjs');
async function prepare(platform=process.platform,arch=process.arch){
 const repo=path.resolve(__dirname,'..'),manifest=require('../build/image-ai/manifest.json'),key=platform+'-'+arch,root=path.join(repo,'work/image-ai',key),cache=path.join(repo,'work/image-ai-cache');
 if(!manifest.platforms[key]&&!(platform==='darwin'&&['x64','arm64'].includes(arch))&&!(platform==='linux'&&arch==='x64'))throw Error('Unsupported image AI target');
 if(platform!==process.platform)throw Error('IMAGE_BUILD_HOST_MISMATCH');
 await fs.mkdir(root,{recursive:true});
 const archives=[];
 for(const asset of manifest.sources){const bytes=await download(asset,cache);archives.push({asset,bytes});const zip=await JSZip.loadAsync(bytes);for(const item of Object.values(zip.files)){if(item.dir||!(/(?:^|\/)(?:LICENSE[^/]*|COPYING[^/]*|NOTICE[^/]*|COPYRIGHT[^/]*)$/i.test(item.name)||(/\/thirdparty\//.test(item.name)&&/\.(?:c|cpp|h|hpp)$/i.test(item.name))))continue;safeEntry(item.unsafeOriginalName||item.name);const target=path.join(root,'licenses',asset.file,item.name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,await item.async('nodebuffer'))}}
 if(platform==='darwin'||platform==='linux'){
  const sourceRoot=path.join(repo,'work/image-ai-source',key);await fs.mkdir(sourceRoot,{recursive:true});
  for(const {asset,bytes}of archives)await extractZip(bytes,sourceRoot);
  const source=path.join(sourceRoot,'stable-diffusion.cpp-'+manifest.revision),ggml=path.join(sourceRoot,'ggml-'+manifest.sources[1].revision),build=path.join(repo,'work/image-ai-build',key);
  execFileSync('cmake',['-S',source,'-B',build,'-DCMAKE_BUILD_TYPE=Release',...(platform==='darwin'?['-DCMAKE_OSX_ARCHITECTURES='+({x64:'x86_64',arm64:'arm64'}[arch]),'-DCMAKE_OSX_DEPLOYMENT_TARGET=12.0']:['-DCMAKE_EXE_LINKER_FLAGS=-static']),'-DSD_GGML_SOURCE_DIR='+ggml,'-DGGML_NATIVE=OFF','-DGGML_OPENMP=OFF','-DGGML_METAL=OFF','-DGGML_BACKEND_DL=OFF','-DSD_METAL=OFF','-DBUILD_SHARED_LIBS=OFF','-DSD_BUILD_SHARED_GGML_LIB=OFF','-DSD_BUILD_SHARED_LIBS=OFF','-DSD_WEBP=OFF','-DSD_WEBM=OFF','-DSD_SERVER_BUILD_FRONTEND=OFF'],{stdio:'inherit',windowsHide:true});
  execFileSync('cmake',['--build',build,'--config','Release','--target','sd-cli','-j','3'],{stdio:'inherit',windowsHide:true});await fs.copyFile(path.join(build,'bin/sd-cli'),path.join(root,'sd-cli'));await fs.chmod(path.join(root,'sd-cli'),0o755);if(platform==='darwin')await require('./cross-package-validation.cjs').verifyMacBinary(path.join(root,'sd-cli'),arch);
  if(platform==='linux'){const binary=execFileSync('file',[path.join(root,'sd-cli')],{encoding:'utf8',windowsHide:true});if(!/statically linked/.test(binary))throw Error('IMAGE_RUNTIME_NOT_STATIC')}
 }else await extractZip(await download(manifest.platforms[key],cache),root);
 if(platform==='win32'&&manifest.cpuFallback)await extractZip(await download(manifest.cpuFallback,cache),path.join(root,'cpu'));
 let crt;if(platform==='win32'){const helper=require('./prepare-windows-image-crt.cjs');crt=await helper.copyWindowsImageCrt(helper.visualStudioInstallation(),root)}
 const exe=path.join(root,platform==='win32'?'sd-cli.exe':'sd-cli');if(platform!=='win32')await fs.chmod(exe,0o755);
 const native=platform===process.platform&&arch===process.arch;
 if(native){const result=execFileSync(exe,['--help'],{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:2*1024*1024});if(!result.includes('--sampling-method')||!result.includes('--backend'))throw Error('Image runtime smoke check failed')}
 await fs.copyFile(path.join(repo,'build/image-ai/NOTICE.md'),path.join(root,'NOTICE.md'));
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));await fs.writeFile(path.join(root,'verification.json'),JSON.stringify({platform,arch,revision:manifest.revision,runtimeTested:native,sha256:await require('./cross-package-validation.cjs').sha256(exe),...(crt?{crt}:{})},null,2));return root;
}
module.exports={prepare};if(require.main===module)prepare(process.argv[2],process.argv[3]).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
