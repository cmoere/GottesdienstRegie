export type RawRoom=Record<string,unknown>&{roomId:string};
export interface NormalizedRoom{type:'room';roomId:string;name:string;floor:string;building:string;capacity?:number;accessible?:boolean}
const value=(source:Record<string,unknown>,keys:string[])=>{for(const key of keys){const nested=key.split('.').reduce<unknown>((current,part)=>current&&typeof current==='object'?(current as Record<string,unknown>)[part]:undefined,source);if(typeof nested==='string'&&nested.trim())return nested.trim()}return''};
const alias=(input:string)=>input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').replace(/[^a-z0-9]+/g,' ').trim();

export class RoomService{
  readonly roomsById=new Map<string,NormalizedRoom>();
  readonly aliasMap=new Map<string,string>();
  constructor(rooms:RawRoom[]=[]){this.setRooms(rooms)}
  setRooms(rooms:RawRoom[]){this.roomsById.clear();this.aliasMap.clear();for(const raw of rooms){const roomId=String(raw.roomId??'').trim();if(!roomId)continue;const name=value(raw,['raumname','raumName','name','label','bezeichnung','titel','displayName','meta.name','meta.label'])||'Raum',floor=value(raw,['etage','floor','stockwerk']),building=value(raw,['gebaeude','gebäude','building','haus']),short=value(raw,['raumkurzname','kurzname','shortName']),capacity=Number(raw.kapazitaet??raw.capacity),accessible=raw.barrierefrei===true||raw.accessible===true,room:NormalizedRoom={type:'room',roomId,name,floor,building,...(Number.isFinite(capacity)&&capacity>0?{capacity}:{}),accessible};this.roomsById.set(roomId,room);for(const candidate of [roomId,name,short,`${name} ${floor}`,`${short} ${floor}`]){const key=alias(candidate);if(key&&!this.aliasMap.has(key))this.aliasMap.set(key,roomId)}}}
  resolve(reference:unknown){const raw=String(reference??'').trim(),id=this.roomsById.has(raw)?raw:this.aliasMap.get(alias(raw));return id?this.roomsById.get(id)??null:null}
  display(reference:unknown,extended=true){const room=this.resolve(reference);if(!room)return'Raum';return[room.name,room.floor,extended?room.building:''].filter(Boolean).join(' · ')}
}
