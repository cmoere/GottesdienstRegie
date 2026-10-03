import {describe,expect,it} from 'vitest';
import {EventService,type ChurchEvent} from './EventService';
import {RoomService} from './RoomService';
import {PostProgramRoomNoticeController,PostProgramRoomNoticeService,withPostProgramRoomNotice} from './PostProgramRoomNoticeService';

const now=new Date('2026-10-04T10:00:00.000Z');
const roomService=new RoomService([{roomId:'saal',raumname:'Gemeindesaal',etage:'EG'},{roomId:'neben',raumname:'Nebenraum',etage:'OG'}]);
const event=(eventKey:string,start:string,extra:Record<string,unknown>={}):ChurchEvent=>({eventKey,titel:eventKey,start_datum:'2026-10-04',start_uhrzeit:start,ende_datum:'2026-10-04',ende_uhrzeit:'13:00',veranstaltungsort:'raum',raum:'saal',...extra} as ChurchEvent);
const service=(events:ChurchEvent[])=>new PostProgramRoomNoticeService(new EventService(events,roomService));

describe('PostProgramRoomNoticeService',()=>{
  it('selects the earliest event in the same effective room within the inclusive 61 minute window',()=>{
    const result=service([event('current','09:00'),event('later','11:01'),event('next','10:30')]).compute({linkedEventKey:'current'},now);
    expect(result).toMatchObject({type:'next-event',eventId:'next',title:'next',time:'10:30 Uhr',room:'Gemeindesaal · EG',minutesUntil:30});
  });

  it('excludes now, after 61 minutes, current, cancelled and trashed candidates',()=>{
    const events=[event('current','09:00'),event('now','10:00'),event('after','11:02'),event('cancelled','10:20',{cancelled:true}),event('trash','10:25',{trash:true})];
    expect(service(events).compute({linkedEventKey:'current'},now)).toEqual({type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'});
  });

  it('uses effective replacement rooms for the current event and candidates',()=>{
    const current=event('current','09:00',{ersatzortType:'raum',ersatzort:'neben'}),movedIn=event('moved','10:45',{raum:'saal',ersatzortType:'raum',ersatzort:'neben'}),movedOut=event('out','10:20',{raum:'neben',ersatzortType:'raum',ersatzort:'saal'});
    expect(service([current,movedOut,movedIn]).compute({linkedEventKey:'current'},now)).toMatchObject({type:'next-event',eventId:'moved',room:'Nebenraum · OG'});
  });

  it('includes non-public room bookings and uses effective delayed start',()=>{
    const privateDelayed=event('internal','10:10',{sichtbar:false,Verspaetungsanfangsdatum:'2026-10-04',Verspaetungsanfangsuhrzeit:'10:40'});
    expect(service([event('current','09:00'),privateDelayed]).compute({linkedEventKey:'current'},now)).toMatchObject({eventId:'internal',time:'10:40 Uhr',minutesUntil:40});
  });

  it('falls back safely when the current room is unresolved without exposing its id',()=>{
    const result=service([event('current','09:00',{raum:'-secret'})]).compute({linkedEventKey:'current'},now);
    expect(JSON.stringify(result)).not.toContain('-secret');
    expect(result).toEqual({type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'});
  });

  it('keeps a visible notice stable until the next safe transition',()=>{
    const events=new EventService([event('current','09:00'),event('next','10:30')],roomService),domain=new PostProgramRoomNoticeService(events),controller=new PostProgramRoomNoticeController(domain);
    controller.prepare({linkedEventKey:'current'},now);
    expect(controller.beginTransition()).toMatchObject({type:'next-event',eventId:'next'});
    events.remove('next');
    controller.prepare({linkedEventKey:'current'},now);
    expect(controller.current()).toMatchObject({type:'next-event',eventId:'next'});
    expect(controller.beginTransition()).toEqual({type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'});
  });

  it('adds a notice to an output snapshot without mutating the source slide',()=>{
    const slide={id:'slide',body:'Normal'} as any,notice={type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'} as const,result=withPostProgramRoomNotice(slide,notice);
    expect(result).not.toBe(slide);
    expect(result.postProgramRoomNotice).toBe(notice);
    expect(slide).not.toHaveProperty('postProgramRoomNotice');
  });
});
