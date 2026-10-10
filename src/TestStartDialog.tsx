import {useEffect,useRef,useState} from 'react';
import type {PostProgramTestScenario} from './community/PostProgramRoomNoticeService';

export function TestStartDialog({onStart,onClose}:{onStart:(scenario:PostProgramTestScenario)=>void;onClose:()=>void}){
 const [scenario,setScenario]=useState<PostProgramTestScenario>('automatic');
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;if(element?.showModal)element.showModal();else element?.setAttribute('open','')},[]);
 return <dialog ref={dialog} className="test-start-dialog" aria-labelledby="test-start-title" onCancel={event=>{event.preventDefault();onClose()}}>
  <form onSubmit={event=>{event.preventDefault();onStart(scenario)}}>
   <h2 id="test-start-title">Testbetrieb vorbereiten</h2>
   <fieldset><legend>Anzeige im Nachprogramm</legend>
    {([['automatic','Automatisch','Verknüpfte Veranstaltung und echte Raumbelegung verwenden.'],['leave-room','Raum verlassen','Den Raum-verlassen-Hinweis testen, auch ohne Gemeindedaten.'],['next-events','Testveranstaltung','Eindeutig gekennzeichnete Beispieldaten anzeigen – keine echten Termine ändern.']] as const).map(([value,label,description])=><label key={value}>
     <input type="radio" name="post-program-scenario" aria-label={label} aria-describedby={`test-scenario-${value}`} value={value} checked={scenario===value} onChange={()=>setScenario(value)}/>
     <span>{label}<small id={`test-scenario-${value}`}>{description}</small></span>
    </label>)}
   </fieldset>
   <p>Die Auswahl gilt nur für diesen Testlauf. Das Test-Wasserzeichen bleibt sichtbar. Im nächsten Schritt bestätigst du die echte Bild- und Tonausgabe.</p>
   <footer><button type="button" onClick={onClose}>Abbrechen</button><button type="submit">Weiter zur Ausgabeprüfung</button></footer>
  </form>
 </dialog>;
}
