import {useState} from 'react';
import {useWorkspaceLayout} from './useWorkspaceLayout';

const areas=[['list_alt','Ablauf','service-order'],['music_note','Song','song-editor'],['edit_square','Folie','production-workspace'],['preview','Vorschau','production-workspace']] as const;
export function MobileWorkspaceNav(){
  const layout=useWorkspaceLayout(),[active,setActive]=useState('Ablauf');
  if(layout==='desktop')return null;
  return <nav className="mobile-workspace-nav" aria-label="Arbeitsbereiche">{areas.map(([icon,label,target])=><button key={label} type="button" aria-current={active===label?'page':undefined} onClick={()=>{setActive(label);document.querySelector<HTMLElement>(`.${target}`)?.scrollIntoView({behavior:'smooth',block:'start'})}}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>;
}
