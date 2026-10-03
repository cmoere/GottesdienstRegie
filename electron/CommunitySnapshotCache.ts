import fs from 'node:fs/promises';
import path from 'node:path';
import type {RawAnnouncement,RawChurchEvent,RawCommunityRecord} from './FirebaseGemeindeService';

export type RawCachedRoom=RawCommunityRecord&{roomId:string};
export type CommunityCachePayload={events:RawChurchEvent[];rooms:RawCachedRoom[];announcements:RawAnnouncement[]};
export type CommunityCacheSnapshot=CommunityCachePayload&{mode:'offline-cache'|'empty'|'error';updatedAt?:number;ageMs?:number};

export class CommunitySnapshotCache{
  constructor(private readonly file:string,private readonly now:()=>number=Date.now){}
  async write(payload:CommunityCachePayload):Promise<void>{
    const value={updatedAt:this.now(),...payload},temporary=`${this.file}.tmp`;
    await fs.mkdir(path.dirname(this.file),{recursive:true});
    await fs.writeFile(temporary,JSON.stringify(value),'utf8');
    await fs.rename(temporary,this.file);
  }
  async read(isValid:(record:RawChurchEvent|RawAnnouncement)=>boolean):Promise<CommunityCacheSnapshot>{
    try{
      const parsed=JSON.parse(await fs.readFile(this.file,'utf8')) as CommunityCachePayload&{updatedAt:number};
      const events=(Array.isArray(parsed.events)?parsed.events:[]).filter(isValid) as RawChurchEvent[];
      const rooms=Array.isArray(parsed.rooms)?parsed.rooms.filter(room=>room&&typeof room==='object'&&typeof room.roomId==='string') as RawCachedRoom[]:[];
      const announcements=(Array.isArray(parsed.announcements)?parsed.announcements:[]).filter(isValid) as RawAnnouncement[];
      return{mode:events.length||rooms.length||announcements.length?'offline-cache':'empty',updatedAt:parsed.updatedAt,ageMs:Math.max(0,this.now()-parsed.updatedAt),events,rooms,announcements};
    }catch(error){
      if((error as NodeJS.ErrnoException).code==='ENOENT'||error instanceof SyntaxError)return{mode:'empty',events:[],rooms:[],announcements:[]};
      return{mode:'error',events:[],rooms:[],announcements:[]};
    }
  }
}
