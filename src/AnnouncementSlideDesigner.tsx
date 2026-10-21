import {usePresentation,type ServiceItem} from './store';
import {ANNOUNCEMENT_DESIGNS,announcementDesign} from './announcementDesign';
import {ANNOUNCEMENT_CATEGORIES,announcementSettings} from './announcementSettings';
import {useI18n} from './i18n';

const designKeys={classic:'announcementDesignClassic',light:'announcementDesignLight',accent:'announcementDesignAccent',split:'announcementDesignSplit',green:'announcementDesignGreen',silver:'announcementDesignSilver',frame:'announcementDesignFrame',footer:'announcementDesignFooter'} as const;
const categoryKeys={general:'announcementCategoryGeneral',event:'announcementCategoryEvent',traffic:'announcementCategoryTraffic',service:'announcementCategoryService',community:'announcementCategoryCommunity',info:'announcementCategoryInfo',technical:'announcementCategoryTechnical',internal:'announcementCategoryInternal'} as const;

export function AnnouncementSlideDesigner({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const {t}=useI18n();
 const state=usePresentation(),current=state.items.find(entry=>entry.id===item.id)??item,selected=announcementDesign(current.metadata.announcementDesign),settings=announcementSettings(current.metadata);
 function update(patch:Record<string,string|number|boolean>){
  // Save the item-wide preference and every loop element in one history operation.
  state.updateItem(item.id,{metadata:{...current.metadata,...patch},slides:current.slides.map(slide=>({...slide,elements:slide.elements.map(element=>element.type==='loop'?{...element,properties:{...element.properties,...patch}}:element)}))});
 }
 return <section className="announcement-slide-designer"><h4>{t('announcementDesignHeading')}</h4><div className="announcement-design-cards">{ANNOUNCEMENT_DESIGNS.map(design=><button type="button" key={design} disabled={!canEdit} aria-pressed={selected===design} onClick={()=>update({announcementDesign:design})}><span className={`announcement-design-preview announcement-design-${design}`}><strong>Meldung</strong><i/><i/><i/>{settings.qrEnabled&&<b/>}</span><small>{t(designKeys[design])}</small></button>)}</div>
  <fieldset className="announcement-loop-settings" disabled={!canEdit}><legend>{t('announcementLoopHeading')}</legend>
   <label className="announcement-setting-check"><input type="checkbox" checked={settings.qrEnabled} onChange={event=>update({announcementQrEnabled:event.target.checked})}/>{t('announcementQrEnabled')}</label>
   <small>{t('announcementQrHelp')}</small>
   <label>{t('announcementQrSize')}<input type="number" min="120" max="480" step="10" value={settings.qrSize} onChange={event=>update({announcementQrSize:announcementSettings({announcementQrSize:event.target.value}).qrSize})}/></label>
   <label>{t('announcementCategory')}<select value={settings.category} onChange={event=>update({announcementCategory:event.target.value})}><option value="all">{t('announcementAllCategories')}</option>{(Object.keys(ANNOUNCEMENT_CATEGORIES) as Array<keyof typeof categoryKeys>).map(value=><option key={value} value={value}>{t(categoryKeys[value])}</option>)}</select></label>
   <label className="announcement-setting-check"><input type="checkbox" checked={settings.prioritySort} onChange={event=>update({announcementPrioritySort:event.target.checked})}/>{t('announcementPrioritySort')}</label>
   <small>{t('announcementPriorityHelp')}</small>
   <label>{t('announcementMinDuration')}<input type="number" min="1" max="3600" step="1" value={settings.readingSeconds||''} placeholder={t('announcementAutomatic')} onChange={event=>update({announcementReadingSeconds:announcementSettings({announcementReadingSeconds:event.target.value}).readingSeconds})}/></label>
   <small>{t('announcementMinDurationHelp')}</small>
  </fieldset><p>{t('announcementScrollHelp')}</p></section>;
}
