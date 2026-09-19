export interface PersonalNoteKey{userId:string;presentationId:string;slideId?:string}
export function personalNoteStorageKey(key:PersonalNoteKey){return`gottesdienstregie.personal-note.${encodeURIComponent(key.userId)}.${encodeURIComponent(key.presentationId)}.${encodeURIComponent(key.slideId??'presentation')}`}
export function readPersonalNote(key:PersonalNoteKey){try{return localStorage.getItem(personalNoteStorageKey(key))??''}catch{return''}}
export function writePersonalNote(key:PersonalNoteKey,value:string){localStorage.setItem(personalNoteStorageKey(key),value.slice(0,50000))}
