export interface RadioStation{id:string;name:string;streamUrl:string;country:string;language:string;tags:string[];codec:string;bitrate:number;artworkUrl:string;homepage:string}
export function normalizeRadioStation(value:Record<string,unknown>):RadioStation|null{try{const streamUrl=String(value.url_resolved??value.url??''),url=new URL(streamUrl);if(url.protocol!=='https:'||Number(value.lastcheckok??1)!==1)return null;const id=String(value.stationuuid??'').trim(),name=String(value.name??'').trim();if(!id||!name)return null;return{id,name,streamUrl:url.toString(),country:String(value.country??''),language:String(value.language??''),tags:String(value.tags??'').split(',').map(x=>x.trim()).filter(Boolean),codec:String(value.codec??''),bitrate:Math.max(0,Number(value.bitrate??0)||0),artworkUrl:safeHttps(value.favicon),homepage:safeHttps(value.homepage)}}catch{return null}}

function safeHttps(value:unknown){try{const url=new URL(String(value??''));return url.protocol==='https:'?url.toString().replace(/\/$/,''):''}catch{return''}}

export const RADIO_BROWSER_HOSTS=['https://de1.api.radio-browser.info','https://all.api.radio-browser.info'];
export async function discoverRadioBrowserHosts(fetcher:typeof fetch=fetch){
  const response=await fetcher('https://all.api.radio-browser.info/json/servers',{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const servers=await response.json() as {name?:string}[];
  return [...new Set(servers.map(server=>String(server.name??'').trim()).filter(name=>/^[a-z0-9.-]+\.radio-browser\.info$/i.test(name)).map(name=>`https://${name}`))];
}
export async function searchRadioStations(query:string,fetcher:typeof fetch=fetch,hosts?:readonly string[]){
  let candidates=hosts;
  if(!candidates)try{candidates=await discoverRadioBrowserHosts(fetcher)}catch{candidates=RADIO_BROWSER_HOSTS}
  let lastError:unknown;
  for(const host of candidates.length?candidates:RADIO_BROWSER_HOSTS)try{
    const response=await fetcher(`${host}/json/stations/search?hidebroken=true&limit=40&order=clickcount&reverse=true&name=${encodeURIComponent(query.trim())}`,{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json() as Record<string,unknown>[];
    return data.map(normalizeRadioStation).filter((item):item is RadioStation=>Boolean(item));
  }catch(error){lastError=error}
  throw lastError instanceof Error?lastError:new Error('Radiosuche nicht erreichbar');
}

