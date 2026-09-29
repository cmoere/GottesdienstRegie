import {describe,expect,it} from 'vitest';
import {FirebaseGemeindeService,type CommunityRealtimeAdapter} from './FirebaseGemeindeService';

function fakeAdapter(){
  let eventListener:(rows:Record<string,unknown>)=>void=()=>{};
  let handlers:any;
  const counts={events:0,announcements:0};
  const adapter:CommunityRealtimeAdapter={
    watchCollection:(_path,listener)=>{counts.events+=1;eventListener=listener;return()=>{}},
    watchChildren:(_path,next)=>{counts.announcements+=1;handlers=next;return()=>{}},
    watchConnection:(listener)=>{listener(true);return()=>{}},
  };
  return {adapter,counts,emitEvents:(rows:Record<string,unknown>)=>eventListener(rows),add:(key:string,value:unknown)=>handlers.added(key,value),change:(key:string,value:unknown)=>handlers.changed(key,value),remove:(key:string)=>handlers.removed(key)};
}

describe('FirebaseGemeindeService',()=>{
  it('shares one realtime subscription and preserves event child keys',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
    service.subscribeEvents(value=>seen.push(value));
    service.subscribeEvents(()=>{});
    fake.emitEvents({'-Oabc123XYZ':{titel:'Gottesdienst'}});
    expect(seen.at(-1)).toEqual([{eventKey:'-Oabc123XYZ',titel:'Gottesdienst'}]);
    expect(fake.counts.events).toBe(1);
  });

  it('applies child add, change and remove exactly once while preserving message ids',()=>{
    const fake=fakeAdapter(),service=new FirebaseGemeindeService(fake.adapter),seen:any[]=[];
    service.subscribeAnnouncements(value=>seen.push(value));
    fake.add('-Omsg123XYZ',{titel:'Alt'});
    fake.change('-Omsg123XYZ',{titel:'Neu'});
    fake.remove('-Omsg123XYZ');
    expect(seen).toEqual([
      [{messageId:'-Omsg123XYZ',titel:'Alt'}],
      [{messageId:'-Omsg123XYZ',titel:'Neu'}],
      [],
    ]);
    expect(fake.counts.announcements).toBe(1);
  });
});
