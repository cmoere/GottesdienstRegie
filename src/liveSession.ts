import type {DisplayRole} from './store';

export type LiveSessionMode = 'live' | 'test';
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
 const stopped:StartResult={started:false,allowRewards:false};
 if(!input.permitted)return {...stopped,error:'Keine Berechtigung für Live-Ausgaben.'};
 if(!input.desktopAvailable)return {...stopped,error:'Die Desktop-Ausgabe ist nicht verfügbar.'};
 if(input.mode!=='test'&&!input.eventKey)return {...stopped,error:'Bitte zuerst eine Veranstaltung verknüpfen oder bewusst den Testbetrieb starten.'};
 const assignments=Object.fromEntries(Object.entries(input.assignments).filter(([,role])=>input.mode!=='test'||role==='main'||role==='stage'));
 try {
  const preflight=await deps.preflight(assignments);
  const checked={...stopped,preflight};
  if(!preflight.ok||input.preflightOnly)return checked;
  if(!deps.isCurrent())return {...checked,error:'Die Präsentation oder Ausgabezuordnung wurde geändert. Bitte erneut starten.'};
  if(input.mode==='test') {
   const displays=await deps.displays();
   if(!Object.values(assignments).includes('main')||Object.keys(assignments).some(id=>!displays.some(display=>String(display.id)===id)))return {...checked,error:'Ein Testbildschirm fehlt. Bitte die Ausgabezuordnung prüfen.'};
   const targets=Object.entries(assignments).map(([id,role])=>`${role.toUpperCase()}: ${displays.find(display=>String(display.id)===id)!.label} (ID ${id})`).join('\n');
   if(!deps.confirm(`TESTBETRIEB STARTEN?\n\nEchte Bild- und Tonausgabe auf:\n${targets}\n\nAngeschlossene Beamer und Lautsprecher können für andere sichtbar bzw. hörbar sein. LIVESTREAM und weitere Ausgänge bleiben aus; es wird keine Aufnahme gestartet.${preflight.warnings.length?'\n\nPreflight-Hinweise:\n'+preflight.warnings.join('\n'):''}\n\nTestbetrieb jetzt starten?`))return checked;
  } else if(preflight.warnings.length&&!deps.confirm(`Preflight mit ${preflight.warnings.length} Hinweisen:\n\n${preflight.warnings.join('\n')}\n\nTrotzdem ON AIR gehen?`))return checked;
  if(!deps.isCurrent())return {...checked,error:'Der Start wurde durch eine Änderung am Arbeitsstand verworfen. Bitte erneut starten.'};
  if(!await deps.start(assignments))return {...checked,error:'Die Ausgabe konnte nicht gestartet werden.'};
  return {started:true,allowRewards:input.mode==='live',preflight};
 }catch(error){return {...stopped,error:error instanceof Error?error.message:'Die Ausgabe konnte nicht gestartet werden.'}}
}
