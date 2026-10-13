import type {PublicAnnouncement} from './community/AnnouncementService';
import type {AnnouncementCategory} from './loopData';

export const ANNOUNCEMENT_CATEGORIES:Record<AnnouncementCategory,string>={general:'Allgemein',event:'Veranstaltungen',traffic:'Verkehr',service:'Gottesdienst',community:'Gemeinde',info:'Information',technical:'Technik',internal:'Intern'};
export function announcementSettings(metadata:Record<string,unknown>){
 const category=String(metadata.announcementCategory??'all');
 const seconds=Number(metadata.announcementReadingSeconds);
 return {qrEnabled:metadata.announcementQrEnabled!==false,category:Object.hasOwn(ANNOUNCEMENT_CATEGORIES,category)?category as AnnouncementCategory:'all' as const,prioritySort:metadata.announcementPrioritySort!==false,readingSeconds:Number.isFinite(seconds)&&seconds>0?Math.min(3600,Math.max(1,Math.round(seconds))):0};
}
// Eligibility is owned exclusively by AnnouncementService; these are operator preferences.
export function configuredAnnouncements(rows:PublicAnnouncement[],metadata:Record<string,unknown>):PublicAnnouncement[]{
 const settings=announcementSettings(metadata),filtered=rows.filter(row=>settings.category==='all'||row.category===settings.category);
 const rank={urgent:0,important:1,normal:2};
 return filtered.sort((a,b)=>(settings.prioritySort?rank[a.priority]-rank[b.priority]:0)||a.title.localeCompare(b.title,'de'));
}
