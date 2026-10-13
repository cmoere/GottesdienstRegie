import {describe,it,expect} from 'vitest';
import {prepareEventOverview} from './eventOverviewPresentation';
describe('event overview scrolling',()=>{
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
