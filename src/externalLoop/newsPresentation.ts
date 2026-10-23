import type {NewsEntry} from '../../shared/externalLoop';
import {wrapEventText} from '../eventPagination';
import {prepareEventScrollPlan} from '../eventScroll';
export type NewsLine={kind:'title'|'body';text:string;height:number};
export function prepareNewsPresentation(entries:NewsEntry[],durationSeconds:number){
 let total=0;
 const stories=entries.map(entry=>{
  const width=entry.imageDataUrl?910:1770;
  const make=(text:string,kind:'title'|'body',size:number,height:number):NewsLine[]=>text.split('\n').flatMap((paragraph,index)=>wrapEventText(paragraph,width,size).map((line,lineIndex,lines)=>({kind,text:line+(lineIndex===lines.length-1&&index<text.split('\n').length-1?'\n':''),height})));
  const lines=[...make(entry.title,'title',64,80),...(entry.description?make(entry.description,'body',38,54):[])];
  const pages:NewsLine[][]=[];let page:NewsLine[]=[],height=0;
  for(const line of lines){if(height+line.height>760&&page.length){pages.push(page);page=[];height=0}page.push(line);height+=line.height}if(page.length)pages.push(page);
  const plan=prepareEventScrollPlan({contentHeight:lines.reduce((sum,line)=>sum+line.height,0)+28,viewportHeight:760,roundTrip:true});
  const readingMs=(entry.title+' '+(entry.description??'')).split(/\s+/).filter(Boolean).length*350+4000;
  const durationMs=Math.max(20000,Math.min(86400,Math.max(1,Number.isFinite(durationSeconds)?durationSeconds:20))*1000,readingMs,plan.minDurationMs,pages.length*10000);
  const story={entry,lines,pages,plan,startMs:total,durationMs};total+=durationMs;return story;
 });
 return{stories,minDurationMs:total};
}
export function newsFrameAt(plan:ReturnType<typeof prepareNewsPresentation>,elapsed:number){
 if(!plan.stories.length)return null;const time=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
 const story=plan.stories.find(story=>time<story.startMs+story.durationMs)??plan.stories.at(-1)!;
 return{...story,elapsed:Math.max(0,Math.min(story.durationMs-1,time-story.startMs))};
}
