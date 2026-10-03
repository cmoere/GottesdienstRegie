import {describe,it,expect,vi} from 'vitest';
import {EventService,type ChurchEvent} from './EventService';
import {RoomService} from './RoomService';
import {PostProgramRoomNoticeService,PostProgramRoomNoticeController} from './PostProgramRoomNoticeService';
const now=new Date(2026,9,4,10,0);
const event=(id:string,time:string,extra={})=>({eventKey:id,titel:id,start_datum:'2026-10-04',start_uhrzeit:time,ende_datum:'2026-10-04',ende_uhrzeit:'13:00',veranstaltungsort:'raum',raum:'saal',...extra} as ChurchEvent);
function setup(){const events=new EventService([event('current','09:00'),event('second','11:01'),event('first','10:30',{sichtbar:false}),event('tooLate','11:02'),event('cancelled','10:10',{cancelled:true})],new RoomService({saal:{name:'Saal',floor:'EG'}}));return{events,service:new PostProgramRoomNoticeService(events)}}
describe('v75 postprogram session',()=>{
 it('includes all chronological matches through exactly 61 minutes',()=>{
  const {service}=setup();expect(service.compute({linkedEventKey:'current'},now)).toMatchObject({type:'next-events',events:[{id:'first',room:'Saal · EG'},{id:'second'}]});
 });
 it('does not invent a leave-room instruction for an unknown current room',()=>{
  const {service}=setup();expect(service.compute({linkedEventKey:'missing'},now)).toBeNull();
 });
 it('holds color and visible state across updates and resets only on reentry',()=>{
  const {events,service}=setup(),random=vi.fn().mockReturnValueOnce(0).mockReturnValue(1),controller=new PostProgramRoomNoticeController(service,random);
  controller.enterPostProgram();controller.prepare({linkedEventKey:'current'},now);const first=controller.beginTransition();
  expect(first?.headerColor).toBe('#608F9A');expect(random).toHaveBeenCalledTimes(1);
  events.remove('first');events.remove('second');controller.prepare({linkedEventKey:'current'},now);
  expect(controller.current()).toEqual(first);expect(controller.beginTransition()).toMatchObject({headerColor:'#608F9A',notice:{type:'leave-room'}});
  controller.enterPostProgram();expect(random).toHaveBeenCalledTimes(1);
  controller.prepare({linkedEventKey:'missing'},now);expect(controller.beginTransition()).toBeNull();
  controller.leavePostProgram();controller.enterPostProgram();controller.prepare({linkedEventKey:'current'},now);
  expect(controller.beginTransition()?.headerColor).toBe('#699F3E');expect(random).toHaveBeenCalledTimes(2);
 });
});
