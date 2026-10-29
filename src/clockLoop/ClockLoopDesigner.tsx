import {useI18n} from "../i18n";
import {usePresentation,type ServiceItem} from '../store';
import {CLOCK_DESIGNS,normalizeClockSettings,clockSettingsPatch,type ClockSettings} from './model';
import {ClockLoopView} from './ClockLoopView';

const previewDate=new Date(2026,9,23,10,30,15);
export function ClockLoopDesigner({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const {tx}=useI18n();
 const names=[tx("Digital klassisch"),tx("Digital kompakt"),tx("Digital mit Sekunden"),tx("Analog hell"),tx("Analog dunkel"),tx("Analog mit Digitalanzeige")];
 const settings=normalizeClockSettings(item.metadata);
 const change=(patch:Partial<ClockSettings>)=>{
  const metadata={...item.metadata,...clockSettingsPatch({...settings,...patch})};
  usePresentation.getState().updateItem(item.id,{metadata,slides:item.slides.map(slide=>({...slide,elements:slide.elements.map(element=>element.type==='loop'?{...element,properties:{...element.properties,...metadata}}:element)}))});
 };
 return <section className="clock-loop-designer"><h4>{tx("Uhrdesign")}</h4><div className="clock-design-cards">{CLOCK_DESIGNS.map((design,i)=><button type="button" key={design} aria-label={names[i]} aria-pressed={settings.design===design} disabled={!canEdit} onClick={()=>change({design})}><span className="clock-design-tile" aria-hidden="true"><ClockLoopView settings={{...settings,design}} now={previewDate}/></span><small>{names[i]}</small></button>)}</div>
  <fieldset disabled={!canEdit}><legend>{tx("Darstellung")}</legend>
   <label>{tx("Zeitformat")}<select value={settings.hourCycle} onChange={event=>change({hourCycle:event.target.value as ClockSettings['hourCycle']})}><option value="24">{tx("24 Stunden")}</option><option value="12">{tx("12 Stunden (AM / PM)")}</option></select></label>
   <label><input type="checkbox" checked={settings.showSeconds} onChange={event=>change({showSeconds:event.target.checked})}/>{tx("Sekunden anzeigen")}</label>
   <label><input type="checkbox" checked={settings.showDate} onChange={event=>change({showDate:event.target.checked})}/>{tx("Datum anzeigen")}</label>
   <label><input type="checkbox" checked={settings.showWeekday} onChange={event=>change({showWeekday:event.target.checked})}/>{tx("Wochentag anzeigen")}</label>
   <label>{tx("Datumsformat")}<select value={settings.dateFormat} onChange={event=>change({dateFormat:event.target.value as ClockSettings['dateFormat']})}><option value="dmy">23.10.2026</option><option value="day-month">23.10.</option><option value="long">23. Oktober 2026</option><option value="iso">2026-10-23</option></select></label>
   <label>{tx("Ausrichtung")}<select value={settings.align} onChange={event=>change({align:event.target.value as ClockSettings['align']})}><option value="left">{tx("Links")}</option><option value="center">{tx("Mitte")}</option><option value="right">{tx("Rechts")}</option></select></label>
   {(['background','color','accent'] as const).map((key,i)=><label key={key}>{[tx("Hintergrundfarbe"),tx("Textfarbe"),tx("Akzentfarbe")][i]}<input type="color" value={settings[key]} onChange={event=>change({[key]:event.target.value})}/></label>)}
  </fieldset>
 </section>;
}
