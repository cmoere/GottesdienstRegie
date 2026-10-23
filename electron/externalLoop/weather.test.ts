import {it,expect} from 'vitest';
import {WeatherAdapter} from './weather';
import {ExternalCache} from './cache';
import {readExternalRequest} from '../../shared/externalLoopRequest';
const now=Date.parse('2026-10-23T12:00:00Z');
const data={current_units:{temperature_2m:'°C',weather_code:'wmo code',wind_speed_10m:'km/h'},daily_units:{temperature_2m_max:'°C',temperature_2m_min:'°C',precipitation_probability_max:'%'},current:{time:1792756800,temperature_2m:12,weather_code:3,wind_speed_10m:8},daily:{time:[1792713600,1792800000,1792886400],weather_code:[3,61,0],temperature_2m_max:[14,12,13],temperature_2m_min:[6,5,4],precipitation_probability_max:[10,70,0]}};
const request={kind:'weather' as const,name:'Bielefeld',latitude:52.0302,longitude:8.5325};
it('normalizes current weather and three days, reuses cache and never loads an external website',async()=>{
 let calls=0;const adapter=new WeatherAdapter({cache:new ExternalCache(null,()=>now),now:()=>now,fetchText:async url=>{calls++;expect(url).toContain('https://api.open-meteo.com/v1/forecast?');expect(url).toContain('timezone=Europe%2FBerlin');return JSON.stringify(data)}});
 const result=await adapter.load(request);expect(result.status).toBe('ready');expect(result.snapshot?.payload).toMatchObject({kind:'weather',location:{name:'Bielefeld',latitude:52.0302,longitude:8.5325},temperature:12,wind:8,days:[{maximum:14,minimum:6,rainProbability:10},{maximum:12,minimum:5,rainProbability:70},{maximum:13,minimum:4,rainProbability:0}]});
 await adapter.load(request);expect(calls).toBe(1);
});
it('rejects bad units, null observations and invalid coordinates instead of inventing conditions',async()=>{
 expect(readExternalRequest(request)).toEqual(request);expect(readExternalRequest({...request,latitude:200})).toBeNull();expect(readExternalRequest({...request,url:'https://localhost'})).toBeNull();
 for(const bad of [{...data,current:{...data.current,temperature_2m:null}},{...data,current_units:{...data.current_units,temperature_2m:'°F'}}]){const adapter=new WeatherAdapter({cache:new ExternalCache(null,()=>now),now:()=>now,fetchText:async()=>JSON.stringify(bad)});expect((await adapter.load(request)).snapshot).toBeNull()}
});
it('rejects stale observations, impossible weather codes and out-of-order forecast dates',async()=>{
 for(const bad of [{...data,current:{...data.current,time:1792670400}},{...data,current:{...data.current,weather_code:4}},{...data,daily:{...data.daily,time:[1792886400,1792800000,1792713600]}}]){
  const adapter=new WeatherAdapter({cache:new ExternalCache(null,()=>now),now:()=>now,fetchText:async()=>JSON.stringify(bad)});expect((await adapter.load(request)).snapshot).toBeNull();
 }
});
it('keeps a bounded offline fallback and resolves only an explicit operator place search',async()=>{
 let clock=now,offline=false,search=0;
 const adapter=new WeatherAdapter({cache:new ExternalCache(null,()=>clock),now:()=>clock,fetchText:async url=>{if(url.includes('geocoding')){search++;return JSON.stringify({results:[{name:'Bielefeld',latitude:52.0302,longitude:8.5325,country:'Deutschland',admin1:'Nordrhein-Westfalen'}]})}if(offline)throw Error('offline');return JSON.stringify(data)}});
 await adapter.load(request);expect(search).toBe(0);expect(await adapter.search('Bielefeld')).toMatchObject([{name:'Bielefeld · Nordrhein-Westfalen · Deutschland',latitude:52.0302,longitude:8.5325}]);
 offline=true;clock+=900001;expect((await adapter.load(request)).status).toBe('stale');clock+=21600001;expect((await adapter.load(request)).snapshot).toBeNull();
});
