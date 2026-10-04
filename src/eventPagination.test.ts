import {it,expect} from 'vitest';
import {paginatePostEvents,paginateReducedMotionEvents} from './eventPagination';
it('keeps long post rows within page capacity without losing text',()=>{
 const events=Array.from({length:6},(_,i)=>({id:String(i),title:'Sehr lange Veranstaltung '.repeat(12),room:'Großer Gemeindesaal · EG',start:'2026-10-04T10:00:00Z'}));
 const pages=paginatePostEvents(events);
 expect(pages.length).toBeGreaterThan(1);
 for(const page of pages)expect(page.reduce((sum,row)=>sum+row.lines,0)).toBeLessThanOrEqual(10);
 for(const event of events)expect(pages.flat().filter(row=>row.id===event.id).map(row=>row.title.replace(/\n/g,'')).join('')).toBe(event.title);
});
it('paginates reduced motion titles fully instead of clipping or scaling them',()=>{
 const title='Überlange Veranstaltung '.repeat(30);
 const pages=paginateReducedMotionEvents([{title,details:'Heute · Saal'}]);
 expect(pages.length).toBeGreaterThan(1);
 expect(pages.flat().map(row=>row.title.replace(/\n/g,'')).join('')).toBe(title);
 expect(pages.flat().every(row=>row.title.split('\n').length<=4)).toBe(true);
});
