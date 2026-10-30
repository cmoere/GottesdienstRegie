import {germanBaseTemplates,type TranslationKey} from '../i18nBase';
import type {RegionalSelection} from '../../shared/regional/catalog';
import {formatRegionalTemplate} from '../../shared/regional/validation';
import {resolveRegionalText} from './resources';
import diagnosticTemplates from '../../shared/regional/operatorDiagnosticTemplates.json';

const keysBySource=new Map<string,TranslationKey>();
for(const [key,source]of Object.entries(germanBaseTemplates)){
  if(!keysBySource.has(source))keysBySource.set(source,key as TranslationKey);
}
const escapePattern=(source:string)=>source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Only these reviewed system diagnostics accept captured values. Presentation,
// song/Bible and imported/public content must never enter the operator resolver.
const diagnosticPatterns=diagnosticTemplates.flatMap(template=>{
  const names=[...template.matchAll(/\{([A-Za-z_][\w.-]*)\}/g)].map(match=>match[1]);
  if(!names.length)return [];
  const parts=template.split(/\{[A-Za-z_][\w.-]*\}/g);
  return [{template,names,pattern:new RegExp('^'+parts.map(escapePattern).join('([\\s\\S]+?)')+'$','u')}];
});

/** Explicit operator-copy calls only. Never pass presentation, Bible/song,
 * Firebase, imported document or other user content to this resolver.
 * Missing resource registration stays visible to the source inventory and
 * remains German; runtime fallback is not a completeness certificate. */
export function resolveOperatorCopy(selection:RegionalSelection,source:string,values:Record<string,string|number>={}):string{
  let key=keysBySource.get(source),parameters=values;
  if(!key&&Object.keys(values).length===0){
    const ipc=source.match(/^Error invoking remote method '[^'\r\n]+': (?:Error: )?([\s\S]+)$/);
    const diagnostic=ipc?.[1]??source;
    key=keysBySource.get(diagnostic);
    if(!key)for(const entry of diagnosticPatterns){
      const match=entry.pattern.exec(diagnostic);
      if(!match)continue;
      key=keysBySource.get(entry.template);
      parameters=Object.fromEntries(entry.names.map((name,index)=>[name,match[index+1]]));
      break;
    }
  }
  return key?resolveRegionalText(selection,key,parameters):formatRegionalTemplate(source,values);
}
