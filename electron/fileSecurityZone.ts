import fs from'node:fs/promises';
export function validSecurityZone(value:unknown):value is number{return Number.isInteger(value)&&Number(value)>=0&&Number(value)<=4}
/** Keep the Office security zone, without exporting origin URLs or user paths. */
export async function readSecurityZone(file:string):Promise<number|undefined>{
 let handle:Awaited<ReturnType<typeof fs.open>>|undefined;
 try{handle=await fs.open(file+':Zone.Identifier','r');const bytes=Buffer.alloc(8193),{bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>8192)throw Error('POWERPOINT_SOURCE_SECURITY_INVALID');const data=bytes.subarray(0,bytesRead),text=data[0]===255&&data[1]===254?data.subarray(2).toString('utf16le'):data.toString('utf8').replace(/^\uFEFF/,'');let section=false,zone:number|undefined;for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(line.startsWith('[')){section=line.toLowerCase()==='[zonetransfer]';continue}if(section&&/^ZoneId\s*=/i.test(line)){const value=line.match(/^ZoneId\s*=\s*([0-4])\s*$/i);if(!value)throw Error('POWERPOINT_SOURCE_SECURITY_INVALID');zone=Math.max(zone??0,Number(value[1]));}}if(zone===undefined)throw Error('POWERPOINT_SOURCE_SECURITY_INVALID');return zone;
 }catch(error:any){if(error?.code==='ENOENT')return file.startsWith('\\\\')?3:undefined;throw error}finally{await handle?.close()}
}
export async function writeSecurityZone(file:string,zone:number|undefined){
 if(zone===undefined){await fs.rm(file+':Zone.Identifier',{force:true});return}
 if(!validSecurityZone(zone))throw Error('POWERPOINT_SOURCE_SECURITY_INVALID');await fs.writeFile(file+':Zone.Identifier',`[ZoneTransfer]\r\nZoneId=${zone}\r\n`);
}
