import {useEffect} from 'react';
import {loadBannerSettings,saveBannerPosition,useBannerSettings} from './useBannerSettings';
export function AnnouncementBannerSettings(){
  const {position,error,ready}=useBannerSettings();useEffect(()=>{void loadBannerSettings()},[]);
  return <section className="settings-group"><h3>MELDUNGSSCREEN-BANNER</h3><p>Freigegebene Bannermeldungen laufen unabhängig im Vor-/Nachprogramm und über Countdowns. Die Einstellung gilt für diesen Regie-PC.</p><label>Position<select value={position} disabled={!ready} onChange={event=>{void saveBannerPosition(event.target.value==='top'?'top':'bottom')}}><option value="bottom">Unten</option><option value="top">Oben</option></select></label>{error&&<p role="alert">{error}</p>}</section>;
}
