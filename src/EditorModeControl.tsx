import {useI18n} from './i18n';
import {usePresentation} from './store';

export function EditorModeControl(){
 const {t}=useI18n(),mode=usePresentation(state=>state.mode),setMode=usePresentation(state=>state.setMode);
 return <div className={`mode-switch editor-mode-segments ${mode}`} role="group" aria-label={`${t('edit')} / ${t('preview')}`} onKeyDown={event=>{
  const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;
  event.preventDefault();const next=event.key==='ArrowLeft'||event.key==='Home'?'edit':'preview';setMode(next);event.currentTarget.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)?.focus();
 }}>
  <button type="button" data-mode="edit" className={mode==='edit'?'active':''} aria-pressed={mode==='edit'} onClick={()=>setMode('edit')}>{t('edit')}</button>
  <button type="button" data-mode="preview" className={mode==='preview'?'active':''} aria-pressed={mode==='preview'} onClick={()=>setMode('preview')}>{t('preview')}</button>
 </div>;
}
