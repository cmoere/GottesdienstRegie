const fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process');
async function buildPowerPointHost({root,folder,downloadedReference=false}){
 if(process.platform!=='win32')throw Error('POWERPOINT_HOST_BUILD_WINDOWS_REQUIRED');root=path.resolve(root);folder=path.resolve(folder);await fs.access(path.join(folder,'.probe-owned'));
 const source=path.join(root,'build/powerpoint'),installed=path.join(process.env.SystemRoot,'assembly/GAC_MSIL/Microsoft.Office.Interop.PowerPoint/15.0.0.0__71e9bce111e9429c/Microsoft.Office.Interop.PowerPoint.dll'),interop=!downloadedReference&&await fs.stat(installed).catch(()=>null)?installed:await require('./powerpoint-build-reference.cjs').resolvePowerPointBuildReference(root),executable=path.join(folder,'PowerPointHost.exe');
 await fs.access(interop);execFileSync(path.join(process.env.SystemRoot,'Microsoft.NET/Framework64/v4.0.30319/csc.exe'),['/nologo','/target:exe','/out:'+executable,'/r:Microsoft.CSharp.dll','/r:System.Web.Extensions.dll','/r:System.Windows.Forms.dll','/r:System.Drawing.dll','/r:System.IO.Compression.dll','/r:System.IO.Compression.FileSystem.dll','/link:'+interop,...['HostContract.cs','SourceWindow.cs','SourceSecurity.cs','PowerPointHost.cs'].map(file=>path.join(source,file))],{windowsHide:true,stdio:'inherit',timeout:30000});return executable;
}
module.exports={buildPowerPointHost};
