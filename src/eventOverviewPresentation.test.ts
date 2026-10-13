import {describe,it,expect} from 'vitest';
import {prepareEventOverview} from './eventOverviewPresentation';
describe('event overview scrolling',()=>{
 it('keeps the first long title visible until its complete horizontal reading finishes',()=>{
  const title='A'.repeat(100);
  const prepared=prepareEventOverview({eventLimit:8,eventItemsJson:JSON.stringify(Array.from({length:8},(_,i)=>({title:i===0?title:`Termin ${i}`,effectiveStart:'2026-10-13T12:00:00Z'})))});
  expect(prepared.plan.startPauseMs).toBeGreaterThan(87000);
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
  expect(prepared.minDurationMs).toBeGreaterThan(92300);
  expect(prepared.minDurationMs).toBeLessThan(92400);
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
