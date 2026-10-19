import {useEffect,useState} from 'react';
import type {ServiceItem} from './store';
import {findMissingFonts,usedPresentationFonts} from './fonts';
import {useI18n} from './i18n';
export function FontAvailabilityWarning({items}:{items:ServiceItem[]}){
 const {t}=useI18n();
 const [result,setResult]=useState<{missing:string[];unchecked:string[]}>({missing:[],unchecked:[]}),key=JSON.stringify(usedPresentationFonts(items));
 useEffect(()=>{let active=true;void findMissingFonts(items).then(result=>{if(active)setResult(result)});return()=>{active=false}},[key]);
 const warning=result.missing.length?t('fontMissing',{fonts:result.missing.join(', ')}):result.unchecked.length?t('fontCheckIncomplete'):'';
 return warning?<span className="font-availability-warning" title={warning}>{warning}</span>:null;
}
