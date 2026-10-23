import {act,cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ExternalLoopView} from './View';
import {normalizeExternalSettings} from './model';
import type {ExternalSnapshot} from '../../shared/externalLoop';

afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals()});
const news:ExternalSnapshot={version:1,key:'news:wdr-owl',revision:'a',fetchedAt:Date.now(),stale:false,payload:{kind:'news',entries:[{id:'one',title:'Lange vollständige Nachricht über den Gemeindegottesdienst',source:'wdr-owl',publishedAt:'2026-10-23T12:00:00Z',url:'https://www1.wdr.de/a'}]}};
describe('public external loop frame',()=>{
 it('keeps every row readable as static pages when motion is reduced',()=>{
  vi.useFakeTimers();vi.setSystemTime(1000);vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener(){},removeEventListener(){}}));
  const snapshot=structuredClone(news);if(snapshot.payload.kind==='news'){const entry=snapshot.payload.entries[0];snapshot.payload.entries=Array.from({length:10},(_,i)=>({...entry,id:String(i),title:'Nachricht '+(i+1)}))}
  render(<ExternalLoopView snapshot={snapshot} startedAt={1000} settings={normalizeExternalSettings({newsSources:'wdr-owl'})}/>);
  expect(screen.queryByText('Nachricht 10')).toBeNull();
  act(()=>vi.advanceTimersByTime(40000));
  expect(screen.getByText('Nachricht 10')).toBeInTheDocument();
 });
 it('keeps full headlines, source branding and static date metadata without article images or HTML execution',()=>{
  const snapshot=structuredClone(news);if(snapshot.payload.kind==='news')snapshot.payload.entries[0].title='<script>bad()</script> und die vollständige Nachricht';
  const {container}=render(<ExternalLoopView snapshot={snapshot} startedAt={Date.now()} settings={normalizeExternalSettings({externalKind:'news',newsSources:'wdr-owl'})}/>);
  expect(screen.getAllByText('<script>bad()</script> und die vollständige Nachricht').length).toBeGreaterThan(0);
  expect(container.querySelector('script')).toBeNull();expect(screen.getByAltText('WDR')).toHaveAttribute('src',expect.stringContaining('news-logos/wdr.svg'));
  expect(screen.getByText(/Quelle: WDR.de/)).toBeInTheDocument();expect(screen.getByText(/Fr\., 23\.10\.2026/)).toBeInTheDocument();
  expect(container.querySelectorAll('img')).toHaveLength(1);
 });
 it('scrolls an overflowing table while keeping every rank and highlighting only the selected club',()=>{
  const snapshot:ExternalSnapshot={version:1,key:'football:bl1:table',revision:'a',fetchedAt:Date.now(),stale:false,payload:{kind:'football',league:'bl1',season:2026,mode:'table',teams:[{id:1,name:'Verein 1'}],matches:[],table:Array.from({length:24},(_,index)=>({rank:index+1,team:{id:index+1,name:`Verein ${index+1}`},played:4,goalsFor:5,goalsAgainst:3,goalDifference:2,points:9}))}};
  const {container}=render(<ExternalLoopView snapshot={snapshot} startedAt={Date.now()} settings={normalizeExternalSettings({externalKind:'football',footballMode:'table',footballTeamId:1})}/>);
  expect(screen.getAllByRole('row')).toHaveLength(25);expect(container.querySelectorAll('[data-selected-club="true"]')).toHaveLength(1);
  expect(Number(container.querySelector('[data-scroll-distance]')?.getAttribute('data-scroll-distance'))).toBeGreaterThan(0);
  expect(screen.getByText('24')).toBeInTheDocument();expect(screen.queryByText(/undefined|\[object Object\]|ERR_NETWORK/)).toBeNull();
 });
 it('distinguishes missing results from a genuine zero score',()=>{
  const snapshot:ExternalSnapshot={version:1,key:'football:bl1:matchday',revision:'a',fetchedAt:Date.now(),stale:false,payload:{kind:'football',league:'bl1',season:2026,mode:'matchday',teams:[],table:[],matches:[{id:1,startsAt:'2026-10-23T12:00:00Z',home:{id:1,name:'A'},away:{id:2,name:'B'},score:null,status:'scheduled'},{id:2,startsAt:'2026-10-23T13:00:00Z',home:{id:3,name:'C'},away:{id:4,name:'D'},score:{home:0,away:0},status:'finished'}]}};
  render(<ExternalLoopView snapshot={snapshot} startedAt={Date.now()} settings={normalizeExternalSettings({externalKind:'football'})}/>);
  expect(screen.getByText('–')).toBeInTheDocument();expect(screen.getByText('0:0')).toBeInTheDocument();expect(screen.getByText(/Endstand/)).toBeInTheDocument();
 });
});
