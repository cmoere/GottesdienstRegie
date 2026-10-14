import type {BannerOutputState} from './outputState';
import {bannerTextPages} from './announcementBannerSession';
export function AnnouncementBanner({state,nowMs,reducedMotion}:{state:BannerOutputState;nowMs:number;reducedMotion:boolean}){
  const text=state.items[0]?.text??'',elapsed=Math.max(0,nowMs-state.cycleStartedAtMs),pages=bannerTextPages(text);
  let page=0,left=elapsed;while(page<pages.length-1&&left>=Math.max(4000,pages[page].length*80)){left-=Math.max(4000,pages[page].length*80);page++}
  const x=1920-Math.max(0,elapsed-1000)/1000*60;
  return <div className="announcement-banner" role="marquee" aria-label="Gemeindemeldungen" data-reduced-motion={String(reducedMotion)} dir="auto">
    {text&&<span className={reducedMotion?'banner-static':'banner-moving'} style={reducedMotion?undefined:{transform:`translateX(${x/19.2}cqw)`}}>{reducedMotion?pages[page]:text}</span>}
  </div>;
}
