import {useI18n} from "../i18n";
import type {SpeechReadingSettings} from './readingSettings';
export function ReadingSettingsControls({value,onChange,disabled,german}:{value:SpeechReadingSettings;onChange:(value:SpeechReadingSettings)=>void;disabled:boolean;german:boolean}){
 const {tx}=useI18n();
 const controls:Array<[keyof Omit<SpeechReadingSettings,'emphasis'>,string,string,number,number,number]>=[
  ['loudnessPercent',tx('Sprachlautheit (%)'),'Speech loudness (%)',50,200,5],['speed',tx('Sprechtempo'),'Speech speed',.7,1.3,.05],['sentencePauseMs',tx('Satzpause (ms)'),'Sentence pause (ms)',0,1000,50],['paragraphPauseMs',tx('Absatzpause (ms)'),'Paragraph pause (ms)',0,2000,50]];
 return <fieldset disabled={disabled}><legend>{german?tx("Vorlesen"):'Reading'}</legend>
  {controls.map(([key,de,en,min,max,step])=><label key={key}>{german?de:en}<input className="settings-number-input" type="number" min={min} max={max} step={step} value={value[key]} onChange={event=>onChange({...value,[key]:event.currentTarget.valueAsNumber})}/></label>)}
  <label>{german?tx("Betonung"):'Delivery'}<select value={value.emphasis} onChange={event=>onChange({...value,emphasis:event.target.value as SpeechReadingSettings['emphasis']})}><option value="calm">{german?tx("Ruhig"):'Calm'}</option><option value="clear">{german?tx("Deutlich"):'Clear'}</option></select></label>
  <p>{german?tx("Die Sprachlautheit hebt leise Silben mit Spitzenbegrenzung an. Gong und Audioausgang bleiben unverändert. 150 % ist der neue Standard; 100 % entspricht dem bisherigen Sprachpegel. Alle Einstellungen gelten nach dem Speichern auch für die Tonprobe."):'Speech loudness raises quiet syllables with peak protection. The gong and output route stay unchanged. The new default is 150%; 100% matches the previous speech level. Save before testing.'}</p>
 </fieldset>;
}
