import{expect,it}from'vitest';import{selectWeatherForecast}from'./weatherForecast';
const row=(time:string)=>({time,temperature:12,code:3,rainProbability:20});
it('selects +2 hour steps without assuming that the next calendar day is 24 hours long',()=>{
 const payload:any={observedAt:'2026-10-24T22:00:00Z',hourly:Array.from({length:20},(_,i)=>row(new Date(Date.parse('2026-10-24T22:00:00Z')+i*3600000).toISOString())),days:[{date:'2026-10-24T22:00:00Z',maximum:15},{date:'2026-10-25T23:00:00Z',maximum:17}]};
 const selected=selectWeatherForecast(payload);
 expect(selected.hours.map(value=>value.time)).toEqual(['2026-10-25T00:00:00.000Z','2026-10-25T02:00:00.000Z','2026-10-25T04:00:00.000Z','2026-10-25T06:00:00.000Z','2026-10-25T08:00:00.000Z','2026-10-25T10:00:00.000Z']);
 expect(selected.tomorrow?.maximum).toBe(17);
});
it('does not invent missing hourly or tomorrow data',()=>{
 expect(selectWeatherForecast({observedAt:'2026-03-28T23:00:00Z',days:[]} as any)).toEqual({hours:[],tomorrow:undefined});
});
