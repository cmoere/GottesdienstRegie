import {describe,expect,it} from 'vitest';
import {EventService} from './EventService';

const service=new EventService();
const base={eventKey:'-Oabc',titel:'Gottesdienst',start_datum:'2026-10-04',start_uhrzeit:'10:30',ende_datum:'2026-10-04',ende_uhrzeit:'12:00',ort:'Saal',sichtbar:true};

describe('EventService',()=>{
  it('keeps planned values and resolves delay, cancellation and replacement location',()=>{
    const event={...base,Verspaetungsanfangsdatum:'2026-10-04',Verspaetungsanfangsuhrzeit:'11:00',Verspaetungsenddatum:'2026-10-04',Verspaetungsenduhrzeit:'12:30',cancel:{enabled:true},ersatzort:'Gemeindehaus'};
    expect(service.getPlannedStart(event)?.toISOString()).toContain('2026-10-04T10:30');
    expect(service.getEffectiveStart(event)?.toISOString()).toContain('2026-10-04T11:00');
    expect(service.isCancelled(event)).toBe(true);
    expect(service.getEffectiveLocation(event)).toBe('Gemeindehaus');
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
});
