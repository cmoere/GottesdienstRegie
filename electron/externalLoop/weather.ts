import {createHash} from 'node:crypto';
import type {ExternalReply,ExternalRequest,WeatherLocation,WeatherPayload,ExternalSnapshot} from '../../shared/externalLoop';
import {externalRequestKey,readExternalRequest} from '../../shared/externalLoopRequest';
import {readExternalSnapshot} from '../../shared/externalLoopValidation';
import type {NewsDependencies} from './news';
type Request=Extract<ExternalRequest,{kind:'weather'}>;
export class WeatherAdapter{
 private readonly pending=new Map<string,Promise<ExternalReply>>();
 private readonly attempted=new Map<string,number>();
 private readonly controllers=new Set<AbortController>();
 private disposed=false;
 constructor(private readonly dependencies:NewsDependencies){}
 private now(){return this.dependencies.now?.()??Date.now()}
 load(request:Request):Promise<ExternalReply>{
  const key=externalRequestKey(request),old=this.pending.get(key);if(old)return old;
  const work=this.prepare(request,key).finally(()=>this.pending.delete(key));this.pending.set(key,work);return work;
 }
 private async prepare(request:Request,key:string):Promise<ExternalReply>{
  const empty:ExternalReply={snapshot:null,status:'unavailable'};
  if(this.disposed||!readExternalRequest(request))return empty;
  const cached=await this.dependencies.cache.read(key,21600000).catch(()=>null);
  if(this.disposed)return empty;
  if(cached&&cached.payload.kind==='weather'&&cached.payload.hourly?.length&&this.now()-cached.fetchedAt<900000)return{snapshot:cached,status:'ready'};
  const stale=():ExternalReply=>cached?{snapshot:{...cached,stale:true},status:'stale'}:empty;
  if(this.now()-(this.attempted.get(key)??-Infinity)<60000)return stale();
  this.attempted.set(key,this.now());while(this.attempted.size>32)this.attempted.delete(this.attempted.keys().next().value!);
  const controller=new AbortController();this.controllers.add(controller);
  try{
   const query=new URLSearchParams({latitude:String(request.latitude),longitude:String(request.longitude),current:'temperature_2m,weather_code,wind_speed_10m',hourly:'temperature_2m,weather_code,precipitation_probability',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:'Europe/Berlin',timeformat:'unixtime',forecast_days:'3',temperature_unit:'celsius',wind_speed_unit:'kmh'});
   const data=JSON.parse(await this.dependencies.fetchText('https://api.open-meteo.com/v1/forecast?'+query,controller.signal));
   if(data.current_units?.temperature_2m!=='°C'||data.current_units?.wind_speed_10m!=='km/h'||data.daily_units?.temperature_2m_max!=='°C'||data.daily_units?.temperature_2m_min!=='°C'||data.daily_units?.precipitation_probability_max!=='%')throw Error('units');
   const iso=(value:unknown)=>{if(typeof value!=='number'||!Number.isFinite(value))throw Error('date');return new Date(value*1000).toISOString()};
   const current=data.current,daily=data.daily;
   const hourly=data.hourly;
   if(data.hourly_units?.temperature_2m!=='°C'||data.hourly_units?.precipitation_probability!=='%'||!Array.isArray(hourly?.time)||hourly.time.length<1||hourly.time.length>96||!['temperature_2m','weather_code','precipitation_probability'].every(key=>Array.isArray(hourly[key])&&hourly[key].length===hourly.time.length))throw Error('hourly');
   const payload:WeatherPayload={kind:'weather',location:{name:request.name,latitude:request.latitude,longitude:request.longitude},observedAt:iso(current.time),temperature:current.temperature_2m,code:current.weather_code,wind:current.wind_speed_10m,hourly:hourly.time.map((time:unknown,index:number)=>({time:iso(time),temperature:hourly.temperature_2m[index],code:hourly.weather_code[index],rainProbability:hourly.precipitation_probability[index]})),days:[0,1,2].map(index=>({date:iso(daily.time[index]),code:daily.weather_code[index],minimum:daily.temperature_2m_min[index],maximum:daily.temperature_2m_max[index],rainProbability:daily.precipitation_probability_max[index]}))};
   const snapshot:ExternalSnapshot={version:1,key,revision:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),fetchedAt:this.now(),stale:false,payload};
   if(!readExternalSnapshot(snapshot,key,this.now()))throw Error('invalid-weather');
   if(this.now()-Date.parse(payload.observedAt)>21600000||Date.parse(payload.observedAt)>this.now()+900000)throw Error('stale-observation');
   if(this.disposed||controller.signal.aborted)return empty;
   await this.dependencies.cache.write(snapshot).catch(()=>{});return{snapshot,status:'ready'};
  }catch{return this.disposed?empty:stale()}finally{this.controllers.delete(controller)}
 }
 async search(query:string):Promise<WeatherLocation[]>{
  if(this.disposed||typeof query!=='string'||query.trim().length<2||query.length>100)return[];
  const controller=new AbortController();this.controllers.add(controller);
  try{
   const data=JSON.parse(await this.dependencies.fetchText('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:query.trim(),count:'8',language:'de',format:'json'}),controller.signal));
   if(this.disposed||!Array.isArray(data.results))return[];
   return data.results.slice(0,8).flatMap((row:any)=>{const value={kind:'weather',name:[row.name,row.admin1,row.country].filter(value=>typeof value==='string'&&value.trim()).join(' · '),latitude:row.latitude,longitude:row.longitude};return readExternalRequest(value)?[{name:value.name,latitude:value.latitude,longitude:value.longitude}]:[]});
  }catch{return[]}finally{this.controllers.delete(controller)}
 }
 dispose(){this.disposed=true;for(const controller of this.controllers)controller.abort();this.controllers.clear();this.pending.clear();this.attempted.clear()}
}
