import type {Language} from './preferences';

type AudioLabelKey='stop'|'removeStop'|'add';
const labels:Record<'de'|'en',Record<AudioLabelKey,string>>={
  de:{stop:'HINTERGRUNDAUDIO STOPPEN',removeStop:'STOPPUNKT ENTFERNEN',add:'HINTERGRUNDAUDIO HINZUFÜGEN'},
  en:{stop:'STOP BACKGROUND AUDIO',removeStop:'REMOVE STOP CUE',add:'ADD BACKGROUND AUDIO'},
};
export const backgroundAudioLabel=(key:AudioLabelKey,language:Language,copy:(text:string)=>string=text=>text)=>language==='de'?copy(labels.de[key]):labels[language==='en'?'en':'de'][key];
