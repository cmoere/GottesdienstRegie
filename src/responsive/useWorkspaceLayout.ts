import {useEffect,useState} from 'react';
export type WorkspaceLayout='desktop'|'tablet'|'phone';
export const layoutForWidth=(width:number):WorkspaceLayout=>width<600?'phone':width<1100?'tablet':'desktop';
export function useWorkspaceLayout(){
  const [layout,setLayout]=useState<WorkspaceLayout>(()=>layoutForWidth(innerWidth));
  useEffect(()=>{const update=()=>setLayout(layoutForWidth(innerWidth));addEventListener('resize',update);return()=>removeEventListener('resize',update)},[]);
  return layout;
}
