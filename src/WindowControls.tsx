import {useEffect,useState} from 'react';
import {useI18n} from './i18n';
import {UiIcon} from './icons/UiIcon';
export function WindowControls(){
  const {t}=useI18n(),[full,setFull]=useState(false);
  useEffect(()=>{const api=(window.desktop as any)?.operator;void api?.fullscreen?.().then(setFull);return api?.onFullscreen?.(setFull)},[]);
  return full?<div className="fullscreen-controls">
    <button aria-label={t('windowMinimize')} onClick={()=>(window.desktop as any)?.operator.control('minimize')}><UiIcon name="remove"/></button>
    <button aria-label={t('windowExitFullscreen')} onClick={()=>(window.desktop as any)?.operator.control('restore')}><UiIcon name="minimize"/></button>
    <button aria-label={t('windowClose')} onClick={()=>(window.desktop as any)?.operator.control('close')}><UiIcon name="close"/></button>
  </div>:null;
}
