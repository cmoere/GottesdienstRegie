import {useEffect,useState} from 'react';
import {create} from 'zustand';
export const useSpeechStatus=create<{active:boolean;message:string;testing:boolean}>(()=>({active:false,message:'',testing:false}));
export function AnnouncementIndicator(){return <svg className="announcement-speaker-indicator" role="img" aria-label="Durchsage läuft" viewBox="0 0 24 24"><path d="M3 9h4l5-4v14l-5-4H3Z" fill="currentColor"/><path d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
export function useOutputAnnouncementActive(){
 const [active,setActive]=useState(false);
 useEffect(()=>{
  let disposed=false,revision=-1;const bridge=window.desktop?.announcements;
  const receive=(state:{revision:number;active:boolean})=>{if(!disposed&&Number.isSafeInteger(state?.revision)&&state.revision>revision&&typeof state.active==='boolean'){revision=state.revision;setActive(state.active)}};
  const off=bridge?.onIndicator?.(receive);void bridge?.getIndicator?.().then(receive).catch(()=>{});
  return()=>{disposed=true;off?.()};
 },[]);
 return active;
}
