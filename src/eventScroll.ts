export type EventScrollPlan={distance:number;startPauseMs:number;travelMs:number;endPauseMs:number;minDurationMs:number};
/** All distances are in the common 1920 × 1080 presentation coordinates. */
export function prepareEventScrollPlan({contentHeight,viewportHeight,horizontalOverflow=0}:{contentHeight:number;viewportHeight:number;horizontalOverflow?:number}):EventScrollPlan{
 const distance=Math.max(0,contentHeight-viewportHeight),startPauseMs=5000,travelMs=distance/20*1000;
 const endPauseMs=horizontalOverflow>0?horizontalOverflow/35*1000+10000:5000;
 return {distance,startPauseMs,travelMs,endPauseMs,minDurationMs:startPauseMs+travelMs+endPauseMs};
}
export function eventScrollOffset(plan:EventScrollPlan,elapsedMs:number){return plan.travelMs?plan.distance*Math.max(0,Math.min(1,(elapsedMs-plan.startPauseMs)/plan.travelMs)):0}
