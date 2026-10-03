export type AudioSignal='present'|'silent'|'unavailable'|'idle';
export type AudioStatus='connecting'|'buffering'|'playing'|'no-signal'|'output-unavailable'|'stream-error'|'paused'|'idle';
export type BackgroundAudioHealth={status:AudioStatus;signal:AudioSignal;route:'background';deviceId:string;deviceName:string;volume:number;muted:boolean;contextState:string;fallback:boolean};
export function backgroundAudioStatus(s:{hasSource:boolean;paused:boolean;progressing:boolean;waiting:boolean;routeReady:boolean;muted:boolean;volume:number;error:boolean;signal:AudioSignal;silentMs:number}):AudioStatus{
 if(!s.hasSource)return'idle';if(s.error)return'stream-error';if(!s.routeReady)return'output-unavailable';if(s.paused)return'paused';if(s.waiting)return'buffering';if(!s.progressing)return'connecting';if(s.muted||s.volume<=0||(s.signal==='silent'&&s.silentMs>=5000))return'no-signal';return'playing';
}
export const AUDIO_STATUS_LABELS:Record<AudioStatus,string>={connecting:'VERBINDET …',buffering:'PUFFERT …',playing:'LÄUFT','no-signal':'KEIN AUDIOSIGNAL','output-unavailable':'AUDIOAUSGANG NICHT VERFÜGBAR','stream-error':'STREAMFEHLER',paused:'PAUSE',idle:'GESTOPPT'};
