import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { SlideRenderer } from './SlideRenderer';
import { defaultTransition, type DisplayRole, type ServiceItem, type Slide, type SlideTransition } from './store';

export const transitionLabels={cut:'Kein Übergang',fade:'Überblenden',crossfade:'Kreuzblende',dissolve:'Auflösen',slide:'Schieben',wipe:'Wischen',zoom:'Zoomen',blur:'Unschärfe',circle:'Kreis aufdecken',flip:'Drehen',push:'Schieben mit Verdrängen'} as const;

export function itemTransitionDefault(item?:ServiceItem,presentationDefault:SlideTransition=defaultTransition):SlideTransition{
  if(item?.transitionDefault)return item.transitionDefault;
  if(item?.type==='song'||item?.type==='video'||item?.type==='audio')return{...defaultTransition,type:'cut',durationMs:100};
  if(item?.type==='image'||item?.type==='announcement'||item?.sectionId==='pre'||item?.sectionId==='post')return{...defaultTransition,type:'crossfade'};
  return presentationDefault;
}

export function resolveTransition(slide:Slide,item?:ServiceItem,role:DisplayRole='main',presentationDefault:SlideTransition=defaultTransition):SlideTransition{
  if(role==='stage')return{...defaultTransition,type:'cut',durationMs:100};
  return slide.transitionOverride??itemTransitionDefault(item,presentationDefault);
}

const opposite={left:'right',right:'left',up:'down',down:'up'} as const;
const easing={standard:'cubic-bezier(.2,0,0,1)',linear:'linear','ease-in':'ease-in','ease-out':'ease-out','ease-in-out':'ease-in-out'} as const;

export function TransitionStage({slide,transition,role='main',previewToken=0}:{slide:Slide;transition:SlideTransition;role?:DisplayRole;previewToken?:number}){
  const [shown,setShown]=useState(slide),[leaving,setLeaving]=useState<Slide|null>(null),[active,setActive]=useState(false),timer=useRef<number|undefined>(undefined),previous=useRef(slide);
  const effective=role==='stage'?{...transition,type:'cut' as const,durationMs:100}:transition;
  useEffect(()=>{
    const old=previous.current,next=slide;previous.current=next;window.clearTimeout(timer.current);
    if(effective.type==='cut'||old.id===next.id&&previewToken===0){setLeaving(null);setShown(next);setActive(false);return}
    setLeaving(old);setShown(next);setActive(false);const frame=requestAnimationFrame(()=>requestAnimationFrame(()=>setActive(true)));
    timer.current=window.setTimeout(()=>{setLeaving(null);setActive(false)},effective.durationMs+80);
    return()=>{cancelAnimationFrame(frame);window.clearTimeout(timer.current)};
  },[slide.id,previewToken,effective.type,effective.durationMs]);
  const backwards=leaving?.itemId===shown.itemId&&shown.order<leaving.order&&effective.reverseOnPrevious;
  const direction=backwards?opposite[effective.direction]:effective.direction;
  const style=useMemo(()=>({'--transition-duration':`${effective.durationMs}ms`,'--transition-easing':easing[effective.easing]}) as CSSProperties,[effective.durationMs,effective.easing]);
  return <div className={`transition-stage transition-${effective.type} direction-${direction} ${leaving?'transitioning':''} ${active?'active':''}`} style={style}>
    {leaving&&<div className="transition-layer leaving"><SlideRenderer slide={leaving} mode={role==='operator'?'preview':'live'}/></div>}
    <div className="transition-layer entering"><SlideRenderer slide={shown} mode={role==='operator'?'preview':'live'}/></div>
  </div>;
}
