import type{NewsSource}from'./externalLoop';
/** Historical IDs remain parseable, but current reader requests use WB only. */
export function currentNewsSources(value:readonly unknown[]):NewsSource[]{return value.some(source=>source==='westfalen-blatt'||source==='wdr-owl')?['westfalen-blatt']:[]}
export function isCurrentNewsEntry(entry:{source:unknown;url:unknown}){
 if(entry.source!=='westfalen-blatt'||typeof entry.url!=='string')return false;
 try{const url=new URL(entry.url);return url.protocol==='https:'&&!url.username&&!url.password&&(url.hostname==='www.westfalen-blatt.de'||url.hostname==='westfalen-blatt.de')}catch{return false}
}
