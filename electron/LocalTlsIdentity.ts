import fs from 'node:fs/promises';import path from 'node:path';import {isIP} from 'node:net';import {X509Certificate,createPrivateKey,randomBytes} from 'node:crypto';import {generate} from 'selfsigned';
export type LocalTlsIdentity={cert:string;key:string;fingerprint:string};
const pending=new Map<string,Promise<LocalTlsIdentity>>();
/** Server identity only: never writes to OS/browser certificate trust stores. */
export function getLocalTlsIdentity(directory:string,addresses:string[]):Promise<LocalTlsIdentity>{
 const ips=[...new Set(['127.0.0.1',...addresses])].filter(value=>isIP(value)>0).sort();if(ips.length>32)return Promise.reject(Error('TLS_ADDRESS_LIMIT'));
 const file=path.join(path.resolve(directory),'local-https.json'),active=pending.get(file);if(active)return active;
 const task=(async()=>{
  try{const raw=JSON.parse(await fs.readFile(file,'utf8'));if(typeof raw.cert==='string'&&typeof raw.key==='string'){const certificate=new X509Certificate(raw.cert);if(!certificate.ca&&Date.parse(certificate.validTo)>Date.now()+86400000&&certificate.checkPrivateKey(createPrivateKey(raw.key))&&ips.every(ip=>certificate.checkIP(ip)))return{cert:raw.cert,key:raw.key,fingerprint:certificate.fingerprint256}}}catch{/* Create or renew an owned invalid/missing server identity. */}
  const now=new Date(),end=new Date(now.getTime()+365*86400000);const pem=await generate([{name:'commonName',value:'GottesdienstRegie local'}],{algorithm:'sha256',keySize:2048,notBeforeDate:new Date(now.getTime()-300000),notAfterDate:end,extensions:[{name:'basicConstraints',cA:false,critical:true},{name:'keyUsage',digitalSignature:true,keyEncipherment:true,critical:true},{name:'extKeyUsage',serverAuth:true},{name:'subjectAltName',altNames:ips.map(ip=>({type:7,ip}))}]});
  const identity={cert:pem.cert,key:pem.private,fingerprint:new X509Certificate(pem.cert).fingerprint256};await fs.mkdir(directory,{recursive:true});const temporary=file+'.'+randomBytes(6).toString('hex')+'.tmp';await fs.writeFile(temporary,JSON.stringify({cert:identity.cert,key:identity.key}),{mode:0o600,flag:'wx'});try{await fs.rename(temporary,file)}catch(error){await fs.unlink(temporary).catch(()=>{});throw error}return identity;
 })().finally(()=>pending.delete(file));pending.set(file,task);return task;
}
