import {describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import {FootballAdapter} from './football';
import {ExternalCache} from './cache';
import type {ExternalReply,ExternalRequest,FootballLeague} from '../../shared/externalLoop';

const start=Date.parse('2026-10-23T12:00:00Z');
const request=(mode:'matchday'|'upcoming'|'table'='matchday',league:FootballLeague='bl1'):Extract<ExternalRequest,{kind:'football'}>=>({kind:'football',mode,league});
async function fixture(){return JSON.parse(await fs.readFile('tests/fixtures/external-loop/football.json','utf8'))}
function payload(reply:ExternalReply){if(reply.snapshot?.payload.kind!=='football')throw Error('missing-football');return reply.snapshot.payload}
async function setup(){
 const data=await fixture(),clock={now:start},state={offline:false},requests:string[]=[];
 const adapter=new FootballAdapter({cache:new ExternalCache(null,()=>clock.now),now:()=>clock.now,fetchText:async url=>{
  requests.push(url);if(state.offline)throw Error('offline');const path=new URL(url).pathname;
  if(path==='/getmatchdata/bl1'||/^\/getmatchdata\/bl1\/\d+$/.test(path))return JSON.stringify(data.current);
  if(/^\/getavailableteams\/bl1\/\d+$/.test(path))return JSON.stringify(data.teams);
  if(/^\/getbltable\/bl1\/\d+$/.test(path))return JSON.stringify(data.table);
  throw Error(`unexpected-endpoint:${path}`);
 }});
 return{adapter,data,clock,state,requests};
}
describe('OpenLigaDB normalized football snapshots',()=>{
 it('loads prepared club logos by stable team ID without forwarding provider URLs',async()=>{
  const data=await fixture(),logo='data:image/jpeg;base64,/9j/AA==';data.teams[0].teamIconUrl='https://i.imgur.com/club.png';
  const adapter=new FootballAdapter({cache:new ExternalCache(null,()=>start),now:()=>start,loadImage:async(source,url)=>source==='football'&&url==='https://i.imgur.com/club.png'?logo:null,fetchText:async url=>JSON.stringify(url.includes('getavailableteams')?data.teams:data.current)});
  const result=payload(await adapter.load(request()));expect(result.teams[0].logoDataUrl).toBe(logo);expect(JSON.stringify(result)).not.toContain('https://i.imgur.com');expect(result.matches[0].score).toEqual({home:0,away:0});
 });
 it('preservesZeroButNotMissingScore and never forwards team icons',async()=>{
  const {adapter}=await setup(),matches=payload(await adapter.load(request())).matches;
  expect(matches).toMatchObject([{id:11,status:'finished',score:{home:0,away:0}},{id:12,status:'in-progress',score:{home:1,away:0}},{id:13,status:'scheduled',score:null}]);
  expect(Object.keys(matches[0].home).sort()).toEqual(['id','name']);
 });
 it('choosesFinalVsIntermediateResult using metadata not array order and not an arbitrary unknown result',async()=>{
  const {adapter,data}=await setup();data.current[0].matchResults.push({resultTypeID:1,resultTypeKind:'HalfTime',pointsTeam1:4,pointsTeam2:3});
  data.current[1].matchResults=[{resultTypeID:87,resultTypeKind:'Unknown',resultOrderID:999,pointsTeam1:5,pointsTeam2:5}];
  const matches=payload(await adapter.load(request())).matches;
  expect(matches[0].score).toEqual({home:0,away:0});expect(matches[1].score).toBeNull();
 });
 it('resolvesSeasonRollover from current provider data rather than a fixed year',async()=>{
  const {adapter,data,clock,requests}=await setup();await adapter.load(request());
  for(const match of data.current)match.leagueSeason=2031;clock.now+=60000;
  expect(payload(await adapter.load(request())).season).toBe(2031);
  expect(requests.some(url=>url.endsWith('/getavailableteams/bl1/2031'))).toBe(true);
 });
 it('keepsTableRankingAndTeamIds and returns only genuinely upcoming games',async()=>{
  const {adapter}=await setup();
  expect(payload(await adapter.load(request('table'))).table).toEqual([{rank:1,team:{id:2,name:'Verein B'},played:4,goalsFor:8,goalsAgainst:2,goalDifference:6,points:10},{rank:2,team:{id:1,name:'Verein A'},played:4,goalsFor:6,goalsAgainst:3,goalDifference:3,points:10}]);
  expect(payload(await adapter.load(request('upcoming'))).matches).toMatchObject([{id:13,status:'scheduled',score:null}]);
 });
 it('deduplicatesFootballRefresh and enforces60/300/21600second source intervals',async()=>{
  const {adapter,clock,requests}=await setup();await Promise.all([adapter.load(request()),adapter.load(request()),adapter.load(request('table'))]);
  const calls=(part:string)=>requests.filter(url=>url.includes(part)).length;
  expect(calls('/getmatchdata/bl1')).toBe(1);expect(calls('/getavailableteams/')).toBe(1);expect(calls('/getbltable/')).toBe(1);
  clock.now+=59999;await adapter.load(request());expect(calls('/getmatchdata/bl1')).toBe(1);
  clock.now++;await adapter.load(request());await adapter.load(request('table'));expect(calls('/getmatchdata/bl1')).toBe(2);expect(calls('/getbltable/')).toBe(1);
  clock.now=start+300000;await adapter.load(request('table'));expect(calls('/getbltable/')).toBe(2);expect(calls('/getavailableteams/')).toBe(1);
  clock.now=start+21600000;await adapter.load(request());expect(calls('/getavailableteams/')).toBe(2);
 });
 it('rejectsMismatchedLeagueAndSeason, malformed rows, and unavailable season discovery',async()=>{
  for(const mutate of [(data:any)=>{data.current[0].leagueShortcut='bl2'},(data:any)=>{data.current[0].leagueSeason=2025},(data:any)=>{data.current=[]}]){
   const {adapter,data}=await setup();mutate(data);expect((await adapter.load(request())).snapshot).toBeNull();
  }
  const {adapter,data}=await setup();data.current.push({...data.current[0],matchID:'invalid'});
  expect(payload(await adapter.load(request())).matches).toHaveLength(3);
 });
 it('uses stale snapshots for at most6hours without clearing another league',async()=>{
  const {adapter,clock,state,requests}=await setup();await adapter.load(request());state.offline=true;clock.now+=60000;
  expect((await adapter.load(request())).status).toBe('stale');const attempts=requests.length;
  await adapter.load(request());expect(requests).toHaveLength(attempts);
  clock.now=start+21600001;expect(await adapter.load(request())).toEqual({snapshot:null,status:'unavailable'});
 });
 it('keys late old-league replies independently',async()=>{
  const data=await fixture();let release:()=>void=()=>{};
  const adapter=new FootballAdapter({cache:new ExternalCache(null,()=>start),now:()=>start,fetchText:async url=>{
   if(url.endsWith('/getmatchdata/bl1'))await new Promise<void>(resolve=>{release=resolve});
   if(url.includes('/getmatchdata/'))return JSON.stringify(data.current.map((match:any)=>({...match,leagueShortcut:url.includes('bl2')?'bl2':'bl1'})));
   if(url.includes('/getavailableteams/'))return JSON.stringify(data.teams);throw Error('unexpected');
  }});
  const slow=adapter.load(request());await new Promise(resolve=>setTimeout(resolve,0));
  expect(payload(await adapter.load(request('matchday','bl2'))).league).toBe('bl2');release();expect(payload(await slow).league).toBe('bl1');
  expect(payload(await adapter.load(request('matchday','bl2'))).league).toBe('bl2');
 });
 it('restores a validated cached football snapshot on a fresh adapter without a network call',async()=>{
  const {adapter}=await setup(),reply=await adapter.load(request()),cache=new ExternalCache(null,()=>start);
  if(!reply.snapshot)throw Error('missing-snapshot');await cache.write(reply.snapshot);
  const restored=new FootballAdapter({cache,now:()=>start,fetchText:async()=>{throw Error('must-not-fetch')}});
  expect(payload(await restored.load(request())).matches[0]).toMatchObject({id:11,score:{home:0,away:0}});
  await expect(cache.write({...reply.snapshot,payload:{...reply.snapshot.payload,teams:[{id:1,name:'A',teamIconUrl:'https://example.invalid/logo'}]}} as any)).rejects.toThrow('invalid-snapshot');
 });
});
