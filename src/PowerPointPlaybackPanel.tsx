import {useI18n} from './i18n';
import {usePresentation,type ServiceItem} from './store';
import {usePowerPointStatus} from './powerPointLiveModel';
import {useEffect,useState} from 'react';

export function PowerPointStaticPreview({sourceHash,slideId}:{sourceHash:string;slideId:string|undefined}){
 const {t}=useI18n(),phase=usePowerPointStatus(state=>state.phase),[image,setImage]=useState<{key:string;url:string}|null>(null),key=sourceHash+'/'+slideId;
 useEffect(()=>{let alive=true;const id=Number(slideId);if(!Number.isSafeInteger(id)||id<1)return;void window.desktop?.powerPoint?.thumbnail?.(sourceHash,id).then(url=>{if(alive&&url)setImage({key,url})}).catch(()=>{});return()=>{alive=false}},[key,phase]);
 return <div className="powerpoint-static-preview">{image?.key===key?<img src={image.url} alt={t('powerpointOriginalTitle')}/>:<div><b>{t('powerpointOriginalTitle')}</b><p>{phase==='preparing'?t('powerpointPreparing'):t('powerpointOriginalHint')}</p></div>}</div>;
}

export function PowerPointPlaybackStatus(){
 const {t}=useI18n(),status=usePowerPointStatus();
 if(status.phase==='idle')return null;
 const title=status.phase==='error'?t('powerpointUnavailable'):status.phase==='preparing'?t('powerpointPreparing'):t('powerpointStep',{current:status.clickIndex,total:status.clickCount});
 const reason=status.code.includes('ALREADY_IN_USE')?t('powerpointBusy'):status.code.includes('PROTECTED_VIEW')?t('powerpointProtectedView'):status.code.includes('UNSUPPORTED')?t('powerpointUnsupported'):status.code.includes('SOURCE_MISSING')?t('powerpointSourceMissing'):t('powerpointRequirement');
 return <aside className="powerpoint-playback-status" role="status" data-phase={status.phase}><span>{title}</span>{status.phase==='error'&&<small>{reason}</small>}</aside>;
}

/** Contextual inspector: playback mode is item-owned; its live source stays
 * independent of the currently selected slide or editor fields. */
export function PowerPointPlaybackPanel({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const {t}=useI18n(),onAir=usePresentation(state=>state.onAir),liveItemId=usePresentation(state=>state.liveItemId);
 const hasSource=typeof item.metadata.powerPointSourceHash==='string'&&/^[a-f0-9]{64}$/.test(item.metadata.powerPointSourceHash)&&item.slides.every(slide=>/^\d+$/.test(slide.sourceSlideId??''));
 const original=item.metadata.importMode==='original',locked=!canEdit||onAir&&liveItemId===item.id;
 const change=(mode:'original'|'editable-copy')=>usePresentation.getState().updateItem(item.id,{metadata:{...item.metadata,importMode:mode}});
 return <section className="powerpoint-inspector" aria-label={t('powerpointOriginalTitle')}>
  <header><h2>{t('powerpointOriginalTitle')}</h2><span className="powerpoint-file-label">PowerPoint</span></header>
  <div className="powerpoint-mode-control" role="group" aria-label={t('powerpointOriginalTitle')}>
   <button type="button" aria-pressed={original} disabled={locked||!hasSource||!window.desktop?.powerPoint} onClick={()=>change('original')}>{t('powerpointOriginalPlayback')}</button>
   <button type="button" aria-pressed={!original} disabled={locked} onClick={()=>change('editable-copy')}>{t('powerpointEditableCopy')}</button>
  </div>
  <p>{original?t('powerpointOriginalHint'):t('powerpointEditingHint')}</p>
  <p className="powerpoint-requirement">{hasSource?t('powerpointRequirement'):t('powerpointSourceMissing')}</p>
 </section>;
}
