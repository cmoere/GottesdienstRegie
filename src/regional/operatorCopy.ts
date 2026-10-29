import {germanBaseTemplates,type TranslationKey} from '../i18nBase';
import type {RegionalSelection} from '../../shared/regional/catalog';
import {formatRegionalTemplate} from '../../shared/regional/validation';
import {resolveRegionalText} from './resources';

const keysBySource=new Map<string,TranslationKey>();
for(const [key,source]of Object.entries(germanBaseTemplates)){
  if(!keysBySource.has(source))keysBySource.set(source,key as TranslationKey);
}

/** Explicit operator-copy calls only. Never pass presentation, Bible/song,
 * Firebase, imported document or other user content to this resolver.
 * Missing resource registration stays visible to the source inventory and
 * remains German; runtime fallback is not a completeness certificate. */
export function resolveOperatorCopy(selection:RegionalSelection,source:string,values:Record<string,string|number>={}):string{
  const key=keysBySource.get(source);
  return key?resolveRegionalText(selection,key,values):formatRegionalTemplate(source,values);
}
