import type {BannerOutputState} from './outputState';
import {useMemo} from 'react';
import {bannerTextPages,bannerRibbonText,bannerTextScale,bannerPhysicalWidth} from './announcementBannerSession';
export function AnnouncementBanner({state,nowMs,reducedMotion}:{state:BannerOutputState;nowMs:number;reducedMotion:boolean}){
  const text=useMemo(()=>bannerRibbonText(state.items),[state.items]),elapsed=Math.max(0,nowMs-state.cycleStartedAtMs),pages=useMemo(()=>bannerTextPages(text),[text]);
  const pageCycleMs=useMemo(()=>pages.reduce((sum,page)=>sum+Math.max(4000,page.length*80),0),[pages]);
  let page=0,left=elapsed%pageCycleMs;while(page<pages.length-1&&left>=Math.max(4000,pages[page].length*80)){left-=Math.max(4000,pages[page].length*80);page++}
  const scale=bannerTextScale(state.items),period=bannerPhysicalWidth(state.textWidth??text.length*24,state.items),offset=elapsed*.06%period,x=offset<.001||period-offset<.001?0:-offset,copies=Math.ceil(1920/period)+2;
  const units=useMemo(()=>Array.from({length:copies},(_,index)=><span key={index} data-banner-unit aria-hidden={index>0} style={{width:`${period/19.2}cqw`}}><span data-banner-text className="banner-unit-text" style={{transform:`scaleX(${scale})`}}>{text}</span></span>),[copies,period,text,scale]);
  return <div className="announcement-banner" role="marquee" aria-label="Gemeindemeldungen" data-condensed={String(scale<1)} data-reduced-motion={String(reducedMotion)} dir="auto">
    {text&&(reducedMotion?<span className="banner-static"><span style={{display:'inline-block',transform:`scaleX(${scale})`}}>{pages[page]}</span></span>:<span className="banner-moving" data-banner-track style={{transform:`translateX(${x/19.2}cqw)`}}>{units}</span>)}
  </div>;
}
