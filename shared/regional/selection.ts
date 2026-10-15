import {normalizeGermanRegion,type RegionalSelection} from './catalog';

export const regionalBaseLanguages=['de','gsw','en','nl','da','no','sv','fi','fr','it','es','uk','ru','tr','ar','pl','pt-BR'] as const;
const languages:ReadonlySet<string>=new Set(regionalBaseLanguages);
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const record=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);

export function normalizeRegionalSelection(value:unknown):RegionalSelection{
  const source=record(value)?value:{};
  return {
    language:typeof source.language==='string'&&languages.has(source.language)?source.language:'de',
    germanRegion:normalizeGermanRegion(source.germanRegion),
  };
}

export function validateRegionalSelection(value:unknown):RegionalSelection{
  if(!record(value)||Object.keys(value).some(key=>key!=='language'&&key!=='germanRegion')
    ||!own(value,'language')||!own(value,'germanRegion')
    ||typeof value.language!=='string'||!languages.has(value.language)
    ||(value.germanRegion!==null&&normalizeGermanRegion(value.germanRegion)===null)){
    throw new Error('Ungültige regionale Sprachauswahl.');
  }
  return {language:value.language,germanRegion:normalizeGermanRegion(value.germanRegion)};
}

export interface RegionalSettingsBridge{
  read:()=>Promise<RegionalSelection>;
  write:(value:RegionalSelection)=>Promise<RegionalSelection>;
}
