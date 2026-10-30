import {useI18n} from './i18n';
import {useEffect,useMemo,useState} from 'react';
import {defaultAudioRouting,playRouteTestTone,routeAvailable,type AudioRoute,type AudioRouting} from './audioRouting';
import {usePreferences} from './preferences';
import {usePresentation} from './store';
import {SpotifySettings} from './spotify/SpotifySettings';

const Icon=({name}:{name:string})=><span className="material-symbols-outlined" aria-hidden="true">{name}</span>;


export function normalizedAudioRouting(value?:Partial<AudioRouting>):AudioRouting{return{
  ...defaultAudioRouting,...value,
  video:{...defaultAudioRouting.video,...value?.video},background:{...defaultAudioRouting.background,...value?.background},notification:{...defaultAudioRouting.notification,...value?.notification},preview:{...defaultAudioRouting.preview,...value?.preview},soundEffects:{...defaultAudioRouting.soundEffects,...value?.soundEffects}
}}

export function AudioRoutingSettings(){
  const {tx}=useI18n();
 const routeRows:Array<{route:AudioRoute;label:string;help:string}>=[
  {route:'video',label:tx("Medien / Videos"),help:tx("Ton von Videos und anderen Präsentationsmedien")},
  {route:'background',label:'Background Audio',help:tx("Playlists in Pre-Loop, Warm-up, Service und Post-Loop")},
  {route:'notification',label:tx("Systembenachrichtigungen"),help:tx("Interne Warnungen und Hinweise nur für den Bediener")},
  {route:'preview',label:tx("Preview / Vorhören"),help:tx("Audio-Browser und Vorschau, ohne MAIN zu verändern")},
  {route:'soundEffects',label:tx("LiveQuiz / Soundeffekte"),help:tx("Quiz- und Präsentations-Soundeffekte")}
];
  const prefs=usePreferences(),onAir=usePresentation(state=>state.onAir),routing=normalizedAudioRouting(prefs.audioRouting),[devices,setDevices]=useState<MediaDeviceInfo[]>([]),[testing,setTesting]=useState<AudioRoute|null>(null),[note,setNote]=useState('');
  const outputs=useMemo(()=>devices.filter(device=>device.kind==='audiooutput'&&device.deviceId!=='default'&&device.deviceId!=='communications'),[devices]);
  const defaultAvailable=routing.defaultOutputDeviceId==='system-default'||outputs.some(device=>device.deviceId===routing.defaultOutputDeviceId);
  useEffect(()=>{let active=true;const refresh=()=>void navigator.mediaDevices?.enumerateDevices().then(list=>{if(active)setDevices(list)}).catch(()=>active&&setDevices([]));refresh();navigator.mediaDevices?.addEventListener?.('devicechange',refresh);return()=>{active=false;navigator.mediaDevices?.removeEventListener?.('devicechange',refresh)}},[]);
  const change=(route:AudioRoute,deviceId:string)=>{prefs.setAudioRoute(route,{deviceId});if(onAir){setNote('Die Änderung wird sicher gespeichert. Laufende Wiedergaben bleiben ungestört; der neue Ausgang gilt spätestens bei der nächsten Wiedergabe.')}};
  const test=async(route:AudioRoute)=>{setTesting(route);try{const exact=await playRouteTestTone(routing,route);setNote(exact?'Testton wurde ausschließlich über diesen Ausgang wiedergegeben.':'Der gewählte Ausgang war nicht erreichbar. Testton wurde sicher über Systemstandard wiedergegeben.')}catch{setNote('Der Testton konnte nicht wiedergegeben werden. Bitte prüfe Betriebssystem und Verbindung.')}finally{setTesting(null)}};
  return <section className="audio-routing-settings"><header><div><h3>{tx("AUDIOAUSGÄNGE")}</h3><p>{tx("Route jede Audioquelle getrennt. LIVE hat Vorrang; eine Änderung startet laufende Musik oder Videos niemals neu.")}</p></div><button className="help-dot" title={tx("Hilfe: Audioausgänge")} onClick={()=>window.dispatchEvent(new CustomEvent('gottesdienstregie:open-help',{detail:'Audioausgänge'}))}>?</button></header>
    <div className="settings-group"><label className="setting-check"><input type="checkbox" checked={prefs.operatorSoundsEnabled} onChange={event=>prefs.setOperatorSoundsEnabled(event.target.checked)}/><span><b>{tx("Bedientöne")}</b><small>{tx("Töne für fertige Vorgänge, Nachrichten und Hinweise")}</small></span></label></div>
    <SpotifySettings/>
    <div className="settings-group audio-default-route"><h4>{tx("STANDARDAUSGANG")}</h4><label><span><b>{tx("STANDARDAUSGANG")}</b><small>{tx("Fallback für alle Routen")}</small></span><select value={routing.defaultOutputDeviceId} onChange={event=>prefs.setAudioDefaultOutput(event.target.value)}><option value="system-default">{tx("Systemstandard")}</option>{outputs.map((device,index)=><option key={device.deviceId} value={device.deviceId}>{(device.label||tx("Audioausgang {value1}",{value1:String((index+1))}))}</option>)}{!defaultAvailable&&<option value={routing.defaultOutputDeviceId}>{tx("Nicht verfügbar · gespeichertes Gerät")}</option>}</select></label>{!defaultAvailable&&<small className="default-route-warning"><Icon name="warning"/> {" "}{tx("Standardausgang nicht verfügbar · vorübergehender Fallback: Systemstandard")}</small>}</div>
    <div className="audio-route-list">{routeRows.map(({route,label,help})=>{const config=routing[route],available=routeAvailable(routing,route,devices);return <article key={route} className={available?'available':'missing'}><div className="audio-route-title"><Icon name={available?'check_circle':'warning'}/><span><b>{label}</b><small>{help}</small></span></div><label>{tx("Ausgang")}<select value={config.deviceId} onChange={event=>change(route,event.target.value)}><option value="default-output">{tx("Standardausgang verwenden")}</option>{route==='notification'&&<option value="system-default">{tx("Systemstandard")}</option>}{outputs.map((device,index)=><option key={device.deviceId} value={device.deviceId}>{(device.label||tx("Audioausgang {value1}",{value1:String((index+1))}))}</option>)}{!available&&config.deviceId!=='default-output'&&config.deviceId!=='system-default'&&<option value={config.deviceId}>{tx("Nicht verfügbar · gespeichertes Gerät")}</option>}</select></label><label className="audio-route-volume"><span>{tx("Lautstärke")}</span><input type="range" min="0" max="100" value={config.volume} onChange={event=>prefs.setAudioRoute(route,{volume:Number(event.target.value)})}/><output>{config.volume}%</output></label><button className={`route-mute ${config.muted?'muted':''}`} title={config.muted?tx("Stummschaltung aufheben"):tx("Route stummschalten")} onClick={()=>prefs.setAudioRoute(route,{muted:!config.muted})}><Icon name={config.muted?'volume_off':'volume_up'}/></button><button disabled={testing!==null} onClick={()=>void test(route)}>{testing===route?tx("TEST LÄUFT …"):tx("TESTEN")}</button><small className="route-status">{available?tx("Audioausgang verfügbar"):tx("Audioausgang nicht verfügbar · Fallback: Systemstandard")}</small></article>})}</div>
    {note&&<div className="audio-routing-note" role="status">{tx(note)}</div>}
  </section>
}
