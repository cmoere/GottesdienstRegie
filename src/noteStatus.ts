export const PERSONAL_NOTE_SAVED_MS=5000;
export type NoteStatus='idle'|'saving'|'saved'|'error';
export interface NoteStatusPresentation{icon:'lock'|'sync'|'check_circle'|'error';text:string;animated:boolean}
export function noteStatusPresentation(status:NoteStatus,dotCount=0):NoteStatusPresentation{
  if(status==='saving')return{icon:'sync',text:`Speichert ${'.'.repeat(Math.min(3,Math.max(1,dotCount)))}`,animated:true};
  if(status==='saved')return{icon:'check_circle',text:'Gespeichert',animated:false};
  if(status==='error')return{icon:'error',text:'Speichern fehlgeschlagen',animated:false};
  return{icon:'lock',text:'Diese Notiz ist nur für dich sichtbar.',animated:false};
}
export function noteStatusMessage(status:NoteStatus){return noteStatusPresentation(status).text}
