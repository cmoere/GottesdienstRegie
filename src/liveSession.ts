import {formatRegionalTemplate as sourceCopy} from '../shared/regional/validation';
import type {AppModeState} from './appMode';
import type {DisplayRole} from './store';

export type LiveSessionMode = 'live' | 'test';
export function resolveSessionAction(state:AppModeState,requested:LiveSessionMode){if(!state.onAir)return 'start';if(state.mode==='test'&&requested==='live')return 'confirm-production';return 'stop'}
interface PreflightResult {ok:boolean;errors:string[];warnings:string[]}
interface StartInput {
 mode:LiveSessionMode;
 permitted:boolean;
 desktopAvailable:boolean;
 eventKey?:string;
 assignments:Record<string,DisplayRole>;
 preflightOnly?:boolean;
}
interface StartDependencies {
 copy?:typeof sourceCopy;
 preflight:(assignments:Record<string,DisplayRole>)=>Promise<PreflightResult>;
 displays:()=>Promise<{id:number;label:string}[]>;
 confirm:(message:string)=>boolean;
 isCurrent:()=>boolean;
 start:(assignments:Record<string,DisplayRole>)=>Promise<boolean>;
}
interface StartResult {
 started:boolean;
 allowRewards:boolean;
 preflight?:PreflightResult;
 error?:string;
}

// A test is an explicit, transient output session, never a fake event link.
// All starts use the same preflight; only the event prerequisite differs.
export async function startLiveSession(input:StartInput,deps:StartDependencies):Promise<StartResult> {
 const copy=deps.copy??sourceCopy;
 const stopped:StartResult={started:false,allowRewards:false};
 if(!input.permitted)return {...stopped,error:copy("Keine Berechtigung für Live-Ausgaben.")};
 if(!input.desktopAvailable)return {...stopped,error:copy("Die Desktop-Ausgabe ist nicht verfügbar.")};
 if(input.mode!=='test'&&!input.eventKey)return {...stopped,error:copy("Bitte zuerst eine Veranstaltung verknüpfen oder bewusst den Testbetrieb starten.")};
 const assignments=Object.fromEntries(Object.entries(input.assignments).filter(([,role])=>input.mode!=='test'||role==='main'||role==='stage'));
 try {
  const preflight=await deps.preflight(assignments);
  const checked={...stopped,preflight};
  if(!preflight.ok||input.preflightOnly)return checked;
  if(!deps.isCurrent())return {...checked,error:copy("Die Präsentation oder Ausgabezuordnung wurde geändert. Bitte erneut starten.")};
  if(input.mode==='test') {
   const displays=await deps.displays();
   if(!Object.values(assignments).includes('main')||Object.keys(assignments).some(id=>!displays.some(display=>String(display.id)===id)))return {...checked,error:copy("Ein Testbildschirm fehlt. Bitte die Ausgabezuordnung prüfen.")};
   const targets=Object.entries(assignments).map(([id,role])=>`${role.toUpperCase()}: ${displays.find(display=>String(display.id)===id)!.label} (ID ${id})`).join('\n');
   if(!deps.confirm(copy("TESTBETRIEB STARTEN?\n\nEchte Bild- und Tonausgabe auf:\n{value1}\n\nAngeschlossene Beamer und Lautsprecher können für andere sichtbar bzw. hörbar sein. LIVESTREAM und weitere Ausgänge bleiben aus; es wird keine Aufnahme gestartet.{value2}\n\nTestbetrieb jetzt starten?",{value1:String(targets),value2:String((preflight.warnings.length?copy("\n\nPreflight-Hinweise:\n{value1}",{value1:String(preflight.warnings.join('\n'))}):""))})))return checked;
  } else if(preflight.warnings.length&&!deps.confirm(copy("Preflight mit {value1} Hinweisen:\n\n{value2}\n\nTrotzdem ON AIR gehen?",{value1:String(preflight.warnings.length),value2:String(preflight.warnings.join('\n'))})))return checked;
  if(!deps.isCurrent())return {...checked,error:copy("Der Start wurde durch eine Änderung am Arbeitsstand verworfen. Bitte erneut starten.")};
  if(!await deps.start(assignments))return {...checked,error:copy("Die Ausgabe konnte nicht gestartet werden.")};
  return {started:true,allowRewards:input.mode==='live',preflight};
 }catch(error){return {...stopped,error:(error instanceof Error?error.message:copy("Die Ausgabe konnte nicht gestartet werden."))}}
}
