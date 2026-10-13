import {expect,it} from 'vitest';
import {prepareEventScrollPlan,eventScrollOffset} from './eventScroll';
it('extends the minimum hold until every overflowing row has passed and the final row has rested',()=>{
 const plan=prepareEventScrollPlan({contentHeight:2000,viewportHeight:800,horizontalOverflow:0});
 expect(plan.distance).toBe(1200);
 expect(plan.minDurationMs).toBe(70000);
 expect(eventScrollOffset(plan,4000)).toBe(0);
 expect(eventScrollOffset(plan,35000)).toBe(600);
 expect(eventScrollOffset(plan,70000)).toBe(1200);
});
it('reserves enough final-row time to read a long horizontally scrolling title',()=>{
 const plan=prepareEventScrollPlan({contentHeight:800,viewportHeight:800,horizontalOverflow:2100});
 expect(plan.distance).toBe(0);
 expect(plan.minDurationMs).toBe(75000);
});
