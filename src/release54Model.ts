import type {Language} from './preferences';

const SPELLING_LOCALES:Partial<Record<Language,string>>={de:'de-DE',gsw:'de-CH',en:'en-US','pt-BR':'pt-BR'};

export function spellCheckerLanguages(language:Language|string){return[SPELLING_LOCALES[language as Language]??language]}

export function outputRevision(value:unknown){const text=JSON.stringify(value);let hash=2166136261;for(let index=0;index<text.length;index+=1)hash=Math.imul(hash^text.charCodeAt(index),16777619);return hash>>>0}

export function shouldApplyOutputRevision(current:number,incoming:number){return incoming>=current}

export function nextGenerationSeed(prompt:string,scene:string,style:string,variant:number){const source=`${prompt}\u0000${scene}\u0000${style}\u0000${variant}`;let seed=2166136261;for(let index=0;index<source.length;index+=1)seed=Math.imul(seed^source.charCodeAt(index),16777619);return seed>>>0}
