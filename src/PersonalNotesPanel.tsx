import { useEffect, useRef, useState } from 'react';
import { readPersonalNote, writePersonalNote, type PersonalNoteKey } from './personalNotes';

export function PersonalNotesPanel({noteKey,label}:{noteKey:PersonalNoteKey;label:string}){
  const identity=JSON.stringify(noteKey),[value,setValue]=useState(()=>readPersonalNote(noteKey)),[status,setStatus]=useState<'idle'|'saving'|'saved'|'error'>('idle'),timer=useRef<number|undefined>(undefined);
  useEffect(()=>{setValue(readPersonalNote(noteKey));setStatus('idle');return()=>{if(timer.current)clearTimeout(timer.current)}},[identity]);
  const change=(next:string)=>{setValue(next);setStatus('saving');if(timer.current)clearTimeout(timer.current);const captured={...noteKey};timer.current=window.setTimeout(()=>{try{writePersonalNote(captured,next);setStatus('saved')}catch{setStatus('error')}},500)};
  return <details className="personal-notes"><summary>{label}</summary><textarea value={value} maxLength={50000} onChange={event=>change(event.target.value)} placeholder="Nur für mich auf diesem Gerät …"/><small>{status==='saving'?'Speichert …':status==='saved'?'Gespeichert':status==='error'?'Lokales Speichern fehlgeschlagen':'Privat · nicht synchronisiert · nicht in Ausgaben sichtbar'}</small></details>
}
