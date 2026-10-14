import {useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
export function titleNeedsScroll(height:number,width:number,lineHeight:number,availableWidth:number){return availableWidth>0&&(height>lineHeight*2+1||width>availableWidth+1)}
export function EventTitle({title,elapsed=0,startsAfterMs=0,designWidth=1350}:{title:string;elapsed?:number;startsAfterMs?:number;designWidth?:number}){
 const root=useRef<HTMLDivElement>(null),probe=useRef<HTMLElement>(null),visible=useRef<HTMLElement>(null);
 const animation=useRef<Animation|undefined>(undefined),clock=useRef(elapsed);clock.current=elapsed;
 const [motion,setMotion]=useState({scroll:false,distance:0});
 useLayoutEffect(()=>{
  let disposed=false;const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const measure=()=>{if(disposed||!root.current||!probe.current)return;const lineHeight=parseFloat(getComputedStyle(probe.current).lineHeight)||24,scroll=!preference?.matches&&titleNeedsScroll(probe.current.scrollHeight,probe.current.scrollWidth,lineHeight,root.current.clientWidth);const distance=scroll?Math.max(0,(visible.current?.scrollWidth??0)-root.current.clientWidth):0;setMotion(old=>old.scroll===scroll&&old.distance===distance?old:{scroll,distance})};
  measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);if(root.current)observer?.observe(root.current);
  void document.fonts?.ready.then(measure);document.fonts?.addEventListener('loadingdone',measure);preference?.addEventListener('change',measure);window.addEventListener('resize',measure);
  return()=>{disposed=true;observer?.disconnect();document.fonts?.removeEventListener('loadingdone',measure);preference?.removeEventListener('change',measure);window.removeEventListener('resize',measure)};
 },[title,motion.scroll]);
 useLayoutEffect(()=>{
  const node=visible.current,container=root.current;
  if(!motion.scroll||motion.distance<=1||!node?.animate||!container)return;
  const scale=container.clientWidth/designWidth||1,travelMs=motion.distance/scale/35*1000,duration=travelMs+10000;
  const active=node.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:5000/duration},{transform:`translateX(-${motion.distance}px)`,offset:(5000+travelMs)/duration},{transform:`translateX(-${motion.distance}px)`,offset:1}],{duration,delay:startsAfterMs,easing:'linear',fill:'forwards'});
  active.currentTime=clock.current;animation.current=active;
  return()=>{active.cancel();animation.current=undefined};
 },[motion.scroll,motion.distance,startsAfterMs,designWidth]);
 useLayoutEffect(()=>{if(animation.current)animation.current.currentTime=elapsed},[elapsed]);
 return <div ref={root} className="event-title-container" data-scrolling={motion.scroll} style={{'--title-travel':`-${motion.distance}px`,'--title-duration':`${Math.max(12,motion.distance/28+6)}s`} as CSSProperties}>
  <strong ref={probe} className="event-title-probe" aria-hidden="true">{title}</strong>
  <strong ref={visible} className="event-title-text">{title}</strong>
 </div>;
}
