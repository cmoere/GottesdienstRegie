import {describe,it,expect,vi} from 'vitest';
import {TransitAdapter} from './transit';
import {ExternalCache} from './cache';
import {readExternalRequest,externalRequestKey} from '../../shared/externalLoopRequest';
import {readExternalSnapshot} from '../../shared/externalLoopValidation';

const now=Date.parse('2026-11-27T10:00:00Z');
function response(extra:Record<string,unknown>={}){return {ok:true,updatedAt:now,stopId:'de:05711:5075',departures:[{line:'2',destination:'Altenhagen',platform:'Gleis 2',planned:'11:10',real:'11:15',plannedEpoch:(now+600000)/1000,effectiveDepartureEpoch:(now+900000)/1000,status:'',isCancelled:false,adminOriginal:{token:'private'},controlKey:'private',viaStops:['Schillerstraße']}],messages:[{title:'Umleitung',description:'<b>Bitte beachten</b>',lines:['2']},{title:'Andere Linie',text:'Nicht für diese Anzeige',lines:['5']}],messageSourceAvailable:true,...extra}}

describe('Beckhausstraße public transit boundary',()=>{
 it('accepts only the fixed request, never arbitrary URLs or stops',()=>{
  expect(readExternalRequest({kind:'transit'})).toEqual({kind:'transit'});
  expect(readExternalRequest({kind:'transit',stopId:'other'})).toBeNull();
  expect(readExternalRequest({kind:'transit',url:'http://localhost'})).toBeNull();
  expect(externalRequestKey({kind:'transit'})).toBe('transit:beckhausstrasse');
 });
 it('normalizes public fields, keeps plan and forecast separate, filters messages and shares requests',async()=>{
  const fetchText=vi.fn(async(_url:string,_signal:AbortSignal)=>JSON.stringify(response())),adapter=new TransitAdapter({cache:new ExternalCache(null,()=>now),fetchText,now:()=>now});
  const [a,b]=await Promise.all([adapter.load(),adapter.load()]);
  expect(a).toEqual(b);expect(fetchText).toHaveBeenCalledTimes(1);
  expect(fetchText.mock.calls[0]?.[0]).toContain('https://vrr-proxy.crbnm06.workers.dev/api/bottom-departures?');
  expect(a.snapshot?.payload).toMatchObject({kind:'transit',departures:[{plannedAt:now+600000,effectiveAt:now+900000,delayMinutes:5,cancelled:false}],messages:[{title:'Umleitung',text:'Bitte beachten',lines:['2']}]});
  expect(JSON.stringify(a)).not.toContain('private');
  expect(readExternalSnapshot(a.snapshot,'transit:beckhausstrasse',now)).not.toBeNull();
  const corrupted=structuredClone(a.snapshot)!;(corrupted.payload as any).admin={};expect(readExternalSnapshot(corrupted,corrupted.key,now)).toBeNull();
  await adapter.load();expect(fetchText).toHaveBeenCalledTimes(1);adapter.dispose();
 });
 it('retains messages on source failure, bounds stale fallback, rejects ok:false and wrong stops',async()=>{
  let time=now,body=response();const fetchText=vi.fn(async()=>JSON.stringify(body)),adapter=new TransitAdapter({cache:new ExternalCache(null,()=>time),fetchText,now:()=>time});
  await adapter.load();time+=21000;body=response({updatedAt:time,messages:[],messageSourceAvailable:false});
  expect((await adapter.load()).snapshot?.payload).toMatchObject({messages:[{title:'Umleitung'}]});
  time+=21000;body=response({ok:false,error:'Permission denied'});expect((await adapter.load()).status).toBe('stale');
  time+=121000;expect((await adapter.load()).snapshot).toBeNull();
  const invalid=new TransitAdapter({cache:new ExternalCache(null),fetchText:async()=>JSON.stringify(response({stopId:'other'})),now:()=>now});expect((await invalid.load()).snapshot).toBeNull();
 });
 it('honors worker staleness, excludes unsupported lines and invalid or past departures',async()=>{
  const raw=response();const row=raw.departures[0];
  const adapter=new TransitAdapter({cache:new ExternalCache(null,()=>now),now:()=>now,fetchText:async()=>JSON.stringify(response({stale:true,staleAgeMs:30000,departures:[row,{...row,line:'5'},{...row,destination:{bad:true}},{...row,plannedEpoch:(now-60000)/1000,effectiveDepartureEpoch:(now-60000)/1000},{...row,line:'27',isCancelled:true}]}))});
  const reply=await adapter.load();expect(reply.status).toBe('stale');expect(reply.snapshot?.payload).toMatchObject({departures:[{line:'27',cancelled:true},{line:'2'}]});
 });
 it('does not turn fallback data fresh during throttling or keep unavailable messages indefinitely',async()=>{
  let time=now,body=response();const adapter=new TransitAdapter({cache:new ExternalCache(null,()=>time),now:()=>time,fetchText:async()=>JSON.stringify(body)});
  await adapter.load();time+=21000;body=response({ok:false});expect((await adapter.load()).status).toBe('stale');expect((await adapter.load()).status).toBe('stale');
  for(let i=0;i<6;i++){time+=21000;body=response({updatedAt:time,messages:[],messageSourceAvailable:false});await adapter.load()}
  expect((await adapter.load()).snapshot?.payload).toMatchObject({messages:[]});
 });
 it('excludes unrelated network notices but keeps local and manually selected general notices',async()=>{
  const adapter=new TransitAdapter({cache:new ExternalCache(null,()=>now),now:()=>now,fetchText:async()=>JSON.stringify(response({messages:[{title:'W-Langerfeld – Umleitung Rott',lines:[],source:'efa-addinfo-cache'},{title:'Beckhausstraße: Aufzug außer Betrieb',lines:[]},{title:'Bitte andere Zugänge nutzen',lines:[],source:'manual'},{title:'Versteckt',lines:['2'],adminHidden:true}]}))});
  expect((await adapter.load()).snapshot?.payload).toMatchObject({messages:[{title:'Beckhausstraße: Aufzug außer Betrieb'},{title:'Bitte andere Zugänge nutzen'}]});
 });
});
