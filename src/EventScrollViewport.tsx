import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {eventScrollOffset,type EventScrollPlan} from './eventScroll';
export function useEventPresentationClock(startedAtMs:number,forceReduced=false){
 const [elapsed,setElapsed]=useState(()=>Math.max(0,Date.now()-startedAtMs));
 const [systemReduced,setSystemReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 const reduced=forceReduced||systemReduced;
 useEffect(()=>{const media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;const update=()=>setSystemReduced(media?.matches??false);media?.addEventListener('change',update);return()=>media?.removeEventListener('change',update)},[]);
 useEffect(()=>{const tick=()=>setElapsed(Math.max(0,Date.now()-startedAtMs));tick();if(!reduced)return;const timer=setInterval(tick,1000);return()=>clearInterval(timer)},[startedAtMs,reduced]);
 return {elapsed,reduced};
}
export function EventScrollViewport({plan,elapsed,reduced=false,children,className=''}:{plan:EventScrollPlan;elapsed:number;reduced?:boolean;children:ReactNode;className?:string}){
 const content=useRef<HTMLDivElement>(null),animation=useRef<Animation|null>(null),elapsedRef=useRef(elapsed);elapsedRef.current=elapsed;
 useLayoutEffect(()=>{
  const node=content.current;if(!node||reduced||plan.distance<=0||!node.animate)return;
  const duration=plan.minDurationMs,end=`translateY(-${plan.distance/19.2}cqw)`;
  const motion=node.animate([{transform:'translateY(0)',offset:0},{transform:'translateY(0)',offset:plan.startPauseMs/duration},{transform:end,offset:(plan.startPauseMs+plan.travelMs)/duration},{transform:end,offset:1}],{duration,easing:'linear',fill:'forwards'});
  motion.currentTime=elapsedRef.current;animation.current=motion;
  return()=>{motion.cancel();animation.current=null};
 },[plan.distance,plan.startPauseMs,plan.travelMs,plan.minDurationMs,reduced]);
 useLayoutEffect(()=>{if(animation.current)animation.current.currentTime=elapsed},[elapsed]);
 return <div className={`event-scroll-viewport ${className}`} data-scroll-distance={plan.distance}><div ref={content} className="event-scroll-content" style={{transform:reduced?'none':`translateY(-${eventScrollOffset(plan,elapsed)/19.2}cqw)`} as CSSProperties}>{children}</div></div>;
}
