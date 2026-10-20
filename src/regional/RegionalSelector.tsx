import {useId} from 'react';
import {normalizeReleasedGermanRegion,releaseRegionalVariants} from '../../shared/regional/catalog';
import {getRegionalPartialRelease,isRegionalSelectionAvailable} from '../../shared/regional/availability';
import bundledAvailability from '../../shared/regional/availability.json';
import {usePreferences} from '../preferences';
import {useI18n} from '../i18n';

export function RegionalSelector({availability=bundledAvailability}:{availability?:unknown}){
  const id=useId();
  const noticeId=useId();
  const {language,t}=useI18n();
  const germanRegion=usePreferences(state=>state.germanRegion);
  const setGermanRegion=usePreferences(state=>state.setGermanRegion);
  if(language!=='de'||!isRegionalSelectionAvailable(availability))return null;
  const partial=getRegionalPartialRelease(availability);
  return <div className="regional-selector" lang="de-DE"><label htmlFor={id}>
    {t('germanRegionalVariant')}
    <select id={id} aria-describedby={partial?noticeId:undefined} value={germanRegion??''} onChange={event=>setGermanRegion(normalizeReleasedGermanRegion(event.target.value))}>
      <option value="">Hochdeutsch</option>
      {releaseRegionalVariants.map(region=><option key={region.id} value={region.id}>{region.name}</option>)}
    </select>
  </label>{partial&&<p id={noticeId} role="note">{partial.notice}</p>}</div>;
}
