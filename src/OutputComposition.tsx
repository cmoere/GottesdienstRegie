import {useEffect,useState,type ReactNode} from 'react';
import type {BannerOutputState} from './outputState';
import {AnnouncementBanner} from './AnnouncementBanner';
import {LiveAnnotationOverlay,useLiveAnnotations} from './LiveAnnotations';
import {AppClock} from './community/AppClock';
import './outputComposition.css';
import {SectionInfoStrip} from './SectionInfoStrip';
import type {SectionInfoSnapshot} from '../shared/sectionInfoStrip';
import {ServiceCountdownBadge} from './ServiceCountdownBadge';
import {AnnouncementIndicator,useSpeechStatus} from './announcements/AnnouncementIndicator';
import type{WeatherWarningState}from'../shared/weatherWarnings';import{useCurrentWeatherWarning,WeatherWarningBanner}from'./weatherWarnings/WeatherWarningBanner';
export function OutputComposition({children,banner,testOverlay,serviceCountdownAtMs,hideCountdown=false,weatherWarnings,announcementActive,annotations,sectionInfo}:{sectionInfo?:SectionInfoSnapshot;children:ReactNode;banner:BannerOutputState|null;testOverlay?:ReactNode;serviceCountdownAtMs?:number;hideCountdown?:boolean;weatherWarnings?:WeatherWarningState|null;announcementActive?:boolean;annotations?:import('../shared/liveAnnotations').AnnotationState|null}){
  const localAnnotations=useLiveAnnotations(state=>state.state);
  const localAnnouncementActive=useSpeechStatus(state=>state.active);
  const warning=useCurrentWeatherWarning(weatherWarnings);
  const [now,setNow]=useState(()=>AppClock.now().getTime());
  useEffect(()=>{if(!banner?.reserved)return;let frame=0;const tick=()=>{setNow(AppClock.now().getTime());frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[banner?.reserved]);
  const info=sectionInfo&&(sectionInfo.showTime||sectionInfo.showDate||sectionInfo.showTitle&&sectionInfo.title)?sectionInfo:undefined;
  return <div className="output-composition" data-section-info={info?.position} data-banner-position={banner?.reserved?banner.position:'none'} data-weather-warning={Boolean(warning)}>
    <div className="output-content-area"><div className="output-content-fit">{children}</div></div>
    {banner?.reserved&&<div className="output-banner-layer"><AnnouncementBanner state={banner} nowMs={now} reducedMotion={banner.reducedMotion??false}/></div>}
    {info&&<SectionInfoStrip info={info}/>}
    {!hideCountdown&&<ServiceCountdownBadge startsAtMs={serviceCountdownAtMs}/>}
    {warning&&<div className="output-weather-layer"><WeatherWarningBanner current={warning}/></div>}
    {!hideCountdown&&<LiveAnnotationOverlay state={annotations===undefined?localAnnotations:annotations}/>}
    {testOverlay}
    {(announcementActive??localAnnouncementActive)&&<AnnouncementIndicator/>}
  </div>;
}
