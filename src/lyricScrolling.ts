import type { ServiceItem, Slide } from './store';

export interface LyricScrollingSettings { enabled:boolean; durationMs:number; upcomingBlocks:number; upcomingOpacity:number }
export const defaultLyricScrolling:LyricScrollingSettings={enabled:false,durationMs:500,upcomingBlocks:2,upcomingOpacity:0.42};
const bounded=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function lyricSettings(item:ServiceItem,settings?:Partial<LyricScrollingSettings>):LyricScrollingSettings {
  return {enabled:item.type==='song'&&(item.metadata.lyricScrollingMode==='enabled'||(item.metadata.lyricScrollingMode!=='disabled'&&settings?.enabled===true)),durationMs:bounded(settings?.durationMs,500,200,2000),upcomingBlocks:Math.round(bounded(settings?.upcomingBlocks,2,0,2)),upcomingOpacity:bounded(settings?.upcomingOpacity,0.42,0.25,0.75)};
}
export interface LyricScrollPacket { itemId:string; currentId:string; slides:Slide[]; settings:LyricScrollingSettings }
const isLyricPage=(slide:Slide)=>slide.enabled&&!!slide.body.trim()&&!/^(titel|title)(folie| slide)?$/i.test(slide.title.trim());
export function lyricPacket(item:ServiceItem,slide:Slide,settings?:Partial<LyricScrollingSettings>):LyricScrollPacket|undefined {
  const resolved=lyricSettings(item,settings);
  if(!resolved.enabled||!isLyricPage(slide))return;
  if(!item.slides.some(page=>page.id===slide.id&&page.enabled))return;
  return {itemId:item.id,currentId:slide.id,settings:resolved,slides:structuredClone(item.slides.filter(isLyricPage).map(page=>page.id===slide.id?slide:page))};
}
