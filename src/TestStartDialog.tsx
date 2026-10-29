import {useI18n} from './i18n';
import {useEffect,useRef,useState} from 'react';
import type {PostProgramTestScenario} from './community/PostProgramRoomNoticeService';
import {decodeTestScenario,encodeTestScenario,type TestEventSituation} from './community/postProgramTestData';

export function TestStartDialog({onStart,onClose}:{onStart:(scenario:PostProgramTestScenario)=>void;onClose:()=>void}){
 const {tx}=useI18n();
 const [remembered]=useState(()=>{try{return decodeTestScenario(localStorage.getItem('gottesdienstregie.test-preparation'))}catch{return decodeTestScenario('automatic')}});
 const [scenario,setScenario]=useState(remembered.scenario),[count,setCount]=useState(remembered.count),[situation,setSituation]=useState<TestEventSituation>(remembered.situation);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;if(element?.showModal)element.showModal();else element?.setAttribute('open','')},[]);
 return <dialog ref={dialog} className="test-start-dialog" aria-labelledby="test-start-title" onCancel={event=>{event.preventDefault();onClose()}}>
  <form onSubmit={event=>{event.preventDefault();const value=encodeTestScenario(scenario,count,situation);try{localStorage.setItem('gottesdienstregie.test-preparation',value)}catch{}onStart(value)}}>
   <h2 id="test-start-title">{tx("Testbetrieb vorbereiten")}</h2>
   <fieldset><legend>{tx("Anzeige im Nachprogramm")}</legend>
    {([['automatic',tx('Automatisch'),tx('Verknüpfte Veranstaltung und echte Raumbelegung verwenden.')],['leave-room',tx('Raum verlassen'),tx('Den Raum-verlassen-Hinweis testen, auch ohne Gemeindedaten.')],['next-events',tx('Testveranstaltung'),tx('Eindeutig gekennzeichnete Beispieldaten anzeigen – keine echten Termine ändern.')]] as const).map(([value,label,description])=><label key={value}>
     <input type="radio" name="post-program-scenario" aria-label={label} aria-describedby={`test-scenario-${value}`} value={value} checked={scenario===value} onChange={()=>setScenario(value)}/>
     <span>{label}<small id={`test-scenario-${value}`}>{description}</small></span>
    </label>)}
   </fieldset>
   {scenario==='next-events'&&<div className="test-event-options"><label>{tx("Anzahl Veranstaltungen")}<input aria-label={tx("Anzahl Veranstaltungen")} type="number" min="1" max="12" value={count} onChange={e=>setCount(Number(e.target.value))}/></label><label>{tx("Testsituation")}<select aria-label={tx("Testsituation")} value={situation} onChange={e=>setSituation(e.target.value as TestEventSituation)}><option value="normal">{tx("Normal")}</option><option value="delayed">{tx("Verspätung (+5 Minuten)")}</option><option value="cancelled">{tx("Entfall")}</option><option value="room-changed">{tx("Raumwechsel")}</option><option value="mixed">{tx("Gemischt")}</option></select></label></div>}
   <p>{tx("Deine letzte Auswahl wird vorgeschlagen; vor jedem Test kannst du sie ändern. Beispieldaten einschließlich Entfall sind ausdrücklich nur Testdarstellungen. Echte Termine bleiben unverändert. Im nächsten Schritt bestätigst du die echte Bild- und Tonausgabe.")}</p>
   <footer><button type="button" onClick={onClose}>{tx("Abbrechen")}</button><button type="submit">{tx("Weiter zur Ausgabeprüfung")}</button></footer>
  </form>
 </dialog>;
}
