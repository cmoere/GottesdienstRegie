import {getCountdownPreset} from './countdownPresets';
import {remainingCountdownMs} from './countdownClock';
import './countdown.css';
export function CountdownView({presetId,durationMs,startedAtMs,nowMs}:{presetId?:string;durationMs:number;startedAtMs:number;nowMs:number}){
  const design=getCountdownPreset(presetId??'')?.designId??'clear';
  const seconds=Math.ceil(remainingCountdownMs(durationMs,startedAtMs,nowMs)/1000);
  const value=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  return <div className={`countdown-design countdown-${design}`} data-design={design}>
    <div className="countdown-decoration" aria-hidden="true"><i/><i/><i/></div>
    <div className="countdown-copy"><span>Wir beginnen gleich</span><strong>{value}</strong><small>Herzlich willkommen</small></div>
  </div>;
}
