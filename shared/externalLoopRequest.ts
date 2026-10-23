import type {ExternalRequest} from './externalLoop';
export function readExternalRequest(value:unknown):ExternalRequest|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const input=value as Record<string,unknown>,keys=Object.keys(input);
 if(input.kind==='news'&&keys.length===2&&Array.isArray(input.sources)&&input.sources.length<=2&&new Set(input.sources).size===input.sources.length&&input.sources.every(source=>source==='wdr-owl'||source==='westfalen-blatt'))return{kind:'news',sources:[...input.sources]};
 if(input.kind==='football'&&keys.length===3&&['bl1','bl2','bl3'].includes(String(input.league))&&['matchday','upcoming','table'].includes(String(input.mode)))return{kind:'football',league:input.league as 'bl1'|'bl2'|'bl3',mode:input.mode as 'matchday'|'upcoming'|'table'};
 return null;
}
export function externalRequestKey(request:ExternalRequest):string{return request.kind==='news'?`news:${request.sources.slice().sort().join(',')}`:`football:${request.league}:${request.mode}`}
