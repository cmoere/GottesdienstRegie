import {describe,expect,it} from 'vitest';
import {normalizeExternalSettings,externalLoopMinimumDuration,visibleExternalPayload,externalReducedPages} from './model';
import type {ExternalSnapshot} from '../../shared/externalLoop';

describe('external loop settings and shared presentation planning',()=>{
 it('preserves every headline character across reduced-motion continuation frames with adequate duration',()=>{
  const title='Eine vollständige Nachricht über den Gottesdienst und das Gemeindeleben. '.repeat(20);
  const snapshot:ExternalSnapshot={version:1,key:'news:wdr-owl',revision:'r',fetchedAt:1000,stale:false,payload:{kind:'news',entries:[{id:'one',title,source:'wdr-owl',publishedAt:null,url:'https://www1.wdr.de/a'}]}};
  const settings=normalizeExternalSettings({newsSources:'wdr-owl',durationSeconds:1}),pages=externalReducedPages(snapshot,settings);
  expect(pages.length).toBeGreaterThan(1);expect(pages.flat().map(row=>row.title.replace(/\n/g,'')).join('')).toBe(title);
  expect(externalLoopMinimumDuration(snapshot,settings)).toBeGreaterThanOrEqual(pages.length*10000);
 });
 it('normalizes source and football selections independently of other settings',()=>{
  expect(normalizeExternalSettings({externalKind:'news'})).toEqual({kind:'news',sources:['westfalen-blatt','wdr-owl'],limit:10,durationSeconds:15});
  expect(normalizeExternalSettings({externalKind:'football',footballLeague:'bl2',footballMode:'invalid',footballTeamId:42,durationSeconds:0})).toEqual({kind:'football',league:'bl2',mode:'matchday',teamId:42,durationSeconds:1});
  expect(normalizeExternalSettings({externalKind:'news',newsSources:'wdr-owl',newsLimit:500})).toMatchObject({sources:['wdr-owl'],limit:10});
 });
 it('bounds imported durations so JavaScript timers cannot overflow into rapid slide changes',()=>{
  expect(normalizeExternalSettings({durationSeconds:Number.MAX_VALUE}).durationSeconds).toBeLessThanOrEqual(86400);
 });
 it('keeps table ranks while filtering only match lists by chosen club',()=>{
  const snapshot:ExternalSnapshot={version:1,key:'football:bl1:table',revision:'a',fetchedAt:1000,stale:false,payload:{kind:'football',league:'bl1',season:2026,mode:'table',teams:[{id:1,name:'A'},{id:2,name:'B'}],matches:[{id:1,home:{id:1,name:'A'},away:{id:2,name:'B'},startsAt:'2026-10-23T12:00:00Z',status:'scheduled',score:null},{id:2,home:{id:3,name:'C'},away:{id:4,name:'D'},startsAt:'2026-10-23T13:00:00Z',status:'scheduled',score:null}],table:[{rank:1,team:{id:2,name:'B'},played:1,goalsFor:1,goalsAgainst:0,goalDifference:1,points:3},{rank:2,team:{id:1,name:'A'},played:1,goalsFor:0,goalsAgainst:1,goalDifference:-1,points:0}]}};
  const settings=normalizeExternalSettings({externalKind:'football',footballTeamId:1}),filtered=visibleExternalPayload(snapshot,settings);
  expect(filtered.kind==='football'&&filtered.matches).toHaveLength(1);
  expect(filtered.kind==='football'&&filtered.table.map(row=>[row.rank,row.team.id])).toEqual([[1,2],[2,1]]);
  expect(snapshot.payload.kind==='football'&&snapshot.payload.matches).toHaveLength(2);
 });
 it('calculates a readable minimum for overflowing content instead of trusting a one-second setting',()=>{
  const snapshot:ExternalSnapshot={version:1,key:'news:wdr-owl',revision:'a',fetchedAt:1000,stale:false,payload:{kind:'news',entries:Array.from({length:10},(_,i)=>({id:String(i),title:'Nachricht',source:'wdr-owl',publishedAt:null,url:`https://www1.wdr.de/${i}`}))}};
  expect(externalLoopMinimumDuration(snapshot,normalizeExternalSettings({externalKind:'news',durationSeconds:1}))).toBeGreaterThan(40000);
 });
});
