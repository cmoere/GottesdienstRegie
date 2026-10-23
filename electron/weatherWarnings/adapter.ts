import type{WeatherLocation}from'../../shared/externalLoop';
import{pointInWarningGeometry,validWarningGeometry,validWeatherWarning,type PublicWeatherWarning,type WeatherWarningReply}from'../../shared/weatherWarnings';
import{readExternalRequest}from'../../shared/externalLoopRequest';
import{fetchBounded}from'../externalLoop/http';
export class WeatherWarningAdapter{
 private readonly cache=new Map<string,WeatherWarningReply>();private readonly pending=new Map<string,Promise<WeatherWarningReply>>();private readonly attempted=new Map<string,number>();private readonly controllers=new Set<AbortController>();private disposed=false;
 constructor(private readonly fetchText=fetchBounded,private readonly now=Date.now){}
 load(location:WeatherLocation):Promise<WeatherWarningReply>{
  const key=`${location.latitude},${location.longitude}`,old=this.pending.get(key);if(old)return old;
  if(this.pending.size>=2)return Promise.resolve({status:'unavailable',fetchedAt:0,warnings:[]});
  const work=this.prepare(location,key).finally(()=>this.pending.delete(key));this.pending.set(key,work);return work;
 }
 private async prepare(location:WeatherLocation,key:string):Promise<WeatherWarningReply>{
  const unavailable:WeatherWarningReply={status:'unavailable',fetchedAt:0,warnings:[]},now=this.now();
  if(this.disposed||!readExternalRequest({kind:'weather',...location})||location.latitude<47||location.latitude>56||location.longitude<5||location.longitude>16)return unavailable;
  const current=this.cache.get(key),alive=(rows:PublicWeatherWarning[])=>rows.filter(row=>Date.parse(row.validFrom)<=now&&Date.parse(row.validUntil)>now);
  if(current&&now-current.fetchedAt<60000)return{...structuredClone(current),warnings:alive(current.warnings)};
  const fallback=():WeatherWarningReply=>current&&now-current.fetchedAt<=120000?{status:'stale',fetchedAt:current.fetchedAt,warnings:alive(current.warnings)}:unavailable;
  if(now-(this.attempted.get(key)??-Infinity)<30000)return fallback();this.attempted.set(key,now);
  while(this.attempted.size>8){const first=this.attempted.keys().next().value!;this.attempted.delete(first);this.cache.delete(first)}
  const controller=new AbortController();this.controllers.add(controller);
  try{
   // DWD WFS 2.0 native geometry filter uses latitude/longitude axis order.
   // CRS:84 explicitly makes the returned GeoJSON longitude/latitude. Verified 24.10.2026.
   const query=new URLSearchParams({service:'WFS',version:'2.0.0',request:'GetFeature',typeNames:'dwd:Warnungen_Gemeinden',outputFormat:'application/json',srsName:'CRS:84',CQL_FILTER:`INTERSECTS(THE_GEOM,POINT(${location.latitude} ${location.longitude}))`,count:'100'});
   const text=await this.fetchText('https://maps.dwd.de/geoserver/dwd/ows?'+query,controller.signal);if(Buffer.byteLength(text)>2097152)throw Error('size');
   const data=JSON.parse(text);if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length>100||typeof data.numberMatched!=='number'||data.numberMatched!==data.features.length)throw Error('partial');
   const warnings=new Map<string,PublicWeatherWarning>();
   const cancelled=new Set(data.features.filter((row:any)=>row.properties?.STATUS==='Actual'&&row.properties?.SCOPE==='Public'&&row.properties?.MSGTYPE==='Cancel').map((row:any)=>row.properties.IDENTIFIER));
   for(const row of data.features){
    const p=row?.properties;if(!p||p.STATUS!=='Actual'||p.SCOPE!=='Public'||!['Alert','Update'].includes(p.MSGTYPE)||p.LANGUAGE!=='de-DE'||cancelled.has(p.IDENTIFIER))continue;
    if(!validWarningGeometry(row.geometry))throw Error('invalid-geometry');
    if(!pointInWarningGeometry(row.geometry,location.longitude,location.latitude))continue;
    const value:PublicWeatherWarning={id:p.IDENTIFIER,event:p.EVENT,headline:p.HEADLINE,description:p.DESCRIPTION,...(p.INSTRUCTION?{instruction:p.INSTRUCTION}:{}),validFrom:p.EFFECTIVE||p.SENT,validUntil:p.EXPIRES,severity:p.SEVERITY,areaName:p.NAME||p.AREADESC,source:'DWD'};
    if(!validWeatherWarning(value))throw Error('invalid-warning');
    if(Date.parse(value.validFrom)<=now&&Date.parse(value.validUntil)>now)warnings.set(value.id,value);
   }
   if(warnings.size>30||controller.signal.aborted||this.disposed)throw Error('cancelled');
   const result:WeatherWarningReply={status:'ready',fetchedAt:now,warnings:[...warnings.values()].sort((a,b)=>['Extreme','Severe','Moderate','Minor'].indexOf(a.severity)-['Extreme','Severe','Moderate','Minor'].indexOf(b.severity))};this.cache.set(key,result);return structuredClone(result);
  }catch{return this.disposed?unavailable:fallback()}finally{this.controllers.delete(controller)}
 }
 dispose(){this.disposed=true;for(const c of this.controllers)c.abort();this.controllers.clear();this.cache.clear()}
}
