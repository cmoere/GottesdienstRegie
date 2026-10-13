import type {PostProgramEventRow} from './PostProgramRoomNoticeService';
export type TestEventSituation='normal'|'delayed'|'cancelled'|'room-changed'|'mixed';
export type TestEventScenario='automatic'|'leave-room'|'next-events'|`next-events:${number}:${TestEventSituation}`;
export const testSituations:TestEventSituation[]=['normal','delayed','cancelled','room-changed','mixed'];
export function decodeTestScenario(value:unknown){
 const parts=String(value??'automatic').split(':');
 const scenario=parts[0]==='leave-room'?'leave-room':parts[0]==='next-events'?'next-events':'automatic';
 const count=Math.min(12,Math.max(1,Math.trunc(Number(parts[1]))||1));
 const situation=testSituations.includes(parts[2] as TestEventSituation)?parts[2] as TestEventSituation:'normal';
 return{scenario,count,situation};
}
export function encodeTestScenario(scenario:string,count:number,situation:TestEventSituation):TestEventScenario{
 if(scenario!=='next-events')return scenario==='leave-room'?'leave-room':'automatic';
 return count===1&&situation==='normal'?'next-events':`next-events:${Math.min(12,Math.max(1,Math.trunc(count)||1))}:${situation}`;
}
export function createTestEvents(scenario:TestEventScenario,now:Date):PostProgramEventRow[]{
 const {count,situation}=decodeTestScenario(scenario);
 return Array.from({length:count},(_,index)=>{
  const status=situation==='mixed'?(['delayed','cancelled','room-changed'] as const)[index%3]:situation;
  const planned=now.getTime()+(10+index*3)*60_000,start=planned+(status==='delayed'?5*60_000:0);
  return{id:`test-example-${index}`,title:count===1?'Testveranstaltung (Beispieldaten)':`Testveranstaltung ${index+1} (Beispieldaten)`,start:new Date(start).toISOString(),end:new Date(start+30*60_000).toISOString(),room:status==='room-changed'?'Neuer Testraum':'Testraum',status,plannedStart:new Date(planned).toISOString()};
 });
}
