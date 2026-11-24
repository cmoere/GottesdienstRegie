import {useState} from 'react';
import {useI18n} from './i18n';
import {resetLiveView} from './liveViewRecovery';
import {UiIcon} from './icons/UiIcon';
export function LiveViewResetSettings(){const {t}=useI18n(),[reset,setReset]=useState(false);return <section className="settings-group"><h3>{t('liveViewResetTitle')}</h3><p>{t('liveViewResetHelp')}</p><button type="button" onClick={()=>{resetLiveView();setReset(true)}}><UiIcon name="refresh"/>{t('liveViewResetTitle')}</button>{reset&&<p role="status">{t('liveViewResetDone')}</p>}</section>}
