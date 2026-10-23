import type {ExternalPayload,ExternalReply,ExternalRequest,ExternalSnapshot,FootballLeague,FootballMatch,FootballTableRow,FootballTeam} from '../../shared/externalLoop';
import type {NewsDependencies} from './news';
import {createHash} from 'node:crypto';
import {EXTERNAL_RESPONSE_LIMIT} from './http';

type FootballRequest=Extract<ExternalRequest,{kind:'football'}>;
type FootballPayload=Extract<ExternalPayload,{kind:'football'}>;
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const integer=(value:unknown,min=0):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=1_000_000_000;
function team(value:unknown,idKey='teamId'):FootballTeam|null{
 if(!record(value)||!integer(value[idKey],1)||typeof value.teamName!=='string'||!value.teamName.trim()||value.teamName.length>20000)return null;
 return{id:value[idKey],name:value.teamName.trim()};
}
function normalizeMatch(value:unknown,league:FootballLeague,season:number,now:number):FootballMatch|null{
 if(!record(value)||value.leagueShortcut!==league||value.leagueSeason!==season||!integer(value.matchID,1)||typeof value.matchIsFinished!=='boolean')return null;
 const home=team(value.team1),away=team(value.team2),utc=value.matchDateTimeUTC;
 if(!home||!away||typeof utc!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/i.test(utc)||!Number.isFinite(Date.parse(utc)))return null;
 const startsAt=new Date(utc).toISOString(),finished=value.matchIsFinished,hasStarted=Date.parse(startsAt)<=now;
 const results=Array.isArray(value.matchResults)?value.matchResults.filter(record):[];
 // Bundesliga's official full-time slot is also updated before completion.
 // It is labelled in-progress until matchIsFinished, never as an end result.
 const full=results.filter(result=>(result.resultTypeKind==='After90Minutes'||(!result.resultTypeKind&&result.resultTypeID===2))&&integer(result.pointsTeam1)&&integer(result.pointsTeam2));
 const half=results.filter(result=>(result.resultTypeKind==='HalfTime'||(!result.resultTypeKind&&result.resultTypeID===1))&&integer(result.pointsTeam1)&&integer(result.pointsTeam2));
 const selected=full.length===1?full[0]:!finished&&full.length===0&&half.length===1?half[0]:null;
 const score=selected&&(finished||hasStarted)?{home:selected.pointsTeam1 as number,away:selected.pointsTeam2 as number}:null;
 return{id:value.matchID,startsAt,home,away,status:finished?'finished':hasStarted&&score?'in-progress':'scheduled',score};
}
function normalizeTable(values:unknown[]):FootballTableRow[]{
 return values.flatMap((value,index)=>{
  if(!record(value))return[];const selected=team(value,'teamInfoId');
  if(!selected||!integer(value.matches)||!integer(value.goals)||!integer(value.opponentGoals)||!integer(value.goalDiff,-1_000_000)||!integer(value.points,-1_000_000))return[];
  return[{rank:index+1,team:selected,played:value.matches,goalsFor:value.goals,goalsAgainst:value.opponentGoals,goalDifference:value.goalDiff,points:value.points}];
 });
}
const isPayload=(snapshot:ExternalSnapshot|null,request:FootballRequest):snapshot is ExternalSnapshot&{payload:FootballPayload}=>snapshot?.payload.kind==='football'&&snapshot.payload.league===request.league&&snapshot.payload.mode===request.mode;
const reply=(snapshot:ExternalSnapshot|null,stale=false):ExternalReply=>{
 if(!snapshot||snapshot.payload.kind!=='football')return{snapshot:null,status:'unavailable'};
 const empty=snapshot.payload.mode==='table'?snapshot.payload.table.length===0:snapshot.payload.matches.length===0;
 return{snapshot:structuredClone({...snapshot,stale}),status:empty?'empty':stale?'stale':'ready'};
};
export class FootballAdapter{
 private readonly now:()=>number;
 private readonly pending=new Map<string,Promise<ExternalReply>>();
 private readonly resources=new Map<string,{at:number;rows:unknown[]}>();
 private readonly resourcePending=new Map<string,Promise<unknown[]>>();
 private readonly resourceErrors=new Map<string,number>();
 private readonly memory=new Map<string,ExternalSnapshot>();
 private readonly attempted=new Map<string,number>();
 private readonly controllers=new Set<AbortController>();
 private disposed=false;
 constructor(private readonly dependencies:NewsDependencies){this.now=dependencies.now??Date.now}
 load(request:FootballRequest):Promise<ExternalReply>{
  if(this.disposed||!['bl1','bl2','bl3'].includes(request.league)||!['matchday','upcoming','table'].includes(request.mode))return Promise.resolve({snapshot:null,status:'unavailable'});
  const key=`football:${request.league}:${request.mode}`,pending=this.pending.get(key);if(pending)return pending;
  const work=this.prepare(request,key).finally(()=>{this.pending.delete(key)});this.pending.set(key,work);return work;
 }
 private async prepare(request:FootballRequest,key:string):Promise<ExternalReply>{
  const persisted=await this.dependencies.cache.read(key,21600000).catch(()=>null),old=this.memory.get(key)??persisted,now=this.now(),interval=request.mode==='table'?300000:60000;
  if(this.disposed)return{snapshot:null,status:'unavailable'};
  const cached=isPayload(old,request)&&now-old.fetchedAt<=21600000&&old.fetchedAt<=now+60000?old:null;
  if(!cached)this.memory.delete(key);
  if(cached&&now-cached.fetchedAt<interval)return reply(cached);
  if(this.attempted.has(key)&&now-this.attempted.get(key)!<interval)return reply(cached,true);
  this.attempted.set(key,now);const controller=new AbortController();this.controllers.add(controller);
  try{
   const current=await this.resource(`getmatchdata/${request.league}`,60000,controller.signal);
   const seasons=new Set<number>();
   for(const row of current){
    if(!record(row)||row.leagueShortcut!==request.league||!integer(row.leagueSeason,1900)||row.leagueSeason>2500)throw Error('league-season-mismatch');
    seasons.add(row.leagueSeason);
   }
   if(seasons.size!==1)throw Error('unavailable-season');
   const season=[...seasons][0],teams=await this.loadTeams(request.league,season,controller.signal);
   let raw=current,table:FootballTableRow[]=[];
   if(request.mode==='upcoming')raw=await this.resource(`getmatchdata/${request.league}/${season}`,60000,controller.signal);
   if(request.mode==='table')table=normalizeTable(await this.resource(`getbltable/${request.league}/${season}`,300000,controller.signal));
   if(raw.some(row=>record(row)&&(row.leagueShortcut!==request.league||row.leagueSeason!==season)))throw Error('league-season-mismatch');
   const seen=new Set<number>(),matches=request.mode==='table'?[]:raw.flatMap(row=>{
    const match=normalizeMatch(row,request.league,season,this.now());if(!match||seen.has(match.id))return[];seen.add(match.id);
    return request.mode==='upcoming'&&(match.status==='finished'||Date.parse(match.startsAt)<=this.now())?[]:[match];
   }).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)||a.id-b.id);
   if(this.disposed)return{snapshot:null,status:'unavailable'};
   const payload:FootballPayload={kind:'football',league:request.league,season,mode:request.mode,teams,matches,table};
   const snapshot:ExternalSnapshot={version:1,key,revision:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),fetchedAt:this.now(),stale:false,payload};
   this.memory.set(key,snapshot);await this.dependencies.cache.write(snapshot).catch(()=>{});return reply(snapshot);
  }catch{return this.disposed?{snapshot:null,status:'unavailable'}:reply(cached,true)}finally{this.controllers.delete(controller)}
 }
 private async loadTeams(league:FootballLeague,season:number,signal:AbortSignal):Promise<FootballTeam[]>{
  const key=`football:${league}:${season}:teams`,cached=await this.dependencies.cache.read(key,21600000).catch(()=>null);
  if(this.disposed||signal.aborted)throw Error('cancelled');
  if(cached?.payload.kind==='football'&&cached.payload.league===league&&cached.payload.season===season&&this.now()-cached.fetchedAt<21600000)return cached.payload.teams;
  const seen=new Set<number>(),teams=(await this.resource(`getavailableteams/${league}/${season}`,21600000,signal)).flatMap(row=>{const value=team(row);if(!value||seen.has(value.id))return[];seen.add(value.id);return[value]});
  if(!teams.length)throw Error('unavailable-teams');
  const payload:FootballPayload={kind:'football',league,season,mode:'matchday',teams,matches:[],table:[]};
  await this.dependencies.cache.write({version:1,key,revision:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),fetchedAt:this.now(),stale:false,payload}).catch(()=>{});
  return teams;
 }
 private resource(endpoint:string,interval:number,signal:AbortSignal):Promise<unknown[]>{
  if(this.disposed||signal.aborted)return Promise.reject(Error('cancelled'));
  const cached=this.resources.get(endpoint);if(cached&&this.now()-cached.at<interval)return Promise.resolve(cached.rows);
  const pending=this.resourcePending.get(endpoint);if(pending)return pending;
  const failedAt=this.resourceErrors.get(endpoint);if(failedAt!==undefined&&this.now()-failedAt<Math.min(interval,60000))return Promise.reject(Error('source-backoff'));
  const work=this.dependencies.fetchText(`https://api.openligadb.de/${endpoint}`,signal).then(text=>{
   if(this.disposed||signal.aborted)throw Error('cancelled');
   if(Buffer.byteLength(text)>EXTERNAL_RESPONSE_LIMIT)throw Error('size-limit');
   const rows:unknown=JSON.parse(text);if(!Array.isArray(rows)||rows.length>1000)throw Error('invalid-source-array');
   this.resources.set(endpoint,{at:this.now(),rows});this.resourceErrors.delete(endpoint);
   if(this.resources.size>32){const oldest=[...this.resources].sort((a,b)=>a[1].at-b[1].at)[0];this.resources.delete(oldest[0])}
   return rows;
  }).catch(error=>{if(!this.disposed)this.resourceErrors.set(endpoint,this.now());throw error}).finally(()=>{this.resourcePending.delete(endpoint)});
  this.resourcePending.set(endpoint,work);return work;
 }
 dispose(){this.disposed=true;for(const controller of this.controllers)controller.abort();this.controllers.clear();this.resources.clear();this.resourceErrors.clear();this.memory.clear();this.attempted.clear()}
}
