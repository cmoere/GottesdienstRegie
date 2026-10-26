import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,webcrypto} from 'node:crypto';
import {inspectPowerPoint} from './PowerPointImport';
import{readSecurityZone,writeSecurityZone,validSecurityZone}from'./fileSecurityZone';

const MAX_SOURCE=128*1024*1024,MAX_PORTABLE=256*1024*1024;
const validId=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const digest=async(bytes:Buffer)=>Buffer.from(await webcrypto.subtle.digest('SHA-256',Uint8Array.from(bytes))).toString('hex');
export type PortablePowerPointSources={version:1;sources:Array<{id:string;data:string;zoneId?:number}>};
/** Native-only immutable assets. Renderers receive hashes, never these paths. */
export class PowerPointSourceStore {
 private readonly folder:string;
 constructor(root:string){this.folder=path.resolve(root,'powerpoint-sources')}
 private file(id:string){if(!validId(id))throw Error('POWERPOINT_SOURCE_ID_INVALID');return path.join(this.folder,id+'.pptx')}
 async putFile(source:string){const stat=await fs.stat(source);if(!stat.isFile()||stat.size<=0||stat.size>MAX_SOURCE)throw Error('POWERPOINT_SOURCE_SIZE');const bytes=await fs.readFile(source),zone=await readSecurityZone(source);return this.put(bytes,zone,true)}
 async put(input:Buffer,zone?:number,selectedFile=false){
  if(zone!==undefined&&!validSecurityZone(zone))throw Error('POWERPOINT_SOURCE_SECURITY_INVALID');
  if(!Buffer.isBuffer(input)||!input.length||input.length>MAX_SOURCE)throw Error('POWERPOINT_SOURCE_SIZE');
  const bytes=Buffer.from(input),inspection=await inspectPowerPoint(bytes),id=await digest(bytes),target=this.file(id);
  await fs.mkdir(this.folder,{recursive:true});const temporary=path.join(this.folder,randomUUID()+'.tmp');
  try{
   await fs.writeFile(temporary,bytes,{flag:'wx'});
   if(zone!==undefined)await writeSecurityZone(temporary,zone);
   // Atomic create without replacing an existing immutable source. Concurrent
   // imports of the same digest converge only after checking existing bytes.
   let created=false;try{await fs.link(temporary,target);created=true}catch(error:any){if(error?.code!=='EEXIST')throw error;const old=await this.get(id);if(selectedFile)await writeSecurityZone(target,zone);else if(zone!==undefined&&(old.zoneId===undefined||zone>old.zoneId))await writeSecurityZone(target,zone)}
   // POSIX has no NTFS alternate streams; keep an equivalent local sidecar
   // so cross-platform portable exports retain the protection information.
   if(process.platform!=='win32'&&created&&zone!==undefined)await writeSecurityZone(target,zone);
  }finally{await fs.rm(temporary,{force:true});if(process.platform!=='win32')await fs.rm(temporary+':Zone.Identifier',{force:true})}
  return{id,size:bytes.length,inspection};
 }
 async get(id:string){
  const filename=this.file(id),stat=await fs.lstat(filename);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<=0||stat.size>MAX_SOURCE)throw Error('POWERPOINT_SOURCE_INTEGRITY');
  const bytes=await fs.readFile(filename);if(bytes.length!==stat.size||await digest(bytes)!==id)throw Error('POWERPOINT_SOURCE_INTEGRITY');
  return{path:filename,bytes,zoneId:await readSecurityZone(filename),inspection:await inspectPowerPoint(bytes)};
 }
 async export(ids:string[]):Promise<PortablePowerPointSources>{
  if(!Array.isArray(ids))throw Error('POWERPOINT_SOURCE_IDS');const unique=[...new Set(ids)];if(unique.length>32)throw Error('POWERPOINT_PORTABLE_BOUND');
  const sources:PortablePowerPointSources['sources']=[];let total=0;
  for(const id of unique){const{bytes,zoneId}=await this.get(id);total+=bytes.length;if(total>MAX_PORTABLE)throw Error('POWERPOINT_PORTABLE_BOUND');sources.push({id,data:bytes.toString('base64'),...(zoneId===undefined?{}:{zoneId})})}
  return{version:1,sources};
 }
 async restore(value:unknown,containerZone?:number){
  if(containerZone!==undefined&&!validSecurityZone(containerZone))throw Error('POWERPOINT_SOURCE_SECURITY_INVALID');
  const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
  if(!exact(value,['version','sources'])||value.version!==1||!Array.isArray(value.sources)||value.sources.length>32)throw Error('POWERPOINT_PORTABLE_INVALID');
  const entries:Array<{id:string;bytes:Buffer;zoneId?:number}>=[],ids=new Set<string>();let total=0;
  // Validate every envelope before persisting any source; external paths are
  // not an accepted representation, even for a locally imported document.
  for(const item of value.sources){
   if(!(exact(item,['id','data'])||exact(item,['id','data','zoneId'])&&validSecurityZone(item.zoneId))||!validId(item.id)||ids.has(item.id)||typeof item.data!=='string'||!item.data.length||item.data.length>Math.ceil(MAX_SOURCE/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(item.data))throw Error('POWERPOINT_PORTABLE_INVALID');
   const bytes=Buffer.from(item.data,'base64');total+=bytes.length;
   if(!bytes.length||bytes.length>MAX_SOURCE||total>MAX_PORTABLE||bytes.toString('base64')!==item.data||await digest(bytes)!==item.id)throw Error('POWERPOINT_PORTABLE_INTEGRITY');
   ids.add(item.id);entries.push({id:item.id,bytes,zoneId:containerZone===undefined?item.zoneId as number|undefined:Math.max(containerZone,Number(item.zoneId??0))});
  }
  for(const entry of entries){const stored=await this.put(entry.bytes,entry.zoneId);if(stored.id!==entry.id)throw Error('POWERPOINT_PORTABLE_INTEGRITY')}
 }
}
