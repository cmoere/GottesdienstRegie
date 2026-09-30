import {describe,expect,it} from 'vitest';
import {eventSlideContent,getLatestPublicEvent,setLatestPublicEvent} from './dynamicEventSlide';

describe('dynamic event slide',()=>{
  it('shows normalized public event data instead of an empty placeholder',()=>{
    expect(eventSlideContent({eventTitle:'Gottesdienst',eventStart:'2026-10-04T10:30:00+02:00',eventLocation:'Kirchsaal'})).toEqual({title:'Gottesdienst',details:'04.10.2026 · 10:30 · Kirchsaal'});
  });
  it('falls back to a useful empty state',()=>expect(eventSlideContent({})).toEqual({title:'Keine kommenden Veranstaltungen',details:''}));
  it('retains the latest event for renderers mounted after the realtime update',()=>{
    setLatestPublicEvent({title:'Abendgottesdienst',effectiveStart:'2026-10-04T18:00:00+02:00'});
    expect(getLatestPublicEvent()).toMatchObject({title:'Abendgottesdienst'});
  });
});
