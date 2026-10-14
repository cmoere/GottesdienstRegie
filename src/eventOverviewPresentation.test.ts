import {describe,it,expect} from 'vitest';
import {prepareEventOverview} from './eventOverviewPresentation';
describe('event overview scrolling',()=>{
 it('gives every non-table title a full reading pass before its row leaves',()=>{
  for(const eventDesign of ['timeline','minimal','cards','poster']){
   const prepared=prepareEventOverview({eventDesign,eventLimit:12,eventItemsJson:JSON.stringify(Array.from({length:12},()=>({title:'A'.repeat(100),effectiveStart:'2026-10-13T12:00:00Z'})))});
   expect(prepared.plan.startPauseMs).toBeGreaterThan(80000);
   if(prepared.plan.distance>0)expect(prepared.titleStartsAfterMs?.at(-1)).toBeGreaterThan(prepared.plan.startPauseMs);
   expect((prepared.titleStartsAfterMs?.at(-1)??Infinity)+prepared.plan.endPauseMs).toBeLessThanOrEqual(prepared.minDurationMs+1);
  }
 });
 it('does not add title travel for text fitting the widened table column',()=>{
  const prepared=prepareEventOverview({eventItemsJson:JSON.stringify([{title:'A'.repeat(22),effectiveStart:'2026-10-13T12:00:00Z'}])});
  // jsdom estimates 22 × 34 = 748px: fits the 759.52px title column.
  expect(prepared.plan.endPauseMs).toBe(5000);
 });
 it('keeps the first long title visible until its complete horizontal reading finishes',()=>{
  const title='A'.repeat(100);
  const prepared=prepareEventOverview({eventLimit:8,eventItemsJson:JSON.stringify(Array.from({length:8},(_,i)=>({title:i===0?title:`Termin ${i}`,effectiveStart:'2026-10-13T12:00:00Z'})))});
  expect(prepared.plan.startPauseMs).toBeCloseTo(85442.286,2);
  const speed=prepared.plan.distance/prepared.plan.travelMs;
  expect(564/speed+0.001).toBeGreaterThanOrEqual(prepared.plan.endPauseMs);
 });
 it('holds the default table long enough to read all overflowing rows',()=>{
  const prepared=prepareEventOverview({eventLimit:8,eventItemsJson:JSON.stringify(Array.from({length:8},(_,i)=>({title:`Termin ${i+1}`,effectiveStart:'2026-10-13T12:00:00Z'})))});
  expect(prepared.plan.distance).toBe(388);
  expect(prepared.minDurationMs).toBeGreaterThanOrEqual(29400);
 });
 it('adds reading time for long single-line table titles',()=>{
  const prepared=prepareEventOverview({eventItemsJson:JSON.stringify([{title:'A'.repeat(100),effectiveStart:'2026-10-13T12:00:00Z'}])});
  expect(prepared.minDurationMs).toBeCloseTo(90442.286,2);
 });
 it('extends the timer until all overflowing rows have crossed the viewport',()=>{
  const prepared=prepareEventOverview({eventDesign:'timeline',eventLimit:8,eventItemsJson:JSON.stringify(Array.from({length:8},(_,i)=>({title:`Veranstaltung ${i+1}`,effectiveStart:'2026-10-13T12:00:00Z'})))});
  expect(prepared.items).toHaveLength(8);
  expect(prepared.plan.distance).toBeGreaterThan(400);
  expect(prepared.minDurationMs).toBeGreaterThan(30000);
  expect(prepared.minDurationMs).toBeGreaterThanOrEqual(prepared.plan.startPauseMs+prepared.plan.travelMs+prepared.plan.endPauseMs);
 });
 it('leaves fitting rows static',()=>{
  const prepared=prepareEventOverview({eventDesign:'cards',eventItemsJson:JSON.stringify([{title:'Gebet',effectiveStart:'2026-10-13T12:00:00Z'}])});
  expect(prepared.plan.distance).toBe(0);
 });
});
