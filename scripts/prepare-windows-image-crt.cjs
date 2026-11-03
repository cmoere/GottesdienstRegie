const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const names=['msvcp140.dll','vcruntime140.dll','vcruntime140_1.dll','msvcp140_codecvt_ids.dll','vcomp140.dll'];
function visualStudioInstallation(){const where=path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft Visual Studio/Installer/vswhere.exe'),installation=execFileSync(where,['-latest','-products','*','-property','installationPath'],{encoding:'utf8',windowsHide:true,timeout:20000}).trim();if(!installation||!path.isAbsolute(installation))throw Error('IMAGE_CRT_MISSING');return installation}
async function copyWindowsImageCrt(installation,target){
 const base=path.join(installation,'VC/Redist/MSVC'),versions=(await fs.readdir(base)).filter(name=>/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(name)).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
 for(const version of versions){
  const x64=path.join(base,version,'x64');let folders;try{folders=(await fs.readdir(x64)).filter(name=>/^Microsoft\.VC\d+\.CRT$/i.test(name))}catch{continue}
  for(const folder of folders){const source=path.join(x64,folder),sourceFile=name=>path.join(name==='vcomp140.dll'?path.join(x64,folder.replace(/\.CRT$/i,'.OpenMP')):source,name);if(!(await Promise.all(names.map(name=>fs.stat(sourceFile(name)).then(stat=>stat.isFile(),()=>false)))).every(Boolean))continue;
   const report={version,source:'Visual Studio x64 release redistributable',files:{}};
   for(const name of names){const bytes=await fs.readFile(sourceFile(name)),sha256=crypto.createHash('sha256').update(bytes).digest('hex');report.files[name]={size:bytes.length,sha256};for(const suffix of['','cpu']){const destination=path.join(target,suffix);await fs.mkdir(destination,{recursive:true});await fs.writeFile(path.join(destination,name),bytes)}}
   await fs.mkdir(path.join(target,'licenses'),{recursive:true});await fs.writeFile(path.join(target,'licenses/Microsoft-VC-runtime.txt'),'Microsoft Visual C++ runtime\nCopyright (c) Microsoft Corporation. All rights reserved.\n\nUnmodified release redistributable DLLs supplied app-locally from the licensed Visual Studio build environment; no runtime installer is launched.\nRedistribution list and applicable Visual Studio license terms:\nhttps://learn.microsoft.com/en-us/visualstudio/releases/2022/redistribution\n');return report;
  }
 }throw Error('IMAGE_CRT_MISSING');
}
module.exports={visualStudioInstallation,copyWindowsImageCrt};
