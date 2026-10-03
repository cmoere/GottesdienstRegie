import {AUDIO_STATUS_LABELS,type BackgroundAudioHealth} from './audio/backgroundAudioHealth';
export function AudioDiagnostics({health}:{health?:BackgroundAudioHealth}){
 if(!health)return null;
 return <details className="audio-diagnostics"><summary>{AUDIO_STATUS_LABELS[health.status]}</summary><div>Stream: {AUDIO_STATUS_LABELS[health.status]}<br/>Signal: {health.signal==='present'?'vorhanden':health.signal==='silent'?'kein Signal':'nicht messbar'}<br/>Route: Background Audio<br/>Ausgang: {health.deviceName}<br/>Lautstärke: {health.volume} %<br/>Mute: {health.muted?'Ja':'Nein'}<br/>AudioContext: {health.contextState}</div></details>;
}
