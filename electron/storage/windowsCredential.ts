import {execFile} from 'node:child_process';
import path from 'node:path';

// Read the same current-user GitHub entry used by Git Credential Manager when
// Git itself is unavailable to the installed app. Never enumerate other saved
// credentials, write to the vault, prompt, or include secrets in process args.
export function readWindowsGitHubCredential(owner='',platform:NodeJS.Platform=process.platform):Promise<string|null>{
 if(platform!=='win32'||!process.env.SystemRoot)return Promise.resolve(null);
 const account=/^[a-zA-Z0-9-]{1,39}$/.test(owner)?owner:'';
 const script=`$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class RegieGitHubCredential {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 private struct Credential {
  public uint Flags; public uint Type;
  [MarshalAs(UnmanagedType.LPWStr)] public string TargetName;
  [MarshalAs(UnmanagedType.LPWStr)] public string Comment;
  public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
  public uint CredentialBlobSize; public IntPtr CredentialBlob;
  public uint Persist; public uint AttributeCount; public IntPtr Attributes;
  [MarshalAs(UnmanagedType.LPWStr)] public string TargetAlias;
  [MarshalAs(UnmanagedType.LPWStr)] public string UserName;
 }
 [DllImport("Advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
 private static extern bool CredRead(string target,uint type,uint flags,out IntPtr value);
 [DllImport("Advapi32.dll")] private static extern void CredFree(IntPtr value);
 public static string Read(string target) {
  IntPtr pointer;
  if(!CredRead(target,1,0,out pointer))return null;
  try {
   var value=(Credential)Marshal.PtrToStructure(pointer,typeof(Credential));
   if(value.CredentialBlobSize==0 || value.CredentialBlobSize>8192 || value.CredentialBlobSize%2!=0)return null;
   return Marshal.PtrToStringUni(value.CredentialBlob,(int)value.CredentialBlobSize/2);
  } finally {CredFree(pointer);}
 }
}
'@
$credential=[RegieGitHubCredential]::Read('git:https://github.com')
${account?`if(!$credential){$credential=[RegieGitHubCredential]::Read('git:https://${account}@github.com')}`:''}
if($credential){[Console]::Write([Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($credential)))}`;
 return new Promise(resolve=>{
  execFile(path.join(process.env.SystemRoot!,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:5000,maxBuffer:65536,encoding:'utf8'},(error,stdout)=>{
   if(error){resolve(null);return}
   const output=stdout.trim();if(!output||output.length>16384||!/^[A-Za-z0-9+/]+={0,2}$/.test(output)){resolve(null);return}
   const token=Buffer.from(output,'base64').toString('utf16le');resolve(/^[\x21-\x7e]{1,4096}$/.test(token)?token:null);
  });
 });
}
