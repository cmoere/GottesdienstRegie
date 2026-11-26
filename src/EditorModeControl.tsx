import {useI18n} from './i18n';
import {usePresentation} from './store';

export function EditorModeControl(){
 const {t,locale}=useI18n(),mode=usePresentation(state=>state.mode),setMode=usePresentation(state=>state.setMode);
 const label=(text:string)=>{if(text!==text.toLocaleUpperCase(locale))return text;const chars=Array.from(text.toLocaleLowerCase(locale));return(chars.shift()?.toLocaleUpperCase(locale)??'')+chars.join('')};
 const edit=label(t('edit')),preview=label(t('preview'));
 return <div className={`mode-switch editor-mode-segments ${mode}`} role="group" aria-label={`${edit} / ${preview}`} onKeyDown={event=>{
  const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;
  event.preventDefault();const next=event.key==='ArrowLeft'||event.key==='Home'?'edit':'preview';setMode(next);event.currentTarget.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)?.focus();
 }}>
  <button type="button" data-mode="edit" className={mode==='edit'?'active':''} aria-pressed={mode==='edit'} onClick={()=>setMode('edit')}>{edit}</button>
  <button type="button" data-mode="preview" className={mode==='preview'?'active':''} aria-pressed={mode==='preview'} onClick={()=>setMode('preview')}>{preview}</button>
 </div>;
}
