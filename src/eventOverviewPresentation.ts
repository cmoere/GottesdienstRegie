import {eventSlideItems,normalizeEventSlideSettings} from './dynamicEventSlide';
import {eventTextWidth,paginateReducedMotionEvents} from './eventPagination';
import {prepareEventScrollPlan} from './eventScroll';
export function prepareEventOverview(properties:Record<string,unknown>){
 const items=eventSlideItems(properties),{design}=normalizeEventSlideSettings(properties);
 if(design==='table'){
  const horizontalOverflow=Math.max(0,...items.map(item=>eventTextWidth(item.title,34,500)-694));
  const plan=prepareEventScrollPlan({contentHeight:items.length*136,viewportHeight:700,horizontalOverflow});
  if(plan.distance>0&&horizontalOverflow>0){
   // Every fully visible row must have time for its own horizontal title motion.
   const firstOverflow=Math.max(0,...items.slice(0,5).map(item=>eventTextWidth(item.title,34,500)-694));
   plan.startPauseMs=Math.max(5000,firstOverflow>0?firstOverflow/35*1000+10000:5000);
   plan.travelMs=Math.max(plan.travelMs,plan.distance/564*plan.endPauseMs);
   plan.minDurationMs=plan.startPauseMs+plan.travelMs+plan.endPauseMs;
  }
  return {items,plan,minDurationMs:Math.max(plan.minDurationMs,Math.ceil(items.length/5)*8000)};
 }
 const columns=design==='cards'||design==='poster'?2:1;
 const rows=Math.ceil(items.length/columns),rowHeight=150,gap=design==='cards'?67.2:22.08;
 const titleWidth=columns===2?590:1350;
 const horizontalOverflow=Math.max(0,...items.map(item=>eventTextWidth(item.title,45.12)-titleWidth));
 const plan=prepareEventScrollPlan({contentHeight:rows*rowHeight+Math.max(0,rows-1)*gap,viewportHeight:760,horizontalOverflow});
 return {items,plan,minDurationMs:Math.max(plan.minDurationMs,paginateReducedMotionEvents(items).length*8000)};
}
