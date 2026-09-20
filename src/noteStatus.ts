export const PERSONAL_NOTE_SAVED_MS=5000;
export type NoteStatus='idle'|'saving'|'saved'|'error';
export function noteStatusMessage(status:NoteStatus){return status==='saving'?'Speichert …':status==='saved'?'Gespeichert':status==='error'?'Speichern fehlgeschlagen':'Diese Notiz ist nur für dich sichtbar.'}
