import {useEffect} from 'react';
import {loadBannerSettings,saveBannerPosition,useBannerSettings} from './useBannerSettings';
import {useI18n} from './i18n';
export function AnnouncementBannerSettings(){
  const {t}=useI18n();
  const {position,error,ready}=useBannerSettings();useEffect(()=>{void loadBannerSettings()},[]);
  return <section className="settings-group"><h3>{t('announcementBannerHeading')}</h3><p>{t('announcementBannerHelp')}</p><label>{t('announcementBannerPosition')}<select value={position} disabled={!ready} onChange={event=>{void saveBannerPosition(event.target.value==='top'?'top':'bottom')}}><option value="bottom">{t('announcementBannerBottom')}</option><option value="top">{t('announcementBannerTop')}</option></select></label>{error&&<p role="alert">{t(error==='load'?'announcementBannerLoadError':'announcementBannerSaveError')}</p>}</section>;
}
