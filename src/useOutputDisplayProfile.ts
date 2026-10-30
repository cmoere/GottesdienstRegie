import {useI18n} from './i18n';
import {useEffect,useState} from 'react';
import {usePresentation,type DisplayRole} from './store';
import type {OutputDisplayProfileState,OutputDisplayRole} from './outputDisplayProfileTypes';

export function useOutputDisplayProfile(){
 const {tx}=useI18n();
 const [warning,setWarning]=useState<{source:string;values?:Record<string,string>}|null>(null);
 useEffect(()=>{
  const bridge=window.desktop?.outputDisplays;if(!bridge)return;
  let disposed=false,ready=false,applying=false;
  let previous=JSON.stringify(usePresentation.getState().displayRoles);
  const report=(value:OutputDisplayProfileState)=>{if(!disposed)setWarning(value.unresolved.length?{source:"Ausgabebildschirm fehlt oder ist nicht eindeutig: {value1}. Bitte die Zuordnung prüfen.",values:{value1:value.unresolved.map(entry=>entry.role.toUpperCase()).join(', ')}}:null)};
  const fail=()=>{if(!disposed)setWarning({source:"Die Bildschirmzuordnung konnte nicht geladen oder gespeichert werden. Bitte in den Einstellungen prüfen."})};
  const restore=async()=>{
   const before=JSON.stringify(usePresentation.getState().displayRoles);
   try{
    const value=await bridge.read();if(disposed)return;
    const state=usePresentation.getState();
    if(JSON.stringify(state.displayRoles)!==before){report(await bridge.write(state.displayRoles));}
    else if(value.profile){
     if(!state.onAir){applying=true;const displayRoles=value.assignments as Record<string,DisplayRole>,main=Object.entries(displayRoles).find(([,role])=>role==='main');usePresentation.setState({displayRoles,mainDisplayId:main?Number(main[0]):undefined});applying=false;}
     report(value);
    }else if(Object.keys(state.displayRoles).length)report(await bridge.write(state.displayRoles));
    previous=JSON.stringify(usePresentation.getState().displayRoles);
   }catch{fail()}finally{ready=true}
  };
  const off=usePresentation.subscribe((state,prior)=>{
   if(ready&&!state.onAir&&prior.onAir)void restore();
   const next=JSON.stringify(state.displayRoles);if(!ready||applying||next===previous)return;
   const old=JSON.parse(previous) as Record<string,DisplayRole>,assignments={...state.displayRoles};previous=next;
   const remaining=new Set(Object.values(assignments)),clearRoles=[...new Set(Object.values(old))].filter(role=>role!=='unused'&&!remaining.has(role as DisplayRole)) as OutputDisplayRole[];
   void bridge.write(assignments,{clearRoles}).then(report).catch(fail);
  });
  const changed=window.desktop?.onDisplaysChanged?.(()=>{void restore()});
  void restore();
  return()=>{disposed=true;off();changed?.()};
 },[]);
 return warning?tx(warning.source,warning.values):'';
}
