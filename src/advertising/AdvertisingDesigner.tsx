import {usePresentation,type ServiceItem} from '../store';
import {adSelectionForItem,advertisingSlide} from './model';
export function AdvertisingDesigner({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const settings=adSelectionForItem(item);return <div className="content-context automatic-loop-content-editor"><header><b>{item.title}</b><span>Automatisch</span></header><section className="automatic-loop-settings web-editor-fields">
  <h3>Externe Werbung</h3><p>Vorbereitete Werbemedien werden nur im Vor- oder Nachprogramm angezeigt. Laufende Inhalte wechseln erst beim nächsten Take.</p>
  <label>Mindestabstand in Minuten<input type="number" min="1" max="120" disabled={!canEdit} value={settings?.intervalMinutes??5} onChange={event=>usePresentation.getState().updateItem(item.id,{metadata:{...item.metadata,advertisingIntervalMinutes:Math.max(1,Math.min(120,Number(event.target.value)||1))}})}/></label>
  <p>{settings?.source?.kind==='vast'?'Anbieter-Kampagne (VAST)':settings?.source?'Direkte Medienadresse':'Importierte Dateien'} · {settings?.creatives.length??0} Werbemedium/medien</p>
  {settings?.creatives.map((creative,index)=><label key={creative.id}>{creative.title} · Sekunden<input type="number" min="1" max="600" disabled={!canEdit} value={creative.durationSeconds} onChange={event=>{const creatives=settings.creatives.map((entry,i)=>i===index?{...entry,durationSeconds:Math.max(1,Math.min(600,Number(event.target.value)||1))}:entry);usePresentation.getState().updateItem(item.id,{metadata:{...item.metadata,advertisingCreativesJson:JSON.stringify(creatives)},slides:item.slides.map((slide,i)=>i===0?advertisingSlide(slide,creatives[0]):slide)})}}/></label>)}
  <p className="status-ready">Werbetexte und Bilder werden aus dem freigegebenen Medium übernommen.</p>
 </section></div>;
}
