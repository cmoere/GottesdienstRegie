import type{WeatherPayload}from'../../shared/externalLoop';
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'});
const dayKey=(time:number)=>dayFormat.format(new Date(time));
export function selectWeatherForecast(payload:WeatherPayload){
 const start=Date.parse(payload.observedAt),hourStart=Math.floor(start/3600000)*3600000;
 const hours=[2,4,6,8,10,12].flatMap(offset=>{const target=hourStart+offset*3600000;const found=payload.hourly?.find(hour=>Date.parse(hour.time)===target);return found?[found]:[]});
 const today=dayKey(start),next=new Date(today+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const tomorrow=payload.days.find(day=>dayKey(Date.parse(day.date))===next.toISOString().slice(0,10));
 return{hours,tomorrow};
}
