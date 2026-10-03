import {describe,expect,it} from 'vitest';
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
