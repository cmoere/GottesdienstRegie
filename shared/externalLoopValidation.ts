import type {ExternalSnapshot} from './externalLoop';

const keys=(value:Record<string,unknown>,expected:string[])=>Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown,max=20000):value is string=>typeof value==='string'&&value.length>0&&value.length<=max;
const integer=(value:unknown,min=0):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=1_000_000_000;
const date=(value:unknown)=>typeof value==='string'&&/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)&&Number.isFinite(Date.parse(value));
const optionalKeys=(value:Record<string,unknown>,required:string[],optional:string[])=>required.every(key=>Object.hasOwn(value,key))&&Object.keys(value).every(key=>required.includes(key)||optional.includes(key));
export const validPreparedImage=(value:unknown):value is string=>typeof value==='string'&&value.length<=131095&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value);
function validNews(value:unknown):boolean{
 if(!record(value)||!keys(value,['kind','entries'])||value.kind!=='news'||!Array.isArray(value.entries)||value.entries.length>200)return false;
 return value.entries.every(entry=>{
  if(!record(entry)||!optionalKeys(entry,['id','title','source','publishedAt','url'],['description','imageDataUrl','imageCredit'])||!text(entry.id,4096)||!text(entry.title)||!['westfalen-blatt','wdr-owl'].includes(String(entry.source))||!text(entry.url,4096))return false;
  if(entry.description!==undefined&&(typeof entry.description!=='string'||entry.description.length>10000)||entry.imageCredit!==undefined&&(typeof entry.imageCredit!=='string'||entry.imageCredit.length>1000)||entry.imageDataUrl!==undefined&&!validPreparedImage(entry.imageDataUrl))return false;
  try{const url=new URL(entry.url);if(url.protocol!=='https:'||url.username||url.password)return false}catch{return false}
  return entry.publishedAt===null||date(entry.publishedAt);
 });
}
function validTeam(value:unknown):boolean{return record(value)&&optionalKeys(value,['id','name'],['logoDataUrl'])&&integer(value.id,1)&&text(value.name)&&(value.logoDataUrl===undefined||validPreparedImage(value.logoDataUrl))}
function validFootball(value:unknown,key:string):boolean{
 if(!record(value)||!keys(value,['kind','league','season','mode','teams','matches','table'])||value.kind!=='football'||!['bl1','bl2','bl3'].includes(String(value.league))||!key.startsWith(`football:${value.league}:`)||!integer(value.season,1900)||value.season>2500||!['matchday','upcoming','table'].includes(String(value.mode)))return false;
 if(!Array.isArray(value.teams)||!Array.isArray(value.matches)||!Array.isArray(value.table)||value.teams.length>1000||value.matches.length>1000||value.table.length>1000||!value.teams.every(validTeam))return false;
 return value.matches.every(match=>record(match)&&keys(match,['id','startsAt','home','away','status','score'])&&integer(match.id,1)&&date(match.startsAt)&&validTeam(match.home)&&validTeam(match.away)&&['scheduled','in-progress','finished'].includes(String(match.status))&&(match.score===null||(record(match.score)&&keys(match.score,['home','away'])&&integer(match.score.home)&&integer(match.score.away))))&&value.table.every(row=>record(row)&&keys(row,['rank','team','played','goalsFor','goalsAgainst','goalDifference','points'])&&integer(row.rank,1)&&validTeam(row.team)&&integer(row.played)&&integer(row.goalsFor)&&integer(row.goalsAgainst)&&integer(row.goalDifference,-1_000_000)&&integer(row.points,-1_000_000));
}
const numberIn=(value:unknown,min:number,max:number):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
const weatherCode=(value:unknown)=>typeof value==='number'&&[0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(value);
function validWeather(value:unknown,key:string):boolean{
 if(!record(value)||!optionalKeys(value,['kind','location','observedAt','temperature','code','wind','days'],['hourly'])||value.kind!=='weather'||!record(value.location)||!keys(value.location,['name','latitude','longitude'])||!text(value.location.name,160)||!numberIn(value.location.latitude,-90,90)||!numberIn(value.location.longitude,-180,180)||key!==`weather:${value.location.latitude},${value.location.longitude}:${value.location.name}`||!date(value.observedAt)||!numberIn(value.temperature,-100,70)||!weatherCode(value.code)||!numberIn(value.wind,0,600)||!Array.isArray(value.days)||value.days.length!==3)return false;
 if(value.hourly!==undefined&&(!Array.isArray(value.hourly)||value.hourly.length<1||value.hourly.length>96||!value.hourly.every((hour,index,all)=>record(hour)&&keys(hour,['time','temperature','code','rainProbability'])&&date(hour.time)&&numberIn(hour.temperature,-100,70)&&weatherCode(hour.code)&&numberIn(hour.rainProbability,0,100)&&(index===0||Date.parse(String(hour.time))-Date.parse(String(all[index-1].time))===3600000))))return false;
 return value.days.every((day,index,days)=>record(day)&&keys(day,['date','code','minimum','maximum','rainProbability'])&&date(day.date)&&weatherCode(day.code)&&numberIn(day.minimum,-100,70)&&numberIn(day.maximum,-100,70)&&day.minimum<=day.maximum&&numberIn(day.rainProbability,0,100)&&(index===0||(Date.parse(String(day.date))-Date.parse(String((days[index-1] as Record<string,unknown>)?.date))>=82800000&&Date.parse(String(day.date))-Date.parse(String((days[index-1] as Record<string,unknown>)?.date))<=90000000)));
}
/** Identical strict public-field boundary for persisted caches and renderer IPC. */
export function readExternalSnapshot(value:unknown,key:string,now:number):ExternalSnapshot|null{
 const valid=record(value)&&keys(value,['version','key','revision','fetchedAt','stale','payload'])&&value.version===1&&value.key===key&&text(value.key,512)&&text(value.revision,128)&&typeof value.fetchedAt==='number'&&Number.isFinite(value.fetchedAt)&&value.fetchedAt>=0&&value.fetchedAt<=now+60000&&typeof value.stale==='boolean'&&(validNews(value.payload)||validFootball(value.payload,key)||validWeather(value.payload,key));
 return valid?value as ExternalSnapshot:null;
}
