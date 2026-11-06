import {useI18n} from './i18n';
import {usePresentation} from './store';
import type {SectionInfoOptions} from '../shared/sectionInfoStrip';

const defaults:SectionInfoOptions={position:'bottom',showTime:true,showSeconds:false,showDate:false,showTitle:false};

export function SectionInfoSettings({canEdit}:{canEdit:boolean}){
 const {t}=useI18n();
 const sections=usePresentation(state=>state.sections);
 const updateSection=usePresentation(state=>state.updateSection);
 return <section className="settings-group section-info-settings">
  <h3>{t('sectionInfoHeading')}</h3>
  {sections.map(section=>{
   const options=section.infoStrip??defaults;
   const update=(patch:Partial<SectionInfoOptions>)=>updateSection(section.id,{infoStrip:{...options,...patch}});
   return <fieldset disabled={!canEdit} key={section.id}>
    <legend>{section.title}</legend>
    <label>{t('sectionInfoPosition')}<select value={section.infoStrip?.position??'off'} onChange={event=>{
     const position=event.target.value;
     if(position==='top'||position==='bottom')update({position});
     else updateSection(section.id,{infoStrip:undefined});
    }}><option value="off">{t('sectionInfoOff')}</option><option value="top">{t('sectionInfoTop')}</option><option value="bottom">{t('sectionInfoBottom')}</option></select></label>
    {section.infoStrip&&<>
     <label><input type="checkbox" checked={options.showTime} onChange={event=>update({showTime:event.target.checked})}/>{t('sectionInfoTime')}</label>
     <label><input type="checkbox" disabled={!options.showTime} checked={options.showSeconds} onChange={event=>update({showSeconds:event.target.checked})}/>{t('sectionInfoSeconds')}</label>
     <label><input type="checkbox" checked={options.showDate} onChange={event=>update({showDate:event.target.checked})}/>{t('sectionInfoDate')}</label>
     <label><input type="checkbox" checked={options.showTitle} onChange={event=>update({showTitle:event.target.checked})}/>{t('sectionInfoTitle')}</label>
    </>}
   </fieldset>;
  })}
 </section>;
}
