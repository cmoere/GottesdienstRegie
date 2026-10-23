import {useContext,useSyncExternalStore} from 'react';
import {usePresentation,type ServiceItem} from '../store';
import {ExternalLoopContext} from './context';
import {externalSettingsForItem,requestForExternalItem,externalLoopMinimumDuration} from './model';
import './styles.css';
import {WeatherDesigner} from './WeatherDesigner';

export function ExternalLoopDesigner({item,canEdit=true}:{item:ServiceItem;canEdit?:boolean}){
 const controller=useContext(ExternalLoopContext);
 useSyncExternalStore(controller?.subscribe??(()=>()=>{}),controller?.getVersion??(()=>0));
 const settings=externalSettingsForItem(item),request=requestForExternalItem(item)!;
 const reply=controller?.peek(request),snapshot=reply?.snapshot;
 const minimum=snapshot?externalLoopMinimumDuration(snapshot,settings):settings.durationSeconds*1000;
 const change=(patch:Record<string,string|number|boolean>)=>{
  const metadata={...item.metadata,...patch,externalKind:item.type},next=externalSettingsForItem({...item,metadata});
  const duration=Math.ceil((snapshot?externalLoopMinimumDuration(snapshot,next):next.durationSeconds*1000)/1000);
  usePresentation.getState().updateItem(item.id,{metadata,plannedDuration:duration*1000,autoAdvance:true,timing:{...item.timing,slideDurationSeconds:duration,totalDurationSeconds:duration,autoAdvance:true},slides:item.slides.map(slide=>({...slide,elements:slide.elements.map(element=>element.type==='loop'?{...element,properties:{...element.properties,...metadata}}:element)}))});
 };
 const teams=snapshot?.payload.kind==='football'?snapshot.payload.teams:[];
 return <section className="external-loop-designer">
  {settings.kind==='weather'?<WeatherDesigner settings={settings} canEdit={canEdit} onChange={change}/>:settings.kind==='news'?<fieldset disabled={!canEdit}><legend>Nachrichtenquellen</legend>
   <label><input type="checkbox" checked={settings.sources.includes('westfalen-blatt')} onChange={()=>change({newsSources:settings.sources.length?'':'westfalen-blatt'})}/>Westfalen-Blatt · Bielefeld</label>
   <label>Anzahl Nachrichten<input type="number" min="1" max="10" value={settings.limit} onChange={event=>change({newsLimit:Math.max(1,Math.min(10,Number(event.target.value)||1))})}/></label>
  </fieldset>:<fieldset disabled={!canEdit}><legend>Fußball</legend>
   <label>Liga<select value={settings.league} onChange={event=>change({footballLeague:event.target.value,footballTeamId:0})}><option value="bl1">1. Bundesliga</option><option value="bl2">2. Bundesliga</option><option value="bl3">3. Liga</option></select></label>
   <div className="external-mode-cards">{(['matchday','upcoming','table'] as const).map(mode=><button type="button" aria-pressed={settings.mode===mode} key={mode} onClick={()=>change({footballMode:mode})}><span aria-hidden="true">{mode==='table'?'▤':mode==='upcoming'?'◷':'0 : 0'}</span>{mode==='table'?'Tabelle':mode==='upcoming'?'Kommende Spiele':'Spieltag / Ergebnisse'}</button>)}</div>
   <label>Verein<select value={settings.teamId??0} onChange={event=>change({footballTeamId:Number(event.target.value)})}><option value="0">Alle Vereine</option>{teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
   {settings.teamId!==null&&!teams.some(team=>team.id===settings.teamId)&&<p>Der gewählte Verein ist im aktuellen Datenstand nicht verfügbar.</p>}
  </fieldset>}
  <label>Anzeigedauer in Sekunden<input type="number" min="1" max="86400" disabled={!canEdit} value={settings.durationSeconds} onChange={event=>change({durationSeconds:Math.max(1,Math.min(86400,Number(event.target.value)||1))})}/></label>
  <p>Lesbare Mindestdauer: {Math.ceil(minimum/1000)} Sekunden. {settings.kind==='news'?'Die Anzeigedauer gilt je Nachricht, mindestens 20 Sekunden. Jede Nachricht erscheint einzeln; längere Texte erhalten mehr Zeit.':'Bei Platzmangel wird automatisch gescrollt; die Ausgabe dauert mindestens so lange.'}</p>
  {snapshot?<p>Datenstand: {new Date(snapshot.fetchedAt).toLocaleString('de-DE')}{reply?.status==='stale'?' · Offline / letzter gültiger Stand':''}</p>:<p>Keine gültigen Daten verfügbar. Das Element wird bei der Ausgabe übersprungen.</p>}
 </section>;
}
