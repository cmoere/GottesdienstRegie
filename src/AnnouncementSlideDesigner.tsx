import {usePresentation,type ServiceItem} from './store';
import {ANNOUNCEMENT_DESIGNS,ANNOUNCEMENT_DESIGN_LABELS,announcementDesign} from './announcementDesign';

export function AnnouncementSlideDesigner({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const state=usePresentation(),selected=announcementDesign(item.metadata.announcementDesign);
 function select(design:string){
  state.updateItem(item.id,{metadata:{...item.metadata,announcementDesign:design}});
  const element=item.slides[0]?.elements.find(element=>element.type==='loop');
  if(element)state.updateElement(element.id,{properties:{...element.properties,announcementDesign:design}});
 }
 return <section className="announcement-slide-designer"><h4>DESIGN</h4><div className="announcement-design-cards">{ANNOUNCEMENT_DESIGNS.map(design=><button type="button" key={design} disabled={!canEdit} aria-pressed={selected===design} onClick={()=>select(design)}><span className={`announcement-design-preview announcement-design-${design}`}><strong>Meldung</strong><i/><i/><i/><b/></span><small>{ANNOUNCEMENT_DESIGN_LABELS[design]}</small></button>)}</div><p>Lange Meldungen werden vollständig auf mehrere lesbare Seiten verteilt.</p></section>;
}
