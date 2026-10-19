import {useEffect,useState} from 'react';
import {useI18n} from './i18n';
export function WindowControls(){
  const {t}=useI18n(),[full,setFull]=useState(false);
  useEffect(()=>{const api=(window.desktop as any)?.operator;void api?.fullscreen?.().then(setFull);return api?.onFullscreen?.(setFull)},[]);
  return full?<div className="fullscreen-controls">
    <button aria-label={t('windowMinimize')} onClick={()=>(window.desktop as any)?.operator.control('minimize')}>—</button>
    <button aria-label={t('windowExitFullscreen')} onClick={()=>(window.desktop as any)?.operator.control('restore')}>❐</button>
    <button aria-label={t('windowClose')} onClick={()=>(window.desktop as any)?.operator.control('close')}>×</button>
  </div>:null;
}
