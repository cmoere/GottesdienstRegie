import {describe,expect,it} from 'vitest';
import {eventSlideItems,getLatestPublicEvents,normalizeEventSlideSettings,setLatestPublicEvents} from './dynamicEventSlide';
import * as eventDisplay from './dynamicEventSlide';

describe('dynamic event slide',()=>{
  it('formats visible operator dates with the actual weekday and no technical invalid value',()=>{
    const format=(eventDisplay as unknown as {formatEventDate?:(value:string)=>string}).formatEventDate;
    expect(format?.('2020-01-01')).toBe('Mi., 01.01.2020');
    expect(format?.('2020-01-05T23:30:00Z')).toBe('Mo., 06.01.2020');
    expect(format?.('not-a-date')).toBe('');
  });
  it('shows several normalized public events with start and end time',()=>expect(eventSlideItems({eventItemsJson:JSON.stringify([{title:'Gottesdienst',effectiveStart:'2026-10-04T10:30:00+02:00',effectiveEnd:'2026-10-04T12:00:00+02:00',effectiveLocation:'Kirchsaal'},{title:'Gebetsabend',effectiveStart:'2026-10-06T19:30:00+02:00',effectiveEnd:'2026-10-06T20:15:00+02:00',effectiveLocation:'Gemeindesaal'}])})).toMatchObject([{title:'Gottesdienst',details:'So., 04.10.2026 · 10:30–12:00 · Kirchsaal',coverUrl:''},{title:'Gebetsabend',details:'Di., 06.10.2026 · 19:30–20:15 · Gemeindesaal',coverUrl:''}]));
  it('retains the latest event list for renderers mounted after the realtime update',()=>{setLatestPublicEvents([{title:'Abendgottesdienst',effectiveStart:'2026-10-04T18:00:00+02:00'}]);expect(getLatestPublicEvents()).toHaveLength(1)});
  it('prefers the table for unset or invalid designs while retaining saved layouts',()=>{expect(normalizeEventSlideSettings({eventDesign:'timeline',eventLimit:6})).toEqual({design:'timeline',limit:6});expect(normalizeEventSlideSettings({eventDesign:'unknown',eventLimit:99})).toEqual({design:'table',limit:50});expect(normalizeEventSlideSettings({eventDesign:'cards'}).design).toBe('cards');expect(normalizeEventSlideSettings({}).design).toBe('table')});
  it('shows larger table lists while retaining legacy limits',()=>{
    expect(eventSlideItems({eventLimit:20,eventItemsJson:JSON.stringify(Array.from({length:20},(_,index)=>({title:`Termin ${index}`,effectiveStart:'2020-01-01T18:00:00+01:00'})))})).toHaveLength(20);
    expect(normalizeEventSlideSettings({eventDesign:'poster',eventLimit:20}).limit).toBe(8);
  });
  it('prepares separate table columns with the real weekday and a full overnight range',()=>{
    const [event]=eventSlideItems({eventItemsJson:JSON.stringify([{title:'Nachtgebet',effectiveStart:'2020-01-01T22:30:00+01:00',effectiveEnd:'2020-01-02T01:15:00+01:00',effectiveLocation:'Saal'}])});
    expect(event).toMatchObject({date:'Mi., 01.01.2020 – Do., 02.01.2020',time:'22:30–01:15',location:'Saal'});
  });
  it('preserves the full effective end in legacy fallback properties',()=>{
    expect(eventSlideItems({eventTitle:'Gebet',eventStart:'2020-01-01T18:00:00+01:00',eventEnd:'2020-01-01T19:00:00+01:00'})[0]).toMatchObject({date:'Mi., 01.01.2020',time:'18:00–19:00'});
  });
});
