import {useId} from 'react';
import {normalizeGermanRegion,regionalVariants} from '../../shared/regional/catalog';
import {isRegionalSelectionAvailable} from '../../shared/regional/availability';
import bundledAvailability from '../../shared/regional/availability.json';
import {usePreferences} from '../preferences';
import {useI18n} from '../i18n';

export function RegionalSelector({availability=bundledAvailability}:{availability?:unknown}){
  const id=useId();
  const {language,t}=useI18n();
  const germanRegion=usePreferences(state=>state.germanRegion);
  const setGermanRegion=usePreferences(state=>state.setGermanRegion);
  if(language!=='de'||!isRegionalSelectionAvailable(availability))return null;
  return <label htmlFor={id} className="regional-selector" lang="de-DE">
    {t('germanRegionalVariant')}
    <select id={id} value={germanRegion??''} onChange={event=>setGermanRegion(normalizeGermanRegion(event.target.value))}>
      <option value="">Hochdeutsch</option>
      {regionalVariants.map(region=><option key={region.id} value={region.id}>{region.name}</option>)}
    </select>
  </label>;
}
