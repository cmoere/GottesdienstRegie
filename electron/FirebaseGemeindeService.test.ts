import {describe,expect,it,vi,afterEach} from 'vitest';
import {FirebaseGemeindeService,type CommunityRealtimeAdapter} from './FirebaseGemeindeService';

function fakeAdapter(){
  const handlers=new Map<string,any>();
  const counts={events:0,rooms:0,announcements:0};
  const adapter:CommunityRealtimeAdapter={
    watchChildren:(path,next)=>{counts[path==='veranstaltungen'?'events':path==='rooms'?'rooms':'announcements']+=1;handlers.set(path,next);return()=>{}},
    watchConnection:(listener)=>{listener(true);return()=>{}},
  };
  const emit=(path:'veranstaltungen'|'meldungen'|'rooms',action:'added'|'changed'|'removed',key:string,value?:unknown)=>handlers.get(path)[action](key,value);
  return {adapter,counts,emit,sync:(path:string,keys:string[])=>handlers.get(path).synced(keys)};
}

describe('FirebaseGemeindeService',()=>{
 afterEach(()=>vi.useRealTimers());
 it('does not label a reconnect as a new data update',async()=>{
  vi.useFakeTimers();vi.setSystemTime(1000);
  const fake=fakeAdapter();let connection!:(connected:boolean)=>void;const seen:any[]=[];
  const service=new FirebaseGemeindeService({...fake.adapter,watchConnection:listener=>{connection=listener;listener(true);return()=>{}}},{write:async()=>{},read:async()=>({mode:'offline-cache',updatedAt:1000,events:[],rooms:[],announcements:[]})} as any);
  service.subscribeConnection(value=>seen.push(value));service.subscribeEvents(()=>{});service.subscribeRooms(()=>{});service.subscribeAnnouncements(()=>{});
  fake.sync('veranstaltungen',[]);fake.sync('rooms',[]);fake.sync('meldungen',[]);
  connection(false);await Promise.resolve();vi.setSystemTime(5000);connection(true);
  expect(seen.at(-1).updatedAt).toBe(1000);
 });
 it('does not overwrite the last valid offline snapshot with partially loaded startup data',()=>{
  const fake=fakeAdapter(),writes:any[]=[];
  const service=new FirebaseGemeindeService(fake.adapter,{write:async(value:unknown)=>{writes.push(value)}} as any);
  service.subscribeConnection(()=>{});service.subscribeEvents(()=>{});service.subscribeRooms(()=>{});service.subscribeAnnouncements(()=>{});
  fake.emit('veranstaltungen','added','event',{titel:'Neu'});
  fake.sync('veranstaltungen',['event']);fake.sync('rooms',[]);
  expect(writes).toEqual([]);
  fake.sync('meldungen',[]);
  expect(writes.at(-1).events[0].eventKey).toBe('event');
 });
 it('reports the last synchronized data change rather than only connection time',()=>{
  vi.useFakeTimers();vi.setSystemTime(1000);
  const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
  service.subscribeConnection(value=>seen.push(value));service.subscribeEvents(()=>{});service.subscribeRooms(()=>{});service.subscribeAnnouncements(()=>{});
  fake.sync('veranstaltungen',[]);fake.sync('rooms',[]);fake.sync('meldungen',[]);
  vi.setSystemTime(5000);fake.emit('veranstaltungen','changed','event',{titel:'Neu'});
  expect(seen.at(-1).updatedAt).toBe(5000);
 });
  it('replays online status and synchronized empty collections to a late preflight subscriber',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter);
    service.subscribeConnection(()=>{});
    service.subscribeEvents(()=>{});service.subscribeRooms(()=>{});service.subscribeAnnouncements(()=>{});
    fake.sync('veranstaltungen',[]);fake.sync('rooms',[]);fake.sync('meldungen',[]);
    const connections:any[]=[],events:any[]=[],rooms:any[]=[],messages:any[]=[];
    service.subscribeConnection(value=>connections.push(value));
    service.subscribeEvents(value=>events.push(value));
    service.subscribeRooms(value=>rooms.push(value));
    service.subscribeAnnouncements(value=>messages.push(value));
    expect(connections.at(-1)).toMatchObject({mode:'online',connected:true});
    expect(events).toEqual([[]]);expect(rooms).toEqual([[]]);expect(messages).toEqual([[]]);
  });
  it('reconciles removed records and preserves authoritative child ids',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
    service.subscribeEvents(value=>seen.push(value));
    fake.emit('veranstaltungen','added','real',{eventKey:'wrong',titel:'Termin'});
    expect(seen.at(-1)[0].eventKey).toBe('real');
    fake.sync('veranstaltungen',[]);
    expect(seen.at(-1)).toEqual([]);
  });
  it('shares one realtime subscription and preserves event child keys',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
    service.subscribeEvents(value=>seen.push(value));
    service.subscribeEvents(()=>{});
    fake.emit('veranstaltungen','added','-Oabc123XYZ',{titel:'Gottesdienst'});
    fake.emit('veranstaltungen','changed','-Oabc123XYZ',{titel:'Neuer Titel'});
    expect(seen).toEqual([
      [{eventKey:'-Oabc123XYZ',titel:'Gottesdienst'}],
      [{eventKey:'-Oabc123XYZ',titel:'Neuer Titel'}],
    ]);
    expect(fake.counts.events).toBe(1);
  });

  it('applies room child updates without losing the canonical firebase key',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
    service.subscribeRooms(value=>seen.push(value));
    fake.emit('rooms','added','-dieJsO8X',{raumname:'Eltern-Kind-Raum'});
    fake.emit('rooms','changed','-dieJsO8X',{raumname:'Familienraum'});
    fake.emit('rooms','removed','-dieJsO8X');
    expect(seen).toEqual([
      [{roomId:'-dieJsO8X',raumname:'Eltern-Kind-Raum'}],
      [{roomId:'-dieJsO8X',raumname:'Familienraum'}],
      [],
    ]);
    expect(fake.counts.rooms).toBe(1);
  });

  it('applies child add, change and remove exactly once while preserving message ids',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
    service.subscribeAnnouncements(value=>seen.push(value));
    fake.emit('meldungen','added','-Omsg123XYZ',{titel:'Alt'});
    fake.emit('meldungen','changed','-Omsg123XYZ',{titel:'Neu'});
    fake.emit('meldungen','removed','-Omsg123XYZ');
    expect(seen).toEqual([
      [{messageId:'-Omsg123XYZ',titel:'Alt'}],
      [{messageId:'-Omsg123XYZ',titel:'Neu'}],
      [],
    ]);
    expect(fake.counts.announcements).toBe(1);
  });
});
