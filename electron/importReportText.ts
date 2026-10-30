import templates from '../shared/regional/importWarningTemplates.json';
import type {NativeRegionalTextKey} from '../shared/regional/nativeBase';
type Copy=(key:NativeRegionalTextKey,values?:Record<string,string|number>)=>string;
const entries=Object.entries(templates) as Array<[keyof typeof templates,string]>;
const escapePattern=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/** Translate the report's operator display, never the persisted import report or slides. */
export function localizeImportWarning(warning:string,copy:Copy):string{
 for(const [key,template] of entries){
  if(warning===template)return copy(key);
  if(!template.includes('{slide}'))continue;
  const pattern=template.split('{slide}').map(escapePattern).join('(\\d+)');
  const match=new RegExp('^'+pattern+'$','u').exec(warning);
  if(match)return copy(key,{slide:match[1]});
 }
 // Third-party/imported descriptions are document data, not authored system captions.
 return warning;
}
