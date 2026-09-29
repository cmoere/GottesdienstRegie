import type {AnnouncementPlacement, AnnouncementPriority, AnnouncementCategory} from '../loopData';

export type RawAnnouncement={messageId:string;[key:string]:unknown};
export interface PublicAnnouncement {
  id:string; title:string; text:string; category:AnnouncementCategory; priority:AnnouncementPriority;
  validFrom?:string; validUntil?:string; durationMs:number; qrCode:boolean; qrReference?:string;
}

const truthy=(value:unknown)=>value===true||value===1||['true','1','ja','yes','on','öffentlich','oeffentlich','public'].includes(String(value??'').trim().toLowerCase());
const clean=(value:unknown)=>String(value??'').replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi,'').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/javascript\s*:/gi,'').trim();
const date=(value:unknown)=>{if(!value||String(value).trim().toLowerCase()==='bis auf weiteres')return undefined;const result=new Date(String(value));return Number.isNaN(result.getTime())?undefined:result;};
const publicStatus=(value:unknown)=>['öffentlich','oeffentlich','public','published','aktiv','active'].includes(String(value??'').trim().toLowerCase());
const priorities=new Set(['urgent','important','normal']);
const categories=new Set(['general','event','traffic','service','community','info','technical','internal']);

export class AnnouncementService {
  getForPlacement(records:RawAnnouncement[],now=new Date(),placement:AnnouncementPlacement):PublicAnnouncement[]{
    return records.filter(raw=>this.isEligible(raw,now,placement)).map(raw=>this.toPublic(raw)).sort((a,b)=>{
      const rank={urgent:0,important:1,normal:2}; return rank[a.priority]-rank[b.priority]||a.title.localeCompare(b.title,'de');
    });
  }

  isEligible(raw:RawAnnouncement,now:Date,placement:AnnouncementPlacement):boolean{
    if(!raw.messageId||truthy(raw.trash)||!publicStatus(raw.status)||!truthy(raw.messageScreen))return false;
    const config=raw.gottesdienstRegie as {enabled?:unknown;loopTargets?:Record<string,unknown>}|undefined;
    if(!config||!truthy(config.enabled)||!truthy(config.loopTargets?.[placement]))return false;
    const from=date(truthy(raw.saalscreenUseShowFrom)&&raw.showFrom?raw.showFrom:raw.giltAb);
    const until=date(raw.giltBis);
    if((from&&until&&from>until)||(from&&now<from)||(until&&now>until))return false;
    return Boolean(clean(raw.titel)||clean(raw.textMeldung??raw.beschreibung));
  }

  toPublic(raw:RawAnnouncement):PublicAnnouncement{
    const title=clean(raw.titel),text=clean(raw.textMeldung??raw.beschreibung);
    const priority=String(raw.priority??'normal') as AnnouncementPriority;
    const category=String(raw.kategorie??raw.category??'general') as AnnouncementCategory;
    const explicit=Number(raw.displayDurationMs),calculated=Math.min(Math.max((title.length+text.replace(/<[^>]*>/g,'').length)*80+4_000,12_000),180_000);
    const qrCode=truthy(raw.qrCode);
    return {id:raw.messageId,title,text,priority:priorities.has(priority)?priority:'normal',category:categories.has(category)?category:'general',validFrom:String(raw.giltAb??'')||undefined,validUntil:String(raw.giltBis??'')||undefined,durationMs:Number.isFinite(explicit)&&explicit>0?explicit:calculated,qrCode,qrReference:qrCode?raw.messageId:undefined};
  }
}
