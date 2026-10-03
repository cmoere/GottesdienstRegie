export type RawRoom=Record<string,unknown>&{roomId?:string};
export interface NormalizedRoom{type:'room';roomId:string;name:string;shortName?:string;floor:string;building:string;capacity?:number;accessible?:boolean}

const containers=new Set(['rooms','raeume','räume','roomlist','room_list']);
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const value=(source:Record<string,unknown>,keys:string[])=>{for(const key of keys){const nested=key.split('.').reduce<unknown>((current,part)=>object(current)?current[part]:undefined,source);if(typeof nested==='string'&&nested.trim())return nested.trim()}return''};
const alias=(input:string)=>input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').replace(/[^a-z0-9]+/g,' ').trim();
const nameKeys=['raumname','raumName','name','label','bezeichnung','titel','displayName','raumkurzname','kurzname','shortName','meta.name','meta.label'];
const idKeys=['id','roomId','raumId','key','__key'];
const roomRecordKeys=new Set(['etage','floor','stockwerk','gebaeude','gebäude','building','haus','kapazitaet','capacity','barrierefrei','accessible','code','slug','aliases','suchbegriffe','searchTerms','meta']);

type Candidate={raw:Record<string,unknown>;childKey:string;path:string};
function flatten(source:unknown,path:string[]=[]):Candidate[]{
  if(Array.isArray(source))return source.flatMap((entry,index)=>flatten(entry,[...path,String(index)]));
  if(!object(source))return[];
  const hasName=Boolean(value(source,nameKeys)),hasExplicitId=Boolean(value(source,idKeys)),hasRoomDetails=Object.keys(source).some(key=>roomRecordKeys.has(key));
  if(hasName||(hasExplicitId&&hasRoomDetails))return[{raw:source,childKey:path.at(-1)??'',path:path.join('/')}];
  return Object.entries(source).flatMap(([key,entry])=>flatten(entry,[...path,key]));
}

export class RoomService{
  readonly roomsById=new Map<string,NormalizedRoom>();
  readonly aliasMap=new Map<string,string>();
  constructor(rooms:unknown=[]){this.setRooms(rooms)}
  setRooms(source:unknown){
    this.roomsById.clear();this.aliasMap.clear();
    for(const candidate of flatten(source)){
      const raw=candidate.raw,explicit=value(raw,idKeys),roomId=(explicit||candidate.childKey).trim();
      if(!roomId||containers.has(roomId.toLocaleLowerCase('de')))continue;
      const name=value(raw,nameKeys)||'Raum',floor=value(raw,['etage','floor','stockwerk']),building=value(raw,['gebaeude','gebäude','building','haus']),shortName=value(raw,['raumkurzname','kurzname','shortName','meta.shortName']),capacity=Number(raw.kapazitaet??raw.capacity),accessible=raw.barrierefrei===true||raw.accessible===true;
      const room:NormalizedRoom={type:'room',roomId,name,...(shortName?{shortName}:{}),floor,building,...(Number.isFinite(capacity)&&capacity>0?{capacity}:{}),accessible};
      this.roomsById.set(roomId,room);
      const lists=[raw.aliases,raw.suchbegriffe,raw.searchTerms].flatMap(entry=>Array.isArray(entry)?entry:[]).map(String);
      const pathAliases=[candidate.path,candidate.path.split('/').filter(part=>!containers.has(part.toLocaleLowerCase('de'))).join('/')];
      for(const entry of [roomId,candidate.childKey,...pathAliases,name,shortName,value(raw,['bezeichnung']),value(raw,['code']),value(raw,['slug']),value(raw,['meta.name']),value(raw,['meta.label']),value(raw,['meta.shortName']),...lists,`${name} ${floor}`,`${floor} ${name}`,`${shortName} ${floor}`,`${name} ${building}`]){
        const key=alias(String(entry??''));if(key&&!this.aliasMap.has(key))this.aliasMap.set(key,roomId);
      }
    }
  }
  resolve(reference:unknown){const raw=String(reference??'').trim(),id=this.roomsById.has(raw)?raw:this.aliasMap.get(alias(raw));return id?this.roomsById.get(id)??null:null}
  display(reference:unknown,extended=true){const room=this.resolve(reference);if(!room)return'Raum';return[room.name,room.floor,extended?room.building:''].filter(Boolean).join(' · ')}
}
