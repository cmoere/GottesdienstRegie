import {useEffect,useRef} from 'react';
import {create} from 'zustand';
import {AnnouncementService,type RawAnnouncement} from './community/AnnouncementService';
import {startCommunityRuntime,subscribeCommunityRuntime,getCommunityAnnouncementRecords} from './community/communityRuntime';
import {usePresentation} from './store';
import {usePreferences,type QuickScreenConfig} from './preferences';
import {useLiveOutputPreview} from './liveOutputPreview';
import {BannerSession,BANNER_SEPARATOR} from './announcementBannerSession';
import {isBannerAllowed} from './announcementBannerModel';
import {AppClock} from './community/AppClock';
import type {BannerOutputState} from './outputState';
import {loadBannerSettings,useBannerSettings} from './useBannerSettings';
export const useAnnouncementBanner=create<{banner:BannerOutputState|null}>(()=>({banner:null}));
export function AnnouncementBannerController({quick}:{quick:QuickScreenConfig|null}){
  const quickRef=useRef(quick),tickRef=useRef<()=>void>(()=>{});quickRef.current=quick;
  useEffect(()=>{tickRef.current()},[quick]);
  useEffect(()=>{
    void loadBannerSettings();startCommunityRuntime();
    const session=new BannerSession(),service=new AnnouncementService(),widths=new Map<string,number>();
    const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
    let previous:BannerOutputState|null=null,disposed=false,records:RawAnnouncement[]=getCommunityAnnouncementRecords();
    const tick=()=>{
      if(disposed)return;
      const quick=quickRef.current;
      const state=usePresentation.getState(),output=useLiveOutputPreview.getState().slide;
      const liveContext=output?.bannerContext??{liveSection:'other' as const,countdownActive:false};
      const items=service.getBanners(records,AppClock.now()),textWidths=items.map(message=>{let width=widths.get(message.text);if(width===undefined){if(context){context.font='700 44px "Cera Pro", system-ui';context.letterSpacing='-0.44px';width=context.measureText(message.text).width}else width=message.text.length*24;widths.set(message.text,width)}return width});
      const banner=session.update({items,textWidths,separatorWidth:context?.measureText(BANNER_SEPARATOR).width??BANNER_SEPARATOR.length*12,nowMs:AppClock.now().getTime(),takeKey:`${output?.id??''}:${output?._countdownStartedAtMs??(output as any)?._presentAtMs??''}:${quick?.id??''}:${quick?.startedAtMs??''}`,enabled:state.onAir&&Boolean(output),allowed:isBannerAllowed({...liveContext,quickType:quick?.type??null}),position:useBannerSettings.getState().position,reducedMotion:usePreferences.getState().reduceMotion});
      if(banner!==previous){previous=banner;useAnnouncementBanner.setState({banner});void(window.desktop as any)?.sendAnnouncementBanner?.(banner)}
    };
    tickRef.current=tick;
    const offData=subscribeCommunityRuntime(()=>{records=getCommunityAnnouncementRecords();tick()}),offLive=useLiveOutputPreview.subscribe(tick),offPresentation=usePresentation.subscribe(tick),offSettings=useBannerSettings.subscribe(tick);
    const timer=window.setInterval(tick,250);tick();
    const fontChanged=()=>{if(!disposed){widths.clear();tick()}};
    void document.fonts?.ready.then(fontChanged);
    void document.fonts?.load?.('700 44px "Cera Pro"')?.then(fontChanged).catch(()=>{});
    document.fonts?.addEventListener?.('loadingdone',fontChanged);
    return()=>{disposed=true;clearInterval(timer);document.fonts?.removeEventListener?.('loadingdone',fontChanged);offData();offLive();offPresentation();offSettings();useAnnouncementBanner.setState({banner:null});void(window.desktop as any)?.sendAnnouncementBanner?.(null)};
  },[]);
  return null;
}
