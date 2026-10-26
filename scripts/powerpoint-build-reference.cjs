// Build-only reference metadata. /link embeds COM interface declarations;
// neither this reference DLL nor the NuGet package is shipped to end users.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const url='https://api.nuget.org/v3-flatcontainer/microsoft.office.interop.powerpoint/15.0.4420.1018/microsoft.office.interop.powerpoint.15.0.4420.1018.nupkg';
const expected='47ae1e3bd8ef6be5560701bb3c88f58c571db0130f7e26cd138db746eaede253';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function resolvePowerPointBuildReference(root){
 const folder=path.join(path.resolve(root),'work/powerpoint-build-reference');await fs.mkdir(folder,{recursive:true});const archive=path.join(folder,'interop.nupkg');let bytes=await fs.readFile(archive).catch(()=>null);
 if(!bytes||hash(bytes)!==expected){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok||Number(response.headers.get('content-length'))>1000000)throw Error('POWERPOINT_REFERENCE_DOWNLOAD_FAILED');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>1000000)throw Error('POWERPOINT_REFERENCE_BOUND');chunks.push(chunk)}bytes=Buffer.concat(chunks);if(hash(bytes)!==expected)throw Error('POWERPOINT_REFERENCE_INTEGRITY');await fs.writeFile(archive,bytes)}
 const zip=await require('jszip').loadAsync(bytes),entry=zip.file('lib/net20/Microsoft.Office.Interop.PowerPoint.dll');if(!entry)throw Error('POWERPOINT_REFERENCE_INVALID');const dll=await entry.async('nodebuffer');if(dll.length<10000||dll.length>2000000)throw Error('POWERPOINT_REFERENCE_INVALID');const target=path.join(folder,'Microsoft.Office.Interop.PowerPoint.dll');await fs.writeFile(target,dll);return target;
}
module.exports={resolvePowerPointBuildReference};
