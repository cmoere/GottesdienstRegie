import{useEffect,useRef}from'react';import{create}from'zustand';
import{readWeatherWarningReply,warningEligible,type WeatherWarningReply,type WeatherWarningState}from'../../shared/weatherWarnings';
import{usePresentation}from'../store';import{useLiveOutputPreview}from'../liveOutputPreview';import type{QuickScreenConfig}from'../preferences';import{normalizeExternalSettings}from'../externalLoop/model';import{AppClock}from'../community/AppClock';import{WeatherWarningSession}from'./session';
export const useWeatherWarnings=create<{state:WeatherWarningState|null;status:string}>(()=>({state:null,status:'Noch nicht geladen'}));
export function WeatherWarningsController({quick}:{quick:QuickScreenConfig|null}){
 const currentQuick=useRef(quick),tickRef=useRef(()=>{});currentQuick.current=quick;useEffect(()=>{tickRef.current()},[quick]);
 useEffect(()=>{
  const session=new WeatherWarningSession();let reply:WeatherWarningReply|null=null,disposed=false,lastKey='',lastPoll=-Infinity,sequence=0,busy=false,lastState:WeatherWarningState|null=null;
  const tick=()=>{
   if(disposed)return;const state=usePresentation.getState(),output=useLiveOutputPreview.getState().slide,context=output?.bannerContext;
   const allowed=warningEligible({onAir:state.onAir&&Boolean(output),liveSection:context?.liveSection??'other',countdownActive:context?.countdownActive??false,quickType:currentQuick.current?.type??null});
   const item=state.items.find(item=>item.type==='weather'&&item.enabled&&!item.disabled&&['pre','post'].includes(item.sectionId)),settings=normalizeExternalSettings({...item?.metadata,externalKind:'weather'});
   if(settings.kind!=='weather')return;const location={name:settings.name,latitude:settings.latitude,longitude:settings.longitude},key=JSON.stringify(location),now=AppClock.now().getTime();
   if(key!==lastKey){lastKey=key;reply=null;sequence++;busy=false;lastPoll=-Infinity}
   const reader=window.desktop?.weatherWarnings;
   if(allowed&&!reader){reply=null;useWeatherWarnings.setState({status:'DWD derzeit nicht verfügbar'})}
   if(allowed&&reader&&!busy&&now-lastPoll>=60000){lastPoll=now;busy=true;const id=++sequence;void reader.read(location).then(value=>{
    if(disposed||sequence!==id)return;reply=readWeatherWarningReply(value);busy=false;useWeatherWarnings.setState({status:!reply||reply.status==='unavailable'?'DWD derzeit nicht verfügbar':reply.status==='stale'?'DWD: letzter gültiger Stand':`DWD: ${reply.warnings.length} gültige Warnung(en)`});tick();
   }).catch(()=>{if(disposed||sequence!==id)return;busy=false;reply={status:'unavailable',fetchedAt:0,warnings:[]};useWeatherWarnings.setState({status:'DWD derzeit nicht verfügbar'});tick()})}
   const next=session.update(reply,allowed,now);if(next!==lastState){lastState=next;useWeatherWarnings.setState({state:next});void window.desktop?.sendWeatherWarnings?.(next)}
  };
  tickRef.current=tick;const offLive=useLiveOutputPreview.subscribe(tick),offState=usePresentation.subscribe(tick),timer=setInterval(tick,500);tick();
  return()=>{disposed=true;clearInterval(timer);offLive();offState();useWeatherWarnings.setState({state:null});void window.desktop?.sendWeatherWarnings?.(null)};
 },[]);return null;
}
