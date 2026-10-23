import {useContext,useSyncExternalStore,type CSSProperties} from 'react';
import {ExternalLoopContext} from './context';
import {ExternalLoopView} from './View';
import {normalizeExternalSettings} from './model';
import {externalRequestKey} from '../../shared/externalLoopRequest';
import {readExternalSnapshot} from '../../shared/externalLoopValidation';
import type {ExternalSettings} from '../../shared/externalLoop';

export function ExternalLoopElement({properties,style,mode}:{properties:Record<string,unknown>;style:CSSProperties;mode:string}){
 const controller=useContext(ExternalLoopContext);
 useSyncExternalStore(controller?.subscribe??(()=>()=>{}),controller?.getVersion??(()=>0));
 const live=mode==='live'||mode==='mirror';
 let settings=normalizeExternalSettings({...properties,externalKind:properties.loopType});
 if(live){try{
  const saved=JSON.parse(String(properties.externalSettingsJson??'null')) as ExternalSettings|null;
  if(saved)settings=normalizeExternalSettings(saved.kind==='news'?{externalKind:'news',newsSources:saved.sources,newsLimit:saved.limit,durationSeconds:saved.durationSeconds}:{externalKind:'football',footballLeague:saved.league,footballMode:saved.mode,footballTeamId:saved.teamId,durationSeconds:saved.durationSeconds});
 }catch{/* Invalid frozen settings never trigger a network fallback. */}}
 const request=settings.kind==='news'?{kind:'news' as const,sources:settings.sources}:{kind:'football' as const,league:settings.league,mode:settings.mode};
 let snapshot=null;
 if(live){try{
  const raw=JSON.parse(String(properties.externalSnapshotJson??'null'));
  // Age is checked when taking the frame, never while it is already visible.
  snapshot=readExternalSnapshot(raw,externalRequestKey(request),Number(raw?.fetchedAt));
 }catch{/* No public diagnostic text. */}}
 else snapshot=controller?.peek(request).snapshot??null;
 const startedAt=Number(properties.externalStartedAtMs);
 return <div className="slide-renderer-element" style={style}>{snapshot&&<ExternalLoopView snapshot={snapshot} settings={settings} startedAt={Number.isFinite(startedAt)?startedAt:Date.now()} staticPreview={mode==='thumbnail'||mode==='editor'}/>}</div>;
}
