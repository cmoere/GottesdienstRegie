import {eventSlideItems,normalizeEventSlideSettings} from './dynamicEventSlide';
import {eventTextWidth,paginateReducedMotionEvents} from './eventPagination';
import {prepareEventScrollPlan} from './eventScroll';
import {EVENT_TABLE_TITLE_WIDTH,eventOverviewTitleWidth} from './autoSlideLayout';
export function prepareEventOverview(properties:Record<string,unknown>){
 const items=eventSlideItems(properties),{design}=normalizeEventSlideSettings(properties);
 if(design==='table'){
  const horizontalOverflow=Math.max(0,...items.map(item=>eventTextWidth(item.title,34,500)-EVENT_TABLE_TITLE_WIDTH));
  const plan=prepareEventScrollPlan({contentHeight:items.length*136,viewportHeight:700,horizontalOverflow});
  if(plan.distance>0&&horizontalOverflow>0){
   // Every fully visible row must have time for its own horizontal title motion.
   const firstOverflow=Math.max(0,...items.slice(0,5).map(item=>eventTextWidth(item.title,34,500)-EVENT_TABLE_TITLE_WIDTH));
   plan.startPauseMs=Math.max(5000,firstOverflow>0?firstOverflow/35*1000+10000:5000);
   plan.travelMs=Math.max(plan.travelMs,plan.distance/564*plan.endPauseMs);
   plan.minDurationMs=plan.startPauseMs+plan.travelMs+plan.endPauseMs;
  }
  return {items,plan,minDurationMs:Math.max(plan.minDurationMs,Math.ceil(items.length/5)*8000)};
 }
 const columns=design==='cards'||design==='poster'?2:1;
 const rows=Math.ceil(items.length/columns),rowHeight=150,gap=design==='cards'?67.2:22.08;
 const titleWidth=eventOverviewTitleWidth(design);
 const horizontalOverflow=Math.max(0,...items.map(item=>eventTextWidth(item.title,45.12,800)-titleWidth));
 const plan=prepareEventScrollPlan({contentHeight:rows*rowHeight+Math.max(0,rows-1)*gap,viewportHeight:760,horizontalOverflow});
 if(horizontalOverflow>0){
  const visibleRows=Math.floor((760+gap)/(rowHeight+gap));
  const firstOverflow=Math.max(0,...items.slice(0,visibleRows*columns).map(item=>eventTextWidth(item.title,45.12,800)-titleWidth));
  plan.startPauseMs=Math.max(5000,firstOverflow>0?firstOverflow/35*1000+10000:5000);
  if(plan.distance>0)plan.travelMs=Math.max(plan.travelMs,plan.distance/(760-rowHeight)*plan.endPauseMs);
  plan.minDurationMs=plan.startPauseMs+plan.travelMs+plan.endPauseMs;
 }
 const titleStartsAfterMs=items.map((_,index)=>{const row=Math.floor(index/columns),enterDistance=Math.max(0,(row+1)*rowHeight+row*gap-760);return enterDistance>0&&plan.distance>0?plan.startPauseMs+enterDistance/plan.distance*plan.travelMs:0});
 return {items,plan,titleWidth,titleStartsAfterMs,minDurationMs:Math.max(plan.minDurationMs,paginateReducedMotionEvents(items,titleWidth).length*8000)};
}
