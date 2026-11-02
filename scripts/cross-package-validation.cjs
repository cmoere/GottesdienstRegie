'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
function executionMode(platform,arch,hostPlatform=process.platform,hostArch=process.arch){
 if(platform!==hostPlatform)throw Error('Cross-host package verification is unsupported');
 if(arch===hostArch||(platform==='darwin'&&hostArch==='arm64'&&arch==='x64'))return'native';
 if(platform==='darwin'&&hostArch==='x64'&&arch==='arm64')return'darwin-cross';
 throw Error('Unsupported cross-target execution');
}
const cpuName=cpu=>cpu===0x01000007?'x64':cpu===0x0100000c?'arm64':null;
function machoArchitectures(bytes){
 if(bytes.length<8)throw Error('Truncated Mach-O header');const magic=bytes.readUInt32BE(0);
 if([0xcffaedfe,0xcefaedfe,0xfeedfacf,0xfeedface].includes(magic)){const little=magic===0xcffaedfe||magic===0xcefaedfe;const cpu=cpuName(little?bytes.readUInt32LE(4):bytes.readUInt32BE(4));if(!cpu)throw Error('Unsupported Mach-O CPU');return[cpu]}
 const little=magic===0xbebafeca||magic===0xbfbafeca,wide=magic===0xcafebabf||magic===0xbfbafeca;
 if(![0xcafebabe,0xcafebabf,0xbebafeca,0xbfbafeca].includes(magic))throw Error('Invalid Mach-O binary');const read=offset=>little?bytes.readUInt32LE(offset):bytes.readUInt32BE(offset),count=read(4),stride=wide?32:20;if(count<1||count>16||bytes.length<8+count*stride)throw Error('Invalid universal Mach-O header');const cpus=[];for(let i=0;i<count;i++){const cpu=cpuName(read(8+i*stride));if(cpu&&!cpus.includes(cpu))cpus.push(cpu)}if(!cpus.length)throw Error('No supported Mach-O target');return cpus;
}
function assertMachOArchitecture(bytes,arch){if(!machoArchitectures(bytes).includes(arch))throw Error('Packaged binary target architecture mismatch: '+arch)}
async function verifyMacBinary(file,arch){const handle=await fs.open(file,'r');const header=Buffer.alloc(4096);try{const {bytesRead}=await handle.read(header,0,header.length,0);assertMachOArchitecture(header.subarray(0,bytesRead),arch)}finally{await handle.close()}}
async function sha256(file){const hash=crypto.createHash('sha256'),handle=await fs.open(file,'r');try{for await(const bytes of handle.createReadStream())hash.update(bytes);return hash.digest('hex')}finally{await handle.close().catch(()=>{})}}
async function verifySpeechTarget(root,arch,reference=require('../build/neural-speech/manifest.json')){
 const ready=JSON.parse(await fs.readFile(path.join(root,'ready.json'),'utf8')),manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
 assert.deepEqual(manifest,reference,'Packaged speech manifest differs');assert.equal(ready.platform,'darwin');assert.equal(ready.arch,arch);assert.equal(ready.engine,reference.engine);assert.deepEqual(ready.voices,Object.keys(reference.voices));
 for(const name of ['worker.py','NOTICE.md'])assert((await fs.readFile(path.join(root,name))).equals(await fs.readFile(path.join(__dirname,'../build/neural-speech',name))),'Packaged speech worker/notice differs');
 let files=0;for(const [voice,data]of Object.entries(reference.voices))for(const asset of data.files){assert.equal(path.basename(asset.file),asset.file);const file=path.join(root,'voices',voice,asset.file);assert.equal((await fs.stat(file)).size,asset.size,'Model size differs');assert.equal(await sha256(file),asset.sha256,'Model SHA256 differs');files++}
 const executable=path.join(root,'python/bin/python3');await verifyMacBinary(executable,arch);let nativeFiles=1;
 async function visit(folder){for(const item of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())await visit(file);else if(/\.(?:so|dylib)$/.test(item.name)){await verifyMacBinary(file,arch);nativeFiles++}}}
 await visit(path.join(root,'python/lib'));await visit(path.join(root,'site'));assert(nativeFiles>=3,'Missing target native speech libraries');for(const name of ['piper','onnxruntime','numpy'])assert((await fs.stat(path.join(root,'site',name))).isDirectory(),'Missing speech package '+name);
 return{arch,modelFilesVerified:files,nativeFilesVerified:nativeFiles,manifestVerified:true,workerVerified:true};
}
module.exports={executionMode,machoArchitectures,assertMachOArchitecture,verifyMacBinary,verifySpeechTarget,sha256};
