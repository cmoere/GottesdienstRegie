export const CLOCK_DESIGNS=['digital-classic','digital-compact','digital-seconds','analog-light','analog-dark','analog-digital'] as const;
export type ClockDesign=typeof CLOCK_DESIGNS[number];
export interface ClockSettings{design:ClockDesign;hourCycle:'12'|'24';showSeconds:boolean;showDate:boolean;showWeekday:boolean;dateFormat:'dmy'|'day-month'|'long'|'iso';align:'left'|'center'|'right';background:string;color:string;accent:string}
const bool=(value:unknown,fallback:boolean)=>typeof value==='boolean'?value:fallback;
const color=(value:unknown,fallback:string)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
export function normalizeClockSettings(value:Record<string,unknown>):ClockSettings{
 return{design:CLOCK_DESIGNS.includes(value.clockDesign as ClockDesign)?value.clockDesign as ClockDesign:'digital-classic',hourCycle:value.clockHourCycle==='12'?'12':'24',showSeconds:bool(value.clockShowSeconds,value.format!=='HH:mm'),showDate:bool(value.clockShowDate,true),showWeekday:bool(value.clockShowWeekday,true),dateFormat:['dmy','day-month','long','iso'].includes(String(value.clockDateFormat))?value.clockDateFormat as ClockSettings['dateFormat']:'dmy',align:['left','center','right'].includes(String(value.clockAlign))?value.clockAlign as ClockSettings['align']:'center',background:color(value.clockBackground,'#ffffff'),color:color(value.clockColor,'#000000'),accent:color(value.clockAccent,'#608f9a')};
}
export function clockSettingsPatch(value:ClockSettings):Record<string,string|number|boolean>{
 return{clockDesign:value.design,clockHourCycle:value.hourCycle,clockShowSeconds:value.showSeconds,clockShowDate:value.showDate,clockShowWeekday:value.showWeekday,clockDateFormat:value.dateFormat,clockAlign:value.align,clockBackground:value.background,clockColor:value.color,clockAccent:value.accent};
}
const pad=(value:number)=>String(value).padStart(2,'0');
export function clockDateText(value:ClockSettings,now:Date){
 const day=pad(now.getDate()),month=pad(now.getMonth()+1),year=now.getFullYear();
 const date=value.dateFormat==='iso'?year+'-'+month+'-'+day:value.dateFormat==='long'?day+'. '+now.toLocaleDateString('de-DE',{month:'long'})+' '+year:value.dateFormat==='day-month'?day+'.'+month+'.':day+'.'+month+'.'+year;
 return (value.showWeekday?['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'][now.getDay()]+', ':'')+date;
}
export function clockTimeText(value:ClockSettings,now:Date){
 const hours=now.getHours();return pad(value.hourCycle==='12'?(hours%12||12):hours)+':'+pad(now.getMinutes())+(value.showSeconds?':'+pad(now.getSeconds()):'')+(value.hourCycle==='12'?(hours<12?' AM':' PM'):'');
}
