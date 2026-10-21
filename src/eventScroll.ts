export type EventScrollPlan={distance:number;startPauseMs:number;travelMs:number;endPauseMs:number;minDurationMs:number;roundTrip?:boolean};
/** All distances are in the common 1920 × 1080 presentation coordinates. */
export function prepareEventScrollPlan({contentHeight,viewportHeight,horizontalOverflow=0,roundTrip=false}:{contentHeight:number;viewportHeight:number;horizontalOverflow?:number;roundTrip?:boolean}):EventScrollPlan{
 const distance=Math.max(0,contentHeight-viewportHeight),startPauseMs=5000,travelMs=distance/20*1000;
 const endPauseMs=horizontalOverflow>0?horizontalOverflow/35*1000+10000:5000;
 return {distance,startPauseMs,travelMs,endPauseMs,minDurationMs:startPauseMs+travelMs+endPauseMs+(roundTrip?travelMs:0),...(roundTrip?{roundTrip:true}:{})};
}
export function eventScrollOffset(plan:EventScrollPlan,elapsedMs:number){
 if(!plan.travelMs)return 0;
 const elapsed=plan.roundTrip?Math.max(0,elapsedMs)%plan.minDurationMs:elapsedMs;
 const returnStart=plan.startPauseMs+plan.travelMs+plan.endPauseMs;
 if(plan.roundTrip&&elapsed>=returnStart)return plan.distance*Math.max(0,1-(elapsed-returnStart)/plan.travelMs);
 return plan.distance*Math.max(0,Math.min(1,(elapsed-plan.startPauseMs)/plan.travelMs));
}
