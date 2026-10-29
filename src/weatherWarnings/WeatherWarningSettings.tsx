import {useI18n} from "../i18n";
import {useState} from 'react';
import {usePreferences} from '../preferences';

export function WeatherWarningSettings(){
 const {tx}=useI18n();
 const enabled=usePreferences(state=>state.weatherWarningsEnabled!==false);
 const [confirm,setConfirm]=useState(false);
 return <section className="settings-group">
  <h3>{tx("Wetterwarnungen")}</h3>
  <label><input type="checkbox" checked={enabled} onChange={()=>enabled?setConfirm(true):usePreferences.getState().setWeatherWarningsEnabled(true)}/> {" "}{tx("Amtliche DWD-Wetterwarnungen anzeigen")}</label>
  <p>{tx("Warnungen für den eingestellten Wetterort erscheinen im Vorprogramm, Nachprogramm und Countdown. Im Gottesdienst bleiben sie ausgeblendet.")}</p>
  {confirm&&<div className="modal-backdrop" onClick={()=>setConfirm(false)}><section className="modal weather-warning-confirm" role="dialog" aria-modal="true" aria-labelledby="weather-warning-confirm-title" onClick={event=>event.stopPropagation()} onKeyDown={event=>{if(event.key==='Escape')setConfirm(false)}}>
   <h3 id="weather-warning-confirm-title">{tx("Wetterwarnungen deaktivieren?")}</h3>
   <p>{tx("Besucher sehen dann keine amtlichen Wetterwarnungen mehr auf den Ausgaben. Bitte stelle sicher, dass wichtige Warnungen auf anderem Weg bekannt gegeben werden.")}</p>
   <div className="actions"><button autoFocus onClick={()=>setConfirm(false)}>{tx("Abbrechen")}</button><button onClick={()=>{usePreferences.getState().setWeatherWarningsEnabled(false);setConfirm(false)}}>{tx("Wetterwarnungen deaktivieren")}</button></div>
  </section></div>}
 </section>;
}
