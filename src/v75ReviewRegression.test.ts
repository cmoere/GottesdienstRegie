import {it,expect} from 'vitest';
import {RoomService} from './community/RoomService';
import {usePresentation} from './store';
import {EventService} from './community/EventService';
import {PostProgramRoomNoticeController,PostProgramRoomNoticeService} from './community/PostProgramRoomNoticeService';

it('keeps Firebase room keys distinct despite conflicting legacy ids',()=>{
 const rooms=new RoomService([{roomId:'firebase-a',id:'duplicate',name:'Saal A'},{roomId:'firebase-b',id:'duplicate',name:'Saal B'}]);
 expect(rooms.resolve('firebase-a')?.name).toBe('Saal A');
 expect(rooms.resolve('firebase-b')?.name).toBe('Saal B');
 expect(rooms.resolve('duplicate')).toBeNull();
});
it('emits a new live transition even when a single loop retakes itself',()=>{
 const state=usePresentation.getState();state.goLive('same','same-slide');
 const first=usePresentation.getState().liveTransitionRevision;
 state.goLive('same','same-slide');
 expect(usePresentation.getState().liveTransitionRevision).toBe(first+1);
});
it('adopts pending data only on a new take and preserves notices on metadata resends',()=>{
 const events=new EventService([{eventKey:'current',titel:'Current',start_datum:'2026-10-04',start_uhrzeit:'10:00',ende_datum:'2026-10-04',ende_uhrzeit:'11:00',raum:'a',veranstaltungsort:'raum'}],new RoomService({a:{name:'Saal'}}));
 const controller=new PostProgramRoomNoticeController(new PostProgramRoomNoticeService(events));
 controller.prepare({linkedEventKey:'current'},new Date());
 const first=controller.outputForTake({id:'slide'},1);
 controller.prepare({linkedEventKey:'missing'},new Date());
 expect(controller.outputForTake({id:'slide',title:'changed'},1).postProgramRoomNotice).toEqual(first.postProgramRoomNotice);
 expect(controller.outputForTake({id:'slide'},2).postProgramRoomNotice).toBeUndefined();
});
