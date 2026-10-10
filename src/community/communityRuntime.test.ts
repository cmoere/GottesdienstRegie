import {afterEach,expect,it,vi} from 'vitest';
import {communityPreflight} from './communityPreflight';

afterEach(()=>{vi.useRealTimers();delete window.desktop;vi.resetModules()});
it.each([false,true])('waits for asynchronous IPC data and synchronization flags (%s) before evaluating the linked event',async synchronizationFlags=>{
 vi.useFakeTimers();
 const listeners:Record<string,(value:any)=>void>={};
 window.desktop={community:{
   onEvents:(fn:any)=>{listeners.events=fn},onRooms:(fn:any)=>{listeners.rooms=fn},
   onAnnouncements:(fn:any)=>{listeners.messages=fn},onConnection:(fn:any)=>{listeners.connection=fn},
   start:async()=>{setTimeout(()=>{
     listeners.events([{eventKey:'-child',id:'legacy',veranstaltungsort:'raum',raum:'saal'}]);
     listeners.rooms({saal:{raumname:'Gemeindesaal'}});listeners.messages([]);
     listeners.connection({mode:'online',...(synchronizationFlags?{loaded:{events:false,rooms:false,announcements:false}}:{})});
     if(synchronizationFlags)setTimeout(()=>listeners.connection({mode:'online',loaded:{events:true,rooms:true,announcements:true}}),100);
   },100);return true},
 }} as any;
 const runtime=await import('./communityRuntime');
 let done=false;
 const pending=runtime.waitForCommunityRuntime().then(value=>{done=true;return value});
 await vi.advanceTimersByTimeAsync(50);expect(done).toBe(false);
 await vi.advanceTimersByTimeAsync(60);
 if(synchronizationFlags){expect(done).toBe(false);await vi.advanceTimersByTimeAsync(100)}
 const check=communityPreflight(await pending,'-child',[]);
 expect(check.linkedEventResolved).toBe(true);expect(check.currentRoomResolved).toBe(true);
 expect(check.warnings).not.toContain('Gemeindedaten sind derzeit nicht verfügbar.');
});
it('bounds unavailable community waits so a test can still start offline',async()=>{
 vi.useFakeTimers();
 window.desktop={community:{onEvents:()=>{},onRooms:()=>{},onAnnouncements:()=>{},onConnection:()=>{},start:async()=>true}} as any;
 const runtime=await import('./communityRuntime');
 const pending=runtime.waitForCommunityRuntime(200);
 await vi.advanceTimersByTimeAsync(201);
 expect((await pending).mode).toBe('empty');
});
