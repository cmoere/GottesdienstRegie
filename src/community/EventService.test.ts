import {describe,expect,it} from 'vitest';
import {EventService} from './EventService';
import {RoomService} from './RoomService';

const service=new EventService();
const base={eventKey:'-Oabc',titel:'Gottesdienst',start_datum:'2026-10-04',start_uhrzeit:'10:30',ende_datum:'2026-10-04',ende_uhrzeit:'12:00',ort:'Saal',sichtbar:true};

describe('EventService',()=>{
  it('uses partial effective times without overwriting plan values',()=>{
    const event={...base,Verspaetungsanfangsuhrzeit:'11:08',delay:{end:{time:'12:38'}}};
    expect(service.getEffectiveStart(event)?.getHours()).toBe(11);expect(service.getEffectiveEnd(event)?.getMinutes()).toBe(38);
    expect(event.start_uhrzeit).toBe('10:30');expect(event.ende_uhrzeit).toBe('12:00');
  });
  it('resolves untyped legacy IDs, suppresses unknown IDs and preserves explicit external places',()=>{
    const svc=new EventService([],new RoomService({'-known':{raumname:'Gebetsraum'}}));
    expect(svc.toPublicEvent({...base,ort:'-known'}).effectiveLocation).toBe('Gebetsraum');
    expect(svc.toPublicEvent({...base,ort:'-ONH9VAK3XKiqMUPT5'}).effectiveLocation).not.toContain('-ONH');
    expect(svc.getPlannedLocation({...base,veranstaltungsort:'ort',ort:'-known'})).toMatchObject({type:'external',name:'-known'});
  });
  it('keeps planned values and resolves delay, cancellation and replacement location',()=>{
    const event={...base,Verspaetungsanfangsdatum:'2026-10-04',Verspaetungsanfangsuhrzeit:'11:00',Verspaetungsenddatum:'2026-10-04',Verspaetungsenduhrzeit:'12:30',cancel:{enabled:true},ersatzort:'Gemeindehaus'};
    expect(service.getPlannedStart(event)?.getHours()).toBe(10);
    expect(service.getPlannedStart(event)?.getMinutes()).toBe(30);
    expect(service.getEffectiveStart(event)?.getHours()).toBe(11);
    expect(service.isCancelled(event)).toBe(true);
    expect(service.getEffectiveLocation(event)).toMatchObject({type:'external',name:'Gemeindehaus'});
    expect(event.start_uhrzeit).toBe('10:30');
  });

  it('projects only public fields and preserves the child key',()=>{
    const result=service.toPublicEvent({...base,internalComment:'secret',prediger:'M. Muster',predigtTitel:'Hoffnung'} as any);
    expect(result).toMatchObject({id:'-Oabc',title:'Gottesdienst',plannedLocation:'Saal',preacher:'M. Muster',sermonTitle:'Hoffnung'});
    expect(result).not.toHaveProperty('internalComment');
  });

  it('sorts public upcoming events by effective time and ignores trash and malformed dates',()=>{
    const events=[{...base,eventKey:'late',Verspaetungsanfangsuhrzeit:'12:00'},{...base,eventKey:'first',start_uhrzeit:'09:00'},{...base,eventKey:'trash',trash:true},{...base,eventKey:'bad',start_datum:'n/a'}];
    expect(service.getUpcomingEvents(events,new Date('2026-10-04T08:00:00')).map(event=>event.eventKey)).toEqual(['first','late']);
  });

  it('resolves internal, hybrid and replacement room ids without exposing raw ids',()=>{
    const rooms=new RoomService([{roomId:'saal',raumname:'Gemeindesaal',etage:'EG',gebaeude:'Gemeindezentrum'},{roomId:'gebet',raumname:'Gebetsraum',etage:'OG 1'}]);
    const roomService=new EventService([],rooms);
    expect(roomService.toPublicEvent({...base,veranstaltungsort:'raum',raum:'saal',ort:'saal',zusatzraeume:['gebet']} as any)).toMatchObject({effectiveLocation:'Gemeindesaal · EG · Gemeindezentrum',additionalLocations:[{roomId:'gebet',name:'Gebetsraum'}]});
    expect(roomService.toPublicEvent({...base,veranstaltungsort:'hybrid',hybrid_vorort_typ:'raum',raum:'saal'} as any).effectiveLocation).toBe('Gemeindesaal · EG · Gemeindezentrum');
    expect(roomService.toPublicEvent({...base,veranstaltungsort:'raum',raum:'gebet',ersatzortType:'raum',ersatzort:'saal'} as any)).toMatchObject({plannedLocation:'Gebetsraum · OG 1',effectiveLocation:'Gemeindesaal · EG · Gemeindezentrum',locationChanged:true});
    expect(roomService.getPlannedLocation({...base,veranstaltungsort:'raum',raum:'saal'} as any)).toMatchObject({type:'room',roomId:'saal',name:'Gemeindesaal'});
    expect(roomService.getEffectiveLocation({...base,veranstaltungsort:'raum',raum:'gebet',ersatzortType:'raum',ersatzort:'saal'} as any)).toMatchObject({type:'room',roomId:'saal',name:'Gemeindesaal'});
  });

  it('keeps a central store keyed by eventKey',()=>{
    const store=new EventService([{...base,eventKey:'one'} as any]);
    store.upsert({...base,eventKey:'two',titel:'Zwei'} as any);
    store.upsert({...base,eventKey:'one',titel:'Neu'} as any);
    expect(store.getAllEvents().map(event=>event.eventKey)).toEqual(['one','two']);
    expect(store.getByKey('one')?.titel).toBe('Neu');
    store.remove('one');
    expect(store.getByKey('one')).toBeNull();
  });

  it('recognizes trash variants and falls back from invalid delay objects',()=>{
    expect(service.isTrashed({...base,trashAt:'2026-10-04'} as any)).toBe(true);
    expect(service.getEffectiveStart({...base,delay:{start:{date:'invalid',time:'25:00'}}} as any)?.getHours()).toBe(10);
    expect(service.getEffectiveStart({...base,delay:{start:{date:'2026-10-04',time:'10:45'}}} as any)?.getMinutes()).toBe(45);
  });

  it('uses legacy ort only for room locations and never exposes an unresolved room id',()=>{
    const roomService=new EventService([],new RoomService([{roomId:'-dieJsO8X',raumname:'Eltern-Kind-Raum',etage:'EG'}]));
    expect(roomService.getEffectiveLocation({...base,veranstaltungsort:'raum',raum:'',ort:'-dieJsO8X'} as any)).toMatchObject({type:'room',roomId:'-dieJsO8X',name:'Eltern-Kind-Raum'});
    expect(roomService.toPublicEvent({...base,veranstaltungsort:'raum',raum:'missing-id'} as any).effectiveLocation).toBe('Raum');
    expect(roomService.getEffectiveLocation({...base,veranstaltungsort:'ort',ort:'Außengelände'} as any)).toMatchObject({type:'external',name:'Außengelände'});
  });
});
