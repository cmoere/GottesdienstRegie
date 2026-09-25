export interface PersonalNoteKey{userId:string;presentationId:string;slideId?:string}
export function sanitizeRichNote(value:string){
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
    .replace(/\s+(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,'');
}
export function personalNoteStorageKey(key:PersonalNoteKey){return`gottesdienstregie.personal-note.${encodeURIComponent(key.userId)}.${encodeURIComponent(key.presentationId)}.${encodeURIComponent(key.slideId??'presentation')}`}
export function readPersonalNote(key:PersonalNoteKey){try{return localStorage.getItem(personalNoteStorageKey(key))??''}catch{return''}}
export function writePersonalNote(key:PersonalNoteKey,value:string){localStorage.setItem(personalNoteStorageKey(key),sanitizeRichNote(value).slice(0,5000))}
