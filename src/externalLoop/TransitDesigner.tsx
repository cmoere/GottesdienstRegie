import {useI18n} from '../i18n';
import {TRANSIT_DESIGNS,TRANSIT_LINES,TRANSIT_STOP_NAME,type TransitSettings} from '../../shared/transit';
import './transit.css';

export const TRANSIT_DESIGN_LABELS={classic:'Klassisch',board:'Dunkle Abfahrtstafel',clear:'Klar',split:'Zweigeteilt',tiles:'Kacheln',focus:'Großanzeige'} as const;
export function TransitDesigner({settings,canEdit,onChange}:{settings:TransitSettings;canEdit:boolean;onChange:(patch:Record<string,string|number|boolean>)=>void}){
 const {tx}=useI18n();
 return <fieldset className="transit-designer" disabled={!canEdit}>
  <legend>{tx('ÖPNV · Abfahrten')}</legend>
  <p className="transit-restriction">{tx('Beschränkt auf:')} <strong>{TRANSIT_STOP_NAME}</strong>. {tx('Andere Haltestellen sind mit dieser Anbindung nicht verfügbar.')}</p>
  <div className="transit-design-grid" role="group" aria-label={tx('Design auswählen')}>
   {TRANSIT_DESIGNS.map(design=><button type="button" aria-pressed={settings.design===design} key={design} onClick={()=>onChange({transitDesign:design})}>
    <span className="transit-design-swatch" data-design={design} aria-hidden="true"><i/><i/><i/><i/></span>{tx(TRANSIT_DESIGN_LABELS[design])}
   </button>)}
  </div>
  <label>{tx('Anzahl Abfahrten')}<input type="number" min="4" max="24" value={settings.limit} onChange={event=>onChange({transitLimit:Math.max(4,Math.min(24,Number(event.target.value)||4))})}/></label>
  {settings.design!=='focus'&&<label>{tx('Abfahrten pro Seite')}<select value={settings.rows} onChange={event=>onChange({transitRows:Number(event.target.value)})}>{[4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
  {settings.design==='focus'&&<p>{tx('Die Großanzeige zeigt zwei Abfahrten pro Seite.')}</p>}
  <div className="transit-line-options" role="group" aria-label={tx('Linien auswählen')}>{TRANSIT_LINES.map(line=><label key={line}><input type="checkbox" checked={settings.lines.includes(line)} onChange={event=>onChange({transitLines:TRANSIT_LINES.filter(candidate=>candidate===line?event.target.checked:settings.lines.includes(candidate)).join(',')})}/>{line}</label>)}</div>
  {!settings.lines.length&&<p role="status">{tx('Mindestens eine Linie auswählen. Ohne Linie wird die Folie übersprungen.')}</p>}
  {([
   ['transitShowPlatform','Gleis / Steig anzeigen',settings.showPlatform],
   ['transitShowRealtime','Prognose und Verspätung anzeigen',settings.showRealtime],
   ['transitShowVia','Fahrweg anzeigen',settings.showVia],
   ['transitShowMessages','Verkehrsmeldungen anzeigen',settings.showMessages],
  ] as const).map(([key,label,checked])=><label key={key}><input type="checkbox" checked={checked} onChange={event=>onChange({[key]:event.target.checked})}/>{tx(label)}</label>)}
  <p>{tx('Die Gehzeit zur Haltestelle beträgt 6 Minuten. Weitere Abfahrten und Verkehrsmeldungen wechseln automatisch. Die Mindestdauer berücksichtigt alle Seiten und Meldungen. Ausfälle bleiben deutlich gekennzeichnet.')}</p>
 </fieldset>;
}
