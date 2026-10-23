import type {ExternalPayload,ExternalRequest,ExternalSettings,ExternalSnapshot,NewsSource} from '../../shared/externalLoop';
import type {ServiceItem,Slide} from '../store';
import {prepareEventScrollPlan} from '../eventScroll';
import {eventTextWidth,paginateReducedMotionEvents} from '../eventPagination';

export const EXTERNAL_VIEWPORT_HEIGHT=760;
export function isExternalLoop(item:Pick<ServiceItem,'type'>|null|undefined):boolean{return item?.type==='news'||item?.type==='football'}
export function normalizeExternalSettings(metadata:Record<string,unknown>):ExternalSettings{
 const seconds=Number(metadata.durationSeconds??15),durationSeconds=Number.isFinite(seconds)?Math.min(86400,Math.max(1,seconds)):15;
 if(metadata.externalKind==='football')return{kind:'football',league:['bl1','bl2','bl3'].includes(String(metadata.footballLeague))?metadata.footballLeague as 'bl1'|'bl2'|'bl3':'bl1',mode:['matchday','upcoming','table'].includes(String(metadata.footballMode))?metadata.footballMode as 'matchday'|'upcoming'|'table':'matchday',teamId:Number.isSafeInteger(Number(metadata.footballTeamId))&&Number(metadata.footballTeamId)>0?Number(metadata.footballTeamId):null,durationSeconds};
 const raw=metadata.newsSources===undefined?['westfalen-blatt','wdr-owl']:Array.isArray(metadata.newsSources)?metadata.newsSources:String(metadata.newsSources).split(','),sources=[...new Set(raw.filter((source):source is NewsSource=>source==='westfalen-blatt'||source==='wdr-owl'))];
 const limit=Number(metadata.newsLimit??10);
 return{kind:'news',sources,limit:Number.isFinite(limit)?Math.max(1,Math.min(10,Math.floor(limit))):10,durationSeconds};
}
export function externalSettingsForItem(item:Pick<ServiceItem,'type'|'metadata'>):ExternalSettings{return normalizeExternalSettings({...item.metadata,externalKind:item.type})}
export function requestForExternalItem(item:Pick<ServiceItem,'type'|'metadata'>):ExternalRequest|null{
 if(!isExternalLoop(item))return null;const settings=externalSettingsForItem(item);
 return settings.kind==='news'?{kind:'news',sources:settings.sources}:{kind:'football',league:settings.league,mode:settings.mode};
}
export function visibleExternalPayload(snapshot:ExternalSnapshot,settings:ExternalSettings):ExternalPayload{
 const payload=structuredClone(snapshot.payload);
 if(payload.kind==='news'&&settings.kind==='news')payload.entries=payload.entries.filter(entry=>settings.sources.includes(entry.source)).slice(0,settings.limit);
 if(payload.kind==='football'&&settings.kind==='football'&&settings.teamId!==null)payload.matches=payload.matches.filter(match=>match.home.id===settings.teamId||match.away.id===settings.teamId);
 return payload;
}
export function externalHasContent(snapshot:ExternalSnapshot,settings:ExternalSettings):boolean{
 const payload=visibleExternalPayload(snapshot,settings);return payload.kind==='news'?payload.entries.length>0:payload.mode==='table'?payload.table.length>0:payload.matches.length>0;
}
export function prepareExternalPresentation(snapshot:ExternalSnapshot,settings:ExternalSettings){
 const payload=visibleExternalPayload(snapshot,settings),table=payload.kind==='football'&&payload.mode==='table';
 const titles=payload.kind==='news'?payload.entries.map(entry=>entry.title):table?payload.table.map(row=>row.team.name):payload.matches.map(match=>`${match.home.name} – ${match.away.name}`);
 const rowHeight=payload.kind==='news'?120:table?76:108,titleWidth=table?840:1650,fontSize=table?34:42;
 const overflows=titles.map(title=>Math.max(0,eventTextWidth(title,fontSize,500)-titleWidth)),horizontalOverflow=Math.max(0,...overflows);
 const plan=prepareEventScrollPlan({contentHeight:titles.length*rowHeight,viewportHeight:EXTERNAL_VIEWPORT_HEIGHT,horizontalOverflow,roundTrip:true});
 if(horizontalOverflow>0){
  const visibleRows=Math.max(1,Math.floor(EXTERNAL_VIEWPORT_HEIGHT/rowHeight)),initial=Math.max(0,...overflows.slice(0,visibleRows));
  plan.startPauseMs=Math.max(5000,initial>0?initial/35*1000+10000:5000);
  if(plan.distance>0)plan.travelMs=Math.max(plan.travelMs,plan.distance/Math.max(1,EXTERNAL_VIEWPORT_HEIGHT-rowHeight)*plan.endPauseMs);
  plan.minDurationMs=plan.startPauseMs+plan.travelMs*2+plan.endPauseMs;
 }
 const titleStartsAfterMs=titles.map((_title,index)=>{const distance=Math.max(0,(index+1)*rowHeight-EXTERNAL_VIEWPORT_HEIGHT);return distance>0&&plan.distance>0?plan.startPauseMs+distance/plan.distance*plan.travelMs:0});
 return{payload,plan,rowHeight,titleWidth,fontSize,titleStartsAfterMs,minDurationMs:Math.max(settings.durationSeconds*1000,plan.minDurationMs,Math.ceil(titles.length/2)*10000)};
}
export function externalReducedPages(snapshot:ExternalSnapshot,settings:ExternalSettings){
 const payload=visibleExternalPayload(snapshot,settings),table=payload.kind==='football'&&payload.mode==='table';
 const titles=payload.kind==='news'?payload.entries.map(entry=>entry.title):table?payload.table.map(row=>row.team.name):payload.matches.map(match=>match.home.name+' – '+match.away.name);
 return paginateReducedMotionEvents(titles.map((title,index)=>({title,index})),table?840:1650);
}
export function externalLoopMinimumDuration(snapshot:ExternalSnapshot,settings:ExternalSettings):number{return prepareExternalPresentation(snapshot,settings).minDurationMs}
export function hydrateExternalLoopData(slide:Slide,snapshot:ExternalSnapshot,startedAt:number,settings?:ExternalSettings):Slide{
 return{...structuredClone(slide),elements:slide.elements.map(element=>element.type==='loop'&&element.properties.loopType===snapshot.payload.kind?{...structuredClone(element),properties:{...element.properties,externalSnapshotJson:JSON.stringify(snapshot),externalRevision:snapshot.revision,externalStartedAtMs:startedAt,...(settings?{externalSettingsJson:JSON.stringify(settings)}:{})}}:structuredClone(element))};
}
