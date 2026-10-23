import {useEffect,useRef,useState} from 'react';
import type {QuickScreenConfig} from './preferences';
import {createScreenTestSession,screenTestPatterns,type ScreenTestPatternId,type ScreenTestSummary} from './screenTest';
import {ScreenTestPattern} from './ScreenTestPattern';
import './screenTest.css';
export type ScreenTestBridge={sendQuick:(roles:string[],quick:QuickScreenConfig|null)=>Promise<unknown>;restore:(runId:string,quick:QuickScreenConfig|null)=>Promise<boolean>;onResult:(callback:(value:unknown)=>void)=>()=>void};
type View={phase:'confirm'|'running'|'summary';pattern:ScreenTestPatternId;completed:number;result?:ScreenTestSummary};
export function useScreenTest(options:{current:QuickScreenConfig|null;onAir:boolean;setQuick:(quick:QuickScreenConfig|null)=>void;bridge?:ScreenTestBridge}){
 const latest=useRef(options);latest.current=options;
 const active=useRef<{runId:string;session:ReturnType<typeof createScreenTestSession>}|null>(null),mounted=useRef(true);
 const [view,setView]=useState<View|null>(null);
 useEffect(()=>options.bridge?.onResult(value=>active.current?.session.receive(value)),[options.bridge]);
 useEffect(()=>{const run=active.current;if(!run)return;if(!options.onAir)run.session.cancel();else if(options.current?.testRunId!==run.runId)run.session.cancel(false)},[options.current,options.onAir]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;active.current?.session.cancel(false)}},[]);
 const interrupt=(restore=false)=>active.current?.session.cancel(restore);
 const start=()=>{
  if(active.current||!latest.current.onAir||!latest.current.bridge)return;
  const previous=latest.current.current,runId=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
  const session=createScreenTestSession({runId,
   show:async pattern=>{const current=latest.current;if(!current.onAir||!current.bridge)return false;const quick:QuickScreenConfig={id:'screen-test',type:'screenTest',name:'Bildschirmtest',enabled:true,targets:['main'],order:8,testRunId:runId,testPattern:pattern};current.setQuick(quick);return current.bridge.sendQuick(['main'],quick)},
   restore:async()=>{const current=latest.current;if(!mounted.current||current.current?.testRunId!==runId)return;if(current.onAir&&!await current.bridge?.restore(runId,previous))throw Error('MAIN hat den Bildschirmtest bereits verlassen.');if(mounted.current&&latest.current.current?.testRunId===runId)latest.current.setQuick(previous)},
   onProgress:(pattern,completed)=>{if(mounted.current)setView({phase:'running',pattern,completed})},
  });
  active.current={runId,session};
  void session.start().then(result=>{if(active.current?.session===session)active.current=null;if(mounted.current)setView({phase:'summary',pattern:'bars',completed:result.steps.filter(s=>s.ok).length,result})});
 };
 return {request:()=>{if(!active.current)setView({phase:'confirm',pattern:'bars',completed:0})},interrupt,
  dialog:view?<ScreenTestDialog view={view} ready={options.onAir&&Boolean(options.bridge)} start={start} cancel={()=>active.current?.session.cancel()} close={()=>setView(null)}/>:null,
 };
}
function ScreenTestDialog({view,ready,start,cancel,close}:{view:View;ready:boolean;start:()=>void;cancel:()=>void;close:()=>void}){
 const[exportStatus,setExportStatus]=useState('');
 const exportReport=async(format:'html'|'json')=>{if(!view.result)return;try{const save=(window.desktop as any)?.screenTest?.exportReport;if(!save){setExportStatus('Berichtdownload ist in der Desktop-Anwendung verfügbar.');return}const result=await save(view.result,format);setExportStatus(result?'Bericht gespeichert.':'Speichern abgebrochen.')}catch{setExportStatus('Bericht konnte nicht gespeichert werden.')}};
 const element=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=element.current;if(dialog?.showModal)dialog.showModal();else dialog?.setAttribute('open','')},[]);
 const running=view.phase==='running';
 return <dialog ref={element} className="screen-test-dialog" aria-labelledby="screen-test-title" onCancel={event=>{event.preventDefault();running?cancel():close()}}>
  <h2 id="screen-test-title">{view.phase==='summary'?'Bildschirmtest – Auswertung':'Bildschirmtest'}</h2>
  {view.phase==='confirm'?<><p>Alle acht Testbilder werden automatisch auf MAIN angezeigt. Die aktuelle Ausgabe wird vorübergehend verdeckt und danach wiederhergestellt. Audio und Präsentationsposition bleiben unverändert.</p><p>Jedes Muster bleibt mindestens fünf Sekunden bei stabilen Renderer-Abmessungen sichtbar. Der gesamte Test dauert mindestens etwa 40 Sekunden. Nach spätestens 20 Sekunden pro Muster ohne gültige Rückmeldung wird der Test angehalten.</p>{!ready&&<p role="status">MAIN ist nicht aktiv oder unterstützt die Rückmeldung noch nicht. Starte zuerst den Testbetrieb oder ON AIR; der Bildschirmtest schaltet nicht selbst ON AIR.</p>}</>:null}
  {running&&<><p role="status">{view.completed+1} / 8 · {screenTestPatterns.find(p=>p.id===view.pattern)?.label} wird geprüft …</p><div className="screen-test-current"><ScreenTestPattern pattern={view.pattern}/></div><progress max={8} value={view.completed}/><p>Das Muster bleibt bis zum Abschluss der Prüfung sichtbar. Du kannst jederzeit abbrechen.</p></>}
  {view.result&&<><p role="status">{view.result.message}</p><p>{view.completed} / 8 Muster technisch bestätigt.</p><ul>{view.result.steps.map(step=><li key={step.pattern}>{screenTestPatterns.find(p=>p.id===step.pattern)?.label}: {step.ok?'Canvas-Prüfung bestanden':'Prüfung fehlgeschlagen'} · {step.width} × {step.height} px · {step.frames} Renderer-Frames · {(step.elapsedMs/1000).toFixed(1)} s</li>)}</ul></>}
  <p className="screen-test-info">Keine automatische Prüfung von Kabel, Beamer-Schärfe, tatsächlicher Farbwiedergabe oder physischer Bildausgabe. Die Rückmeldung bestätigt die Musterprüfung im MAIN-Renderer, nicht den sichtbaren Lichtstrahl. Sichtprüfung: offen.</p>
  {exportStatus&&<p role="status">{exportStatus}</p>}
  <footer>{running?<button type="button" onClick={cancel}>Test abbrechen</button>:view.phase==='confirm'?<><button type="button" onClick={close}>Abbrechen</button><button type="button" disabled={!ready} onClick={start}>Bildschirmtest starten</button></>:<><button type="button" onClick={()=>void exportReport('html')}>Bericht herunterladen</button><button type="button" onClick={()=>void exportReport('json')}>JSON herunterladen</button><button type="button" onClick={close}>OK</button></>}</footer>
 </dialog>;
}
