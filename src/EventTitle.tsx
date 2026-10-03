import {useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
export function titleNeedsScroll(height:number,width:number,lineHeight:number,availableWidth:number){return availableWidth>0&&(height>lineHeight*2+1||width>availableWidth+1)}
export function EventTitle({title}:{title:string}){
 const root=useRef<HTMLDivElement>(null),probe=useRef<HTMLElement>(null),visible=useRef<HTMLElement>(null);
 const [motion,setMotion]=useState({scroll:false,distance:0});
 useLayoutEffect(()=>{
  let disposed=false;const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const measure=()=>{if(disposed||!root.current||!probe.current)return;const lineHeight=parseFloat(getComputedStyle(probe.current).lineHeight)||24,scroll=!preference?.matches&&titleNeedsScroll(probe.current.scrollHeight,probe.current.scrollWidth,lineHeight,root.current.clientWidth);const distance=scroll?Math.max(0,(visible.current?.scrollWidth??0)-root.current.clientWidth):0;setMotion(old=>old.scroll===scroll&&old.distance===distance?old:{scroll,distance})};
  measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);if(root.current)observer?.observe(root.current);
  void document.fonts?.ready.then(measure);document.fonts?.addEventListener('loadingdone',measure);preference?.addEventListener('change',measure);window.addEventListener('resize',measure);
  return()=>{disposed=true;observer?.disconnect();document.fonts?.removeEventListener('loadingdone',measure);preference?.removeEventListener('change',measure);window.removeEventListener('resize',measure)};
 },[title,motion.scroll]);
 return <div ref={root} className="event-title-container" data-scrolling={motion.scroll} style={{'--title-travel':`-${motion.distance}px`,'--title-duration':`${Math.max(12,motion.distance/28+6)}s`} as CSSProperties}>
  <strong ref={probe} className="event-title-probe" aria-hidden="true">{title}</strong>
  <strong ref={visible} className="event-title-text">{title}</strong>
 </div>;
}
