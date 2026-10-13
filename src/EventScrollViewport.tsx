import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {eventScrollOffset,type EventScrollPlan} from './eventScroll';
export function useEventPresentationClock(startedAtMs:number){
 const [elapsed,setElapsed]=useState(()=>Math.max(0,Date.now()-startedAtMs));
 const [reduced,setReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;const update=()=>setReduced(media?.matches??false);media?.addEventListener('change',update);let frame=0;const tick=()=>{setElapsed(Math.max(0,Date.now()-startedAtMs));frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);media?.removeEventListener('change',update)}},[startedAtMs]);
 return {elapsed,reduced};
}
export function EventScrollViewport({plan,elapsed,reduced=false,children,className=''}:{plan:EventScrollPlan;elapsed:number;reduced?:boolean;children:ReactNode;className?:string}){
 return <div className={`event-scroll-viewport ${className}`} data-scroll-distance={plan.distance}><div className="event-scroll-content" style={{transform:reduced?'none':`translateY(-${eventScrollOffset(plan,elapsed)/19.2}cqw)`} as CSSProperties}>{children}</div></div>;
}
