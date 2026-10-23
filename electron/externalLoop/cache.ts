import type {ExternalSnapshot} from '../../shared/externalLoop';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

const fileLimit=2*1024*1024,totalLimit=32*1024*1024,countLimit=32;
const keys=(value:Record<string,unknown>,expected:string[])=>Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown,max=20000):value is string=>typeof value==='string'&&value.length>0&&value.length<=max;
function validNews(value:unknown):boolean{
 if(!record(value)||!keys(value,['kind','entries'])||value.kind!=='news'||!Array.isArray(value.entries)||value.entries.length>200)return false;
 return value.entries.every(entry=>{
  if(!record(entry)||!keys(entry,['id','title','source','publishedAt','url'])||!text(entry.id,4096)||!text(entry.title)||!['westfalen-blatt','wdr-owl'].includes(String(entry.source))||!text(entry.url,4096))return false;
  try{const url=new URL(entry.url);if(url.protocol!=='https:'||url.username||url.password)return false}catch{return false}
  return entry.publishedAt===null||(typeof entry.publishedAt==='string'&&Number.isFinite(Date.parse(entry.publishedAt)));
 });
}
const integer=(value:unknown,min=0):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=1_000_000_000;
const date=(value:unknown)=>typeof value==='string'&&/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)&&Number.isFinite(Date.parse(value));
function validTeam(value:unknown):boolean{return record(value)&&keys(value,['id','name'])&&integer(value.id,1)&&text(value.name)}
function validFootball(value:unknown,key:string):boolean{
 if(!record(value)||!keys(value,['kind','league','season','mode','teams','matches','table'])||value.kind!=='football'||!['bl1','bl2','bl3'].includes(String(value.league))||!key.startsWith(`football:${value.league}:`)||!integer(value.season,1900)||value.season>2500||!['matchday','upcoming','table'].includes(String(value.mode)))return false;
 if(!Array.isArray(value.teams)||!Array.isArray(value.matches)||!Array.isArray(value.table)||value.teams.length>1000||value.matches.length>1000||value.table.length>1000||!value.teams.every(validTeam))return false;
 return value.matches.every(match=>record(match)&&keys(match,['id','startsAt','home','away','status','score'])&&integer(match.id,1)&&date(match.startsAt)&&validTeam(match.home)&&validTeam(match.away)&&['scheduled','in-progress','finished'].includes(String(match.status))&&(match.score===null||(record(match.score)&&keys(match.score,['home','away'])&&integer(match.score.home)&&integer(match.score.away))))&&value.table.every(row=>record(row)&&keys(row,['rank','team','played','goalsFor','goalsAgainst','goalDifference','points'])&&integer(row.rank,1)&&validTeam(row.team)&&integer(row.played)&&integer(row.goalsFor)&&integer(row.goalsAgainst)&&integer(row.goalDifference,-1_000_000)&&integer(row.points,-1_000_000));
}
function valid(value:unknown,key:string,now:number):value is ExternalSnapshot{
 return record(value)&&keys(value,['version','key','revision','fetchedAt','stale','payload'])&&value.version===1&&value.key===key&&text(value.key,512)&&text(value.revision,128)&&typeof value.fetchedAt==='number'&&Number.isFinite(value.fetchedAt)&&value.fetchedAt>=0&&value.fetchedAt<=now+60000&&typeof value.stale==='boolean'&&(validNews(value.payload)||validFootball(value.payload,key));
}
const digest=(key:string)=>createHash('sha256').update(key).digest('hex');
export class ExternalCache{
 private memory=new Map<string,ExternalSnapshot>();
 private writes:Promise<void>=Promise.resolve();
 private readonly directory:string|null;
 constructor(directory:string|null,private readonly now:()=>number=Date.now){
  this.directory=directory?path.resolve(directory):null;
  if(this.directory===path.parse(this.directory??'').root&&this.directory)throw Error('unsafe-cache-directory');
 }
 async read(key:string,maxAgeMs:number):Promise<ExternalSnapshot|null>{
  if(!Number.isFinite(maxAgeMs)||maxAgeMs<0)return null;
  await this.writes;
  let value:unknown=this.memory.get(key);
  if(!value&&this.directory){
   try{const file=path.join(this.directory,`${digest(key)}.json`),info=await fs.lstat(file);if(!info.isFile()||info.size>fileLimit)return null;value=JSON.parse(await fs.readFile(file,'utf8'))}catch{return null}
  }
  if(!valid(value,key,this.now()))return null;
  if(this.now()-value.fetchedAt>maxAgeMs){this.memory.delete(key);await this.discardExpired(key,value);return null}
  this.memory.set(key,structuredClone(value));this.trimMemory();return structuredClone(value);
 }
 async write(snapshot:ExternalSnapshot):Promise<void>{
  if(!valid(snapshot,snapshot.key,this.now()))throw Error('invalid-snapshot');
  const copy=structuredClone(snapshot),serialized=JSON.stringify(copy);
  if(Buffer.byteLength(serialized)>fileLimit)throw Error('size-limit');
  this.memory.set(copy.key,copy);this.trimMemory();
  if(!this.directory)return;
  const directory=this.directory;
  const work=this.writes.then(async()=>{
   await fs.mkdir(directory,{recursive:true});
   const info=await fs.lstat(directory);if(!info.isDirectory()||info.isSymbolicLink())throw Error('unsafe-cache-directory');
   const target=path.join(directory,`${digest(copy.key)}.json`),temp=path.join(directory,`${digest(copy.key)}.${randomUUID()}.tmp`);
   try{await fs.writeFile(temp,serialized,{encoding:'utf8',flag:'wx'});await fs.rename(temp,target)}finally{await fs.unlink(temp).catch(()=>{})}
   await this.prune(directory);
  });
  this.writes=work.catch(()=>{});return work;
 }
 private trimMemory(){if(this.memory.size<=countLimit)return;const sorted=[...this.memory.values()].sort((a,b)=>a.fetchedAt-b.fetchedAt);for(const entry of sorted.slice(0,this.memory.size-countLimit))this.memory.delete(entry.key)}
 private async discardExpired(key:string,expired:ExternalSnapshot){
  if(!this.directory)return;
  const file=path.join(this.directory,`${digest(key)}.json`);
  const work=this.writes.then(async()=>{
   // A newer write queued during read must never be deleted by an old expiration.
   const current:unknown=JSON.parse(await fs.readFile(file,'utf8'));
   if(record(current)&&current.key===key&&current.fetchedAt===expired.fetchedAt&&current.revision===expired.revision)await fs.unlink(file);
  });
  this.writes=work.catch(()=>{});await this.writes;
 }
 private async prune(directory:string){
  const files=[];
  for(const name of await fs.readdir(directory)){
   if(!/^[a-f0-9]{64}\.json$/.test(name))continue;
   const file=path.join(directory,name),info=await fs.lstat(file).catch(()=>null);
   if(info?.isFile())files.push({file,size:info.size,time:info.mtimeMs});
  }
  files.sort((a,b)=>a.time-b.time);let total=files.reduce((sum,file)=>sum+file.size,0),count=files.length;
  for(const file of files){if(count<=countLimit&&total<=totalLimit)break;await fs.unlink(file.file);count--;total-=file.size}
 }
}
