export interface AnnouncementSettings {
  enabled:boolean;
  intervalMinutes:number;
  musicRemainingPercent:number;
  voiceId:string;
  speakerId:number|null;
  voiceAccepted:boolean;
}

export interface AnnouncementSettingsBridge {
  readSettings(): Promise<AnnouncementSettings>;
  writeSettings(value: AnnouncementSettings): Promise<AnnouncementSettings>;
}

const fields=new Set(['enabled','intervalMinutes','musicRemainingPercent','voiceId','speakerId','voiceAccepted']);
const modelId='de_DE-mls-medium';
const validSpeaker=(value:unknown):value is number=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<236;
const inRange=(value:unknown,min:number,max:number):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;

/** Read old/corrupt settings safely, but never activate an unchosen voice. */
export function normalizeAnnouncementSettings(value:unknown):AnnouncementSettings {
  const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const supported=raw.voiceId===modelId;
  const speakerId=supported&&validSpeaker(raw.speakerId)?raw.speakerId:null;
  const voiceAccepted=raw.voiceAccepted===true&&speakerId!==null;
  return {
    enabled:raw.enabled===true&&voiceAccepted,
    intervalMinutes:inRange(raw.intervalMinutes,1,120)?raw.intervalMinutes:5,
    musicRemainingPercent:inRange(raw.musicRemainingPercent,0,100)?raw.musicRemainingPercent:20,
    voiceId:modelId,speakerId,voiceAccepted,
  };
}

/** Strict persistence/IPC boundary: no coercion, arbitrary model path or extra data. */
export function validateAnnouncementSettings(value:unknown):AnnouncementSettings {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Ungültige Ansageneinstellungen.');
  const raw=value as Record<string,unknown>;
  if(Object.keys(raw).some(key=>!fields.has(key))
    ||typeof raw.enabled!=='boolean'||typeof raw.voiceAccepted!=='boolean'
    ||!inRange(raw.intervalMinutes,1,120)||!inRange(raw.musicRemainingPercent,0,100)
    ||raw.voiceId!==modelId||(raw.speakerId!==null&&!validSpeaker(raw.speakerId))
    ||(raw.voiceAccepted===true&&raw.speakerId===null)
    ||(raw.enabled===true&&(raw.voiceAccepted!==true||raw.speakerId===null)))
      throw Error('Bitte Intervall, Musikpegel und eine bewusst gewählte Stimme prüfen.');
  return normalizeAnnouncementSettings(raw);
}
