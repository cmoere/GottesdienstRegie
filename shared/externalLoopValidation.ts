import type {ExternalSnapshot} from './externalLoop';

const keys=(value:Record<string,unknown>,expected:string[])=>Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown,max=20000):value is string=>typeof value==='string'&&value.length>0&&value.length<=max;
const integer=(value:unknown,min=0):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=1_000_000_000;
const date=(value:unknown)=>typeof value==='string'&&/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)&&Number.isFinite(Date.parse(value));
function validNews(value:unknown):boolean{
 if(!record(value)||!keys(value,['kind','entries'])||value.kind!=='news'||!Array.isArray(value.entries)||value.entries.length>200)return false;
 return value.entries.every(entry=>{
  if(!record(entry)||!keys(entry,['id','title','source','publishedAt','url'])||!text(entry.id,4096)||!text(entry.title)||!['westfalen-blatt','wdr-owl'].includes(String(entry.source))||!text(entry.url,4096))return false;
  try{const url=new URL(entry.url);if(url.protocol!=='https:'||url.username||url.password)return false}catch{return false}
  return entry.publishedAt===null||date(entry.publishedAt);
 });
}
function validTeam(value:unknown):boolean{return record(value)&&keys(value,['id','name'])&&integer(value.id,1)&&text(value.name)}
function validFootball(value:unknown,key:string):boolean{
 if(!record(value)||!keys(value,['kind','league','season','mode','teams','matches','table'])||value.kind!=='football'||!['bl1','bl2','bl3'].includes(String(value.league))||!key.startsWith(`football:${value.league}:`)||!integer(value.season,1900)||value.season>2500||!['matchday','upcoming','table'].includes(String(value.mode)))return false;
 if(!Array.isArray(value.teams)||!Array.isArray(value.matches)||!Array.isArray(value.table)||value.teams.length>1000||value.matches.length>1000||value.table.length>1000||!value.teams.every(validTeam))return false;
 return value.matches.every(match=>record(match)&&keys(match,['id','startsAt','home','away','status','score'])&&integer(match.id,1)&&date(match.startsAt)&&validTeam(match.home)&&validTeam(match.away)&&['scheduled','in-progress','finished'].includes(String(match.status))&&(match.score===null||(record(match.score)&&keys(match.score,['home','away'])&&integer(match.score.home)&&integer(match.score.away))))&&value.table.every(row=>record(row)&&keys(row,['rank','team','played','goalsFor','goalsAgainst','goalDifference','points'])&&integer(row.rank,1)&&validTeam(row.team)&&integer(row.played)&&integer(row.goalsFor)&&integer(row.goalsAgainst)&&integer(row.goalDifference,-1_000_000)&&integer(row.points,-1_000_000));
}
/** Identical strict public-field boundary for persisted caches and renderer IPC. */
export function readExternalSnapshot(value:unknown,key:string,now:number):ExternalSnapshot|null{
 const valid=record(value)&&keys(value,['version','key','revision','fetchedAt','stale','payload'])&&value.version===1&&value.key===key&&text(value.key,512)&&text(value.revision,128)&&typeof value.fetchedAt==='number'&&Number.isFinite(value.fetchedAt)&&value.fetchedAt>=0&&value.fetchedAt<=now+60000&&typeof value.stale==='boolean'&&(validNews(value.payload)||validFootball(value.payload,key));
 return valid?value as ExternalSnapshot:null;
}
