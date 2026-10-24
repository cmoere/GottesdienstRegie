import {useEffect,useRef} from 'react';
import {usePresentation} from '../store';
import {usePreferences,type QuickScreenConfig} from '../preferences';
import {backgroundAudioEngine} from '../BackgroundAudioEngine';
import {AnnouncementService} from '../community/AnnouncementService';
import {AppClock} from '../community/AppClock';
import {getCommunityAnnouncementRecords,subscribeCommunityRuntime} from '../community/communityRuntime';
import {AnnouncementRun,AnnouncementScheduler} from './AnnouncementRun';
import {normalizeAnnouncementSettings} from './settings';
import {playAnnouncementAudio} from './AnnouncementPlayer';
import {useSpeechStatus} from './AnnouncementIndicator';
import {generalAnnouncementProbe,registerAnnouncementTestController} from './AnnouncementTestRequests';
import type {SpokenAnnouncement} from './types';

/** Mounted once by the control shell, never by MAIN or preview/output renderers. */
export function AutomaticAnnouncements({quick}:{quick:QuickScreenConfig|null}){
 const quickRef=useRef(quick),tickRef=useRef<()=>void>(()=>{});quickRef.current=quick;
 useEffect(()=>{tickRef.current()},[quick]);
 useEffect(()=>{
  const bridge=window.desktop?.announcements;
  if(!bridge?.synthesize||!bridge.cancel||!bridge.setIndicator)return;
  let disposed=false,settings=normalizeAnnouncementSettings(null),activeKey='',activeRevision='',activeId='';
  let probe:{row:SpokenAnnouncement;key:string}|null=null,quietUntil=0;
  const scheduler=new AnnouncementScheduler(),service=new AnnouncementService();
  const context=()=>{
   const state=usePresentation.getState(),section=state.items.find(item=>item.id===state.liveItemId)?.sectionId,quick=quickRef.current;
   return state.onAir&&(section==='pre'||section==='post')&&(!quick||quick.type==='countdown')?section:null;
  };
  const key=()=>`${context()??''}:${JSON.stringify(settings)}:${JSON.stringify(usePreferences.getState().audioRouting)}`;
  const rows=()=>service.getSpoken(getCommunityAnnouncementRecords(),AppClock.now());
  const probeKey=()=>`${usePresentation.getState().onAir}:${context()??''}:${quickRef.current?.id??''}:${JSON.stringify(usePreferences.getState().audioRouting)}`;
  const probeAllowed=()=>!usePresentation.getState().onAir||Boolean(context());
  const valid=()=>probe?!disposed&&probeAllowed()&&probeKey()===probe.key&&(probe.row===generalAnnouncementProbe||rows().some(row=>row.id===probe!.row.id&&row.revision===probe!.row.revision)):!disposed&&Boolean(context())&&settings.enabled&&key()===activeKey&&rows().some(row=>row.id===activeId&&row.revision===activeRevision);
  const indicator=(active:boolean)=>{useSpeechStatus.setState({active});void bridge.setIndicator!(active).catch(()=>{})};
  const run=new AnnouncementRun({
   synthesize:text=>bridge.synthesize!(text),cancelSynthesis:()=>{void bridge.cancel!().catch(()=>{})},
   duck:percent=>backgroundAudioEngine.setAnnouncementDucking(percent),indicator,
   play:async(kind,data,signal,playing)=>{
    if(!valid())return;
    const url=kind==='gong'?new URL('audio/announcement-gong.wav',document.baseURI).href:URL.createObjectURL(new Blob([Uint8Array.from(data)],{type:'audio/wav'}));
    try{await playAnnouncementAudio(url,signal,playing,usePreferences.getState().audioRouting)}finally{if(kind==='speech')URL.revokeObjectURL(url)}
   },
  });
  const tick=()=>{
   if(disposed)return;
   const row=scheduler.next({now:AppClock.now().getTime(),context:context(),settings,rows:rows(),busy:run.busy||AppClock.now().getTime()<quietUntil});
   if(run.busy&&!valid()){run.cancel();return}
   if(useSpeechStatus.getState().active)void bridge.setIndicator!(true).catch(()=>{});
   if(!row)return;
   activeKey=key();activeId=row.id;activeRevision=row.revision;useSpeechStatus.setState({message:''});
   void run.start(row,settings.musicRemainingPercent,valid).catch(()=>{if(!disposed)useSpeechStatus.setState({message:'Durchsage nicht verfügbar. Mitgelieferte Stimme und Background-Audio-Ausgang prüfen.'})});
  };
  const offTest=registerAnnouncementTestController({
   async start(selection,musicPercent){
    if(disposed||run.busy)throw Error('Es läuft bereits eine Durchsage.');
    if(!probeAllowed())throw Error('Während eines laufenden Gottesdienstes oder einer Notfallanzeige ist keine Tonprobe möglich.');
    if(!Number.isFinite(musicPercent)||musicPercent<0||musicPercent>100)throw Error('Bitte einen Musikpegel zwischen 0 und 100 Prozent wählen.');
    const row=selection.kind==='general'?generalAnnouncementProbe:rows().find(value=>value.id===selection.id);
    if(!row)throw Error('Die gewählte Durchsage ist nicht mehr freigegeben.');
    probe={row,key:probeKey()};useSpeechStatus.setState({testing:true,message:''});
    try{await run.start(row,musicPercent,valid)}
    catch(error){if(!disposed)useSpeechStatus.setState({message:'Tonprobe fehlgeschlagen. Stimme und Background-Audio-Ausgang prüfen.'});throw error}
    finally{probe=null;quietUntil=AppClock.now().getTime()+settings.intervalMinutes*60_000;if(!disposed)useSpeechStatus.setState({testing:false})}
   },
   stop(){if(probe)run.cancel()},
  });
  let readRevision=0;
  const reload=()=>{const revision=++readRevision;void bridge.readSettings().then(value=>{if(disposed||revision!==readRevision)return;settings=normalizeAnnouncementSettings(value);tick()}).catch(()=>{settings=normalizeAnnouncementSettings(null);run.cancel();if(!disposed)useSpeechStatus.setState({message:'Ansageneinstellungen konnten nicht geladen werden.'})})};
  tickRef.current=tick;
  const deviceChanged=()=>run.cancel();
  const stopForEngineChange=()=>{settings={...settings,enabled:false};run.cancel();tick()};
  const offStore=usePresentation.subscribe(tick),offPrefs=usePreferences.subscribe(tick),offCommunity=subscribeCommunityRuntime(tick);
  window.addEventListener('gottesdienstregie:announcement-settings',reload);navigator.mediaDevices?.addEventListener('devicechange',deviceChanged);
  window.addEventListener('gottesdienstregie:announcement-stop',stopForEngineChange);
  const timer=window.setInterval(tick,1000);reload();
  return()=>{disposed=true;tickRef.current=()=>{};clearInterval(timer);offStore();offPrefs();offCommunity();offTest();window.removeEventListener('gottesdienstregie:announcement-settings',reload);window.removeEventListener('gottesdienstregie:announcement-stop',stopForEngineChange);navigator.mediaDevices?.removeEventListener('devicechange',deviceChanged);run.cancel();indicator(false);useSpeechStatus.setState({testing:false})};
 },[]);
 return null;
}
