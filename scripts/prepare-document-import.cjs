const fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
async function prepare(platform=process.platform,arch=process.arch){
 const key=platform+'-'+arch,targets={'win32-x64':'x86_64-pc-windows-msvc','darwin-x64':'x86_64-apple-darwin','darwin-arm64':'aarch64-apple-darwin','linux-x64':'x86_64-unknown-linux-gnu'},target=targets[key];if(!target)throw Error('Unsupported document import platform');
 const repo=path.resolve(__dirname,'..'),manifest=path.join(repo,'build/document-import/Cargo.toml'),build=path.join(repo,'work/document-import-build'),root=path.join(repo,'work/document-import',key);await fs.mkdir(root,{recursive:true});
 execFileSync('rustup',['target','add',target],{stdio:'inherit',windowsHide:true});
 const buildEnvironment=platform==='linux'?{...process.env,RUSTFLAGS:(process.env.RUSTFLAGS??'')+' -C target-feature=+crt-static'}:process.env;
 execFileSync('cargo',['build','--locked','--release','--examples','--bins','--target',target,'--manifest-path',manifest,'--target-dir',build],{stdio:'inherit',windowsHide:true,env:buildEnvironment});
 const name=platform==='win32'?'regie-document-import.exe':'regie-document-import';await fs.copyFile(path.join(build,target,'release',name),path.join(root,name));
 if(platform!=='win32')await fs.chmod(path.join(root,name),0o755);
 const fixtures=require('../build/document-import/fixtures.json'),fixtureRoot=path.join(repo,'work/document-import-fixtures',key);await fs.mkdir(fixtureRoot,{recursive:true});
 const {download}=require('./prepare-neural-speech.cjs');for(const fixture of fixtures.assets)await fs.writeFile(path.join(fixtureRoot,fixture.file),await download(fixture,path.join(repo,'work/neural-speech-cache')));
 const fixtureBuilder=path.join(build,target,'release/examples/package_fixture'+(platform==='win32'?'.exe':'')),notebook=path.join(fixtureRoot,'sample.onepkg');
 execFileSync(fixtureBuilder,[path.join(fixtureRoot,'sample.onetoc2'),path.join(fixtureRoot,'sample.one'),notebook],{windowsHide:true,timeout:30000});
 const report=[];for(const extension of ['one','onepkg']){const result=JSON.parse(execFileSync(path.join(root,name),[path.join(fixtureRoot,'sample.'+extension)],{encoding:'utf8',maxBuffer:32*1024*1024,timeout:90000,windowsHide:true}));if(result.version!==1||!result.pages?.length||!result.pages.some(page=>page.body?.length>100))throw Error('Actual OneNote '+extension+' import failed');report.push({extension,pages:result.pages.length,images:result.pages.reduce((sum,page)=>sum+(page.images?.length??0),0)})}
 await fs.writeFile(path.join(root,'verification.json'),JSON.stringify({platform,arch,actualImports:report},null,2));
 await fs.cp(path.join(repo,'build/document-import'),path.join(root,'source/worker'),{recursive:true});
 const metadata=JSON.parse(execFileSync('cargo',['metadata','--locked','--format-version','1','--manifest-path',manifest],{encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true}));
 const licenses=[];for(const item of metadata.packages){if(!item.source)continue;licenses.push({name:item.name,version:item.version,license:item.license,repository:item.repository});await fs.cp(path.dirname(item.manifest_path),path.join(root,'source/dependencies',item.name+'-'+item.version),{recursive:true})}
 await fs.writeFile(path.join(root,'licenses.json'),JSON.stringify(licenses,null,2));return root;
}
module.exports={prepare};if(require.main===module)prepare(process.argv[2],process.argv[3]).then(console.log).catch(error=>{console.error(error);process.exitCode=1});
