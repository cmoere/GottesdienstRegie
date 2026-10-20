import {useEffect,useState} from 'react';
import {AI_LOADING_VARIANTS,nextLoadingVariant} from './aiGenerationModel';
import {useI18n} from './i18n';

export function AiGenerationStatus({active,error,onRetry,reducedMotion=false}:{active:boolean;error:string;onRetry:()=>void;reducedMotion?:boolean}){
  const {t}=useI18n();
  const [index,setIndex]=useState(0);
  useEffect(()=>{
    if(!active)return;
    const timer=setInterval(()=>setIndex(value=>nextLoadingVariant(value,AI_LOADING_VARIANTS.length)),reducedMotion?2400:900);
    return()=>clearInterval(timer);
  },[active,reducedMotion]);
  if(error)return <div className="ai-status error" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span><button onClick={onRetry}>{t('aiStatusRetry')}</button></div>;
  if(!active)return null;
  const item=AI_LOADING_VARIANTS[index];
  return <div className={`ai-status ${reducedMotion?'reduced-motion':item.id}`} role="status" aria-live="polite"><i/><span>{t('aiStatusCreating',{phase:t(item.labelKey)})}</span></div>;
}
