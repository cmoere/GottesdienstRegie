import type {RawAnnouncement} from '../community/AnnouncementService';
import {announcementRuns,announcementRunsText} from '../announcementRichText';

export type SpeechSelection={text:string}|{reason:string};
const modes=new Set(['title_description','description','title']);

export function speechPlainText(value:unknown):string {
  if(typeof value!=='string'||value.length>200_000)return '';
  return announcementRunsText(announcementRuns(value))
    .replace(/\[\[|\]\]/g,'')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g,'')
    .replace(/\r\n?/g,'\n').replace(/[^\S\n]+/g,' ')
    .replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

/** Modes come from admin-meldungen.js; the writer already materializes the text. */
export function selectSpeechText(raw:RawAnnouncement):SpeechSelection {
  const nested=raw.durchsageTextMode;
  const nestedMode=nested&&typeof nested==='object'&&!Array.isArray(nested)
    ? (nested as Record<string,unknown>).saalscreen : undefined;
  const value=nestedMode??raw.durchsageTextModeSaalscreen;
  const missing=value===undefined||value===null||value==='';
  if(!missing&&(typeof value!=='string'||!modes.has(value.trim())))
    return {reason:'Die gespeicherte Durchsage-Textauswahl wird nicht unterstützt.'};
  const manual=speechPlainText(raw.textDurchsageManual);
  const hall=speechPlainText(raw.textDurchsageSaalscreen);
  // Current writer: a custom text overrides the selected title/description mode.
  // Legacy records without a mode keep the spec's hall-first compatibility rule.
  const text=missing?(hall||manual):(manual||hall);
  if(!text)return {reason:'Kein gültiger Durchsagetext für den Saal vorhanden.'};
  if([...text].length>10_000)return {reason:'Der Durchsagetext überschreitet 10.000 Zeichen.'};
  return {text};
}
