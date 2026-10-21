import {usePresentation,type ServiceItem} from './store';
import {ANNOUNCEMENT_DESIGNS,ANNOUNCEMENT_DESIGN_LABELS,announcementDesign} from './announcementDesign';
import {ANNOUNCEMENT_CATEGORIES,announcementSettings} from './announcementSettings';

export function AnnouncementSlideDesigner({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const state=usePresentation(),current=state.items.find(entry=>entry.id===item.id)??item,selected=announcementDesign(current.metadata.announcementDesign),settings=announcementSettings(current.metadata);
 function update(patch:Record<string,string|number|boolean>){
  // Save the item-wide preference and every loop element in one history operation.
  state.updateItem(item.id,{metadata:{...current.metadata,...patch},slides:current.slides.map(slide=>({...slide,elements:slide.elements.map(element=>element.type==='loop'?{...element,properties:{...element.properties,...patch}}:element)}))});
 }
 return <section className="announcement-slide-designer"><h4>DESIGN</h4><div className="announcement-design-cards">{ANNOUNCEMENT_DESIGNS.map(design=><button type="button" key={design} disabled={!canEdit} aria-pressed={selected===design} onClick={()=>update({announcementDesign:design})}><span className={`announcement-design-preview announcement-design-${design}`}><strong>Meldung</strong><i/><i/><i/>{settings.qrEnabled&&<b/>}</span><small>{ANNOUNCEMENT_DESIGN_LABELS[design]}</small></button>)}</div>
  <fieldset className="announcement-loop-settings" disabled={!canEdit}><legend>Meldungsschleife</legend>
   <label className="announcement-setting-check"><input type="checkbox" checked={settings.qrEnabled} onChange={event=>update({announcementQrEnabled:event.target.checked})}/>QR-Codes anzeigen</label>
   <small>Gilt für alle Meldungsseiten; Freigaben der Quelle bleiben maßgeblich.</small>
   <label>QR-Code-Größe (Pixel bei 1920 × 1080)<input type="number" min="120" max="480" step="10" value={settings.qrSize} onChange={event=>update({announcementQrSize:announcementSettings({announcementQrSize:event.target.value}).qrSize})}/></label>
   <label>Kategorie<select value={settings.category} onChange={event=>update({announcementCategory:event.target.value})}><option value="all">Alle Kategorien</option>{Object.entries(ANNOUNCEMENT_CATEGORIES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label className="announcement-setting-check"><input type="checkbox" checked={settings.prioritySort} onChange={event=>update({announcementPrioritySort:event.target.checked})}/>Nach Priorität sortieren</label>
   <small>Ohne Priorität werden Meldungen alphabetisch sortiert.</small>
   <label>Mindestanzeigedauer (Sekunden)<input type="number" min="1" max="3600" step="1" value={settings.readingSeconds||''} placeholder="Automatisch" onChange={event=>update({announcementReadingSeconds:announcementSettings({announcementReadingSeconds:event.target.value}).readingSeconds})}/></label>
   <small>Leer: automatisch. Lange Meldungen behalten die erforderliche Mindestlesedauer.</small>
  </fieldset><p>Lange Meldungen scrollen langsam und vollständig. Die Anzeigedauer wird bei Bedarf automatisch verlängert; der QR-Code bleibt stehen.</p></section>;
}
