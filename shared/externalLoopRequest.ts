import type {ExternalRequest} from './externalLoop';
export function readExternalRequest(value:unknown):ExternalRequest|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const input=value as Record<string,unknown>,keys=Object.keys(input);
 if(input.kind==='weather'&&keys.length===4&&typeof input.name==='string'&&input.name.trim().length>0&&input.name.length<=160&&typeof input.latitude==='number'&&Number.isFinite(input.latitude)&&Math.abs(input.latitude)<=90&&typeof input.longitude==='number'&&Number.isFinite(input.longitude)&&Math.abs(input.longitude)<=180)return{kind:'weather',name:input.name,latitude:input.latitude,longitude:input.longitude};
 if(input.kind==='news'&&keys.length===2&&Array.isArray(input.sources)&&input.sources.length<=2&&new Set(input.sources).size===input.sources.length&&input.sources.every(source=>source==='wdr-owl'||source==='westfalen-blatt'))return{kind:'news',sources:[...input.sources]};
 if(input.kind==='football'&&keys.length===3&&['bl1','bl2','bl3'].includes(String(input.league))&&['matchday','upcoming','table'].includes(String(input.mode)))return{kind:'football',league:input.league as 'bl1'|'bl2'|'bl3',mode:input.mode as 'matchday'|'upcoming'|'table'};
 return null;
}
export function externalRequestKey(request:ExternalRequest):string{return request.kind==='weather'?`weather:${request.latitude},${request.longitude}:${request.name}`:request.kind==='news'?`news:${request.sources.slice().sort().join(',')}`:`football:${request.league}:${request.mode}`}
