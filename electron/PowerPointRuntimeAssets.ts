import fs from'node:fs/promises';import path from'node:path';import{createHash}from'node:crypto';
const names=['PowerPointHost.exe','PowerPointCapture.exe']as const;
export async function loadPowerPointRuntimeAssets(folder:string,platform=process.platform as string,arch=process.arch as string,electron=process.versions.electron){
 if(platform!=='win32'||arch!=='x64'||electron!=='45.0.0')throw Error('POWERPOINT_RUNTIME_UNAVAILABLE');
 const invalid=()=>Error('POWERPOINT_RUNTIME_INTEGRITY');let manifest:any;try{const info=await fs.lstat(path.join(folder,'manifest.json'));if(!info.isFile()||info.isSymbolicLink()||info.size>8192)throw invalid();manifest=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8'))}catch{throw invalid()}
 if(!manifest||Object.keys(manifest).sort().join()!==['version','platform','arch','electron','files'].sort().join()||manifest.version!==1||manifest.platform!==platform||manifest.arch!==arch||manifest.electron!==electron||!manifest.files||Object.keys(manifest.files).sort().join()!==[...names].sort().join())throw invalid();
 for(const name of names){const entry=manifest.files[name];if(!entry||Object.keys(entry).sort().join()!=='bytes,sha256'||!Number.isSafeInteger(entry.bytes)||entry.bytes<16||entry.bytes>20*1024*1024||typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256))throw invalid();const target=path.join(folder,name),info=await fs.lstat(target).catch(()=>null);if(!info?.isFile()||info.isSymbolicLink()||info.size!==entry.bytes)throw invalid();const bytes=await fs.readFile(target);if(bytes.subarray(0,2).toString()!=='MZ'||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw invalid()}
 return{host:path.join(folder,names[0]),capture:path.join(folder,names[1])};
}
