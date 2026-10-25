export interface SpeechReadingSettings{loudnessPercent:number;speed:number;sentencePauseMs:number;paragraphPauseMs:number;emphasis:'calm'|'clear'}
export const defaultReadingSettings:Readonly<SpeechReadingSettings>={loudnessPercent:150,speed:1,sentencePauseMs:280,paragraphPauseMs:600,emphasis:'calm'};
const ranges={loudnessPercent:[50,200],speed:[.7,1.3],sentencePauseMs:[0,1000],paragraphPauseMs:[0,2000]} as const;
export function validateReadingSettings(value:unknown):SpeechReadingSettings{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Ungültige Vorleseeinstellungen.');
 const raw=value as Record<string,unknown>;
 if(Object.keys(raw).length!==5||Object.keys(raw).some(key=>!Object.hasOwn(defaultReadingSettings,key))||typeof raw.emphasis!=='string'||!['calm','clear'].includes(raw.emphasis))throw Error('Ungültige Vorleseeinstellungen.');
 for(const [key,[min,max]]of Object.entries(ranges)){const n=raw[key];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error('Vorleseeinstellung außerhalb des erlaubten Bereichs.')}
 return{loudnessPercent:raw.loudnessPercent as number,speed:raw.speed as number,sentencePauseMs:raw.sentencePauseMs as number,paragraphPauseMs:raw.paragraphPauseMs as number,emphasis:raw.emphasis as SpeechReadingSettings['emphasis']};
}
export function normalizeReadingSettings(value:unknown):SpeechReadingSettings{try{return validateReadingSettings(value)}catch{return{...defaultReadingSettings}}}
