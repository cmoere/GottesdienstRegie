import {useEffect,useState,type ReactNode} from 'react';
import type {BannerOutputState} from './outputState';
import {AnnouncementBanner} from './AnnouncementBanner';
import {AppClock} from './community/AppClock';
import './outputComposition.css';
import {ServiceCountdownBadge} from './ServiceCountdownBadge';
export function OutputComposition({children,banner,testOverlay,serviceCountdownAtMs,hideCountdown=false}:{children:ReactNode;banner:BannerOutputState|null;testOverlay?:ReactNode;serviceCountdownAtMs?:number;hideCountdown?:boolean}){
  const [now,setNow]=useState(()=>AppClock.now().getTime());
  useEffect(()=>{if(!banner?.reserved)return;let frame=0;const tick=()=>{setNow(AppClock.now().getTime());frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[banner?.reserved]);
  return <div className="output-composition" data-banner-position={banner?.reserved?banner.position:'none'}>
    <div className="output-content-area"><div className="output-content-fit">{children}</div></div>
    {banner?.reserved&&<div className="output-banner-layer"><AnnouncementBanner state={banner} nowMs={now} reducedMotion={banner.reducedMotion??false}/></div>}
    {!hideCountdown&&<ServiceCountdownBadge startsAtMs={serviceCountdownAtMs}/>}
    {testOverlay}
  </div>;
}
