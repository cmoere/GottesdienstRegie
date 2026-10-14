import {useEffect,useState} from 'react';
import type {ServiceItem} from './store';
import {findMissingFonts,usedPresentationFonts} from './fonts';
export function FontAvailabilityWarning({items}:{items:ServiceItem[]}){
 const [warning,setWarning]=useState(''),key=JSON.stringify(usedPresentationFonts(items));
 useEffect(()=>{let active=true;void findMissingFonts(items).then(result=>{if(active)setWarning(result.missing.length?'Fehlende Schriftarten: '+result.missing.join(', '):result.unchecked.length?'Schriftprüfung nicht vollständig verfügbar':'')});return()=>{active=false}},[key]);
 return warning?<span className="font-availability-warning" title={warning}>{warning}</span>:null;
}
