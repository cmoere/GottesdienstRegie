import {describe,expect,it} from 'vitest';
import {eventSlideItems,getLatestPublicEvents,normalizeEventSlideSettings,setLatestPublicEvents} from './dynamicEventSlide';

describe('dynamic event slide',()=>{
  it('shows several normalized public events with start and end time',()=>expect(eventSlideItems({eventItemsJson:JSON.stringify([{title:'Gottesdienst',effectiveStart:'2026-10-04T10:30:00+02:00',effectiveEnd:'2026-10-04T12:00:00+02:00',effectiveLocation:'Kirchsaal'},{title:'Gebetsabend',effectiveStart:'2026-10-06T19:30:00+02:00',effectiveEnd:'2026-10-06T20:15:00+02:00',effectiveLocation:'Gemeindesaal'}])})).toEqual([{title:'Gottesdienst',details:'04.10.2026 · 10:30–12:00 · Kirchsaal',coverUrl:''},{title:'Gebetsabend',details:'06.10.2026 · 19:30–20:15 · Gemeindesaal',coverUrl:''}]));
  it('retains the latest event list for renderers mounted after the realtime update',()=>{setLatestPublicEvents([{title:'Abendgottesdienst',effectiveStart:'2026-10-04T18:00:00+02:00'}]);expect(getLatestPublicEvents()).toHaveLength(1)});
  it('normalizes four supported designs and the event limit',()=>{expect(normalizeEventSlideSettings({eventDesign:'timeline',eventLimit:6})).toEqual({design:'timeline',limit:6});expect(normalizeEventSlideSettings({eventDesign:'unknown',eventLimit:99})).toEqual({design:'cards',limit:8})});
});
