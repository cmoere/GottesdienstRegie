import {useI18n} from "./i18n";
import {AUDIO_STATUS_LABELS,type BackgroundAudioHealth} from './audio/backgroundAudioHealth';
export function AudioDiagnostics({health}:{health?:BackgroundAudioHealth}){
 const {tx}=useI18n();
 if(!health)return null;
 return <details className="audio-diagnostics"><summary>{tx(AUDIO_STATUS_LABELS[health.status])}</summary><div>{tx("Stream:")}{" "}{tx(AUDIO_STATUS_LABELS[health.status])}<br/>{tx("Signal:")}{" "}{health.signal==='present'?tx("vorhanden"):health.signal==='silent'?tx("KEIN SIGNAL"):tx("nicht messbar")}<br/>{tx("Route: Background Audio")}<br/>{tx("Ausgang:")}{" "}{health.deviceName}<br/>{tx("Lautstärke:")}{" "}{health.volume} %<br/>{tx("Mute:")}{" "}{health.muted?tx("Ja"):tx("Nein")}<br/>{tx("AudioContext:")}{" "}{health.contextState}</div></details>;
}
