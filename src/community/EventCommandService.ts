export type EventPatchWriter=(eventKey:string,patch:Record<string,string|null>)=>Promise<unknown>|unknown;
const two=(value:number)=>String(value).padStart(2,'0');
const day=(value:Date)=>`${value.getFullYear()}-${two(value.getMonth()+1)}-${two(value.getDate())}`;
const time=(value:Date)=>`${two(value.getHours())}:${two(value.getMinutes())}`;
export class EventCommandService{
  constructor(private readonly write:EventPatchWriter){}
  async updateEffectiveServiceTime(eventKey:string,value:{start:Date;end:Date}){
    if(!eventKey.trim())throw new Error('EVENT_KEY_REQUIRED');
    return this.write(eventKey,{Verspaetungsanfangsdatum:day(value.start),Verspaetungsanfangsuhrzeit:time(value.start),Verspaetungsenddatum:day(value.end),Verspaetungsenduhrzeit:time(value.end)});
  }
}
