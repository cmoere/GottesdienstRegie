import {firstServiceContentTarget,nextLiveTarget,type LiveTarget,type ServiceItem,type Slide,type usePresentation} from './store';
import {loopDurationMs} from './loopDomain';
import {AppClock} from './community/AppClock';
import {annotationTakeId} from './LiveAnnotations';
import {prepareServiceCountdown} from './ServiceCountdownBadge';
import type {NextPreviewPacket} from '../shared/nextPreview';

type PresentationState = ReturnType<typeof usePresentation.getState>;
type Forecast = {revision: number; target: LiveTarget | undefined; dueAtMs?:number};
type PreviewContext={nowMs?:number;available?:(item:ServiceItem)=>boolean;prepareSlide?:(item:ServiceItem,slide:Slide,index:number,atMs:number)=>Slide|null};

/** Walk the live navigation on a copy, including disabled slides and loop rounds. */
export function remoteUpcomingSlides(state: PresentationState, forecast?: Forecast, context:PreviewContext={}): NextPreviewPacket<Slide>[] {
 const upcoming: NextPreviewPacket<Slide>[] = [];
 let cursor = state;
 let atMs=context.nowMs??AppClock.now().getTime();
 let duration:number|undefined;
 for (let index = 0; index < 4; index++) {
  const currentItem = state.items.find(item => item.id === cursor.liveItemId);
  const countdownEnds = currentItem?.type === 'countdown'
   && (currentItem.sectionId === 'pre' || currentItem.sectionId === 'warmup');
  const loop=currentItem?.itemCategory==='loop';
  atMs=index===0&&forecast?.revision===state.liveTransitionRevision&&forecast.dueAtMs!==undefined?forecast.dueAtMs:atMs+(loop?(duration??loopDurationMs(currentItem)):0);
  const target: LiveTarget | undefined = index === 0 && forecast?.revision === state.liveTransitionRevision
   ? forecast.target : countdownEnds ? firstServiceContentTarget(cursor) : nextLiveTarget(cursor,loop?{items:state.items.filter(item=>(!context.available||context.available(item))&&(currentItem?.sectionId==='post'||item.itemCategory==='loop')),atMs}:undefined);
  if (!target) break;
  const item = state.items.find(entry => entry.id === target.itemId);
  const slide = item?.slides.find(entry => entry.id === target.slideId);
  if (!item || !slide) break;
  const prepared=context.prepareSlide?context.prepareSlide(item,slide,index,atMs):slide;
  if(!prepared)break;
  duration=Number(prepared.timing?.durationSeconds)>0?Number(prepared.timing!.durationSeconds)*1000:loopDurationMs(item);
  upcoming.push({slide:prepared, itemTitle: item.title,lightingColorsAllowed:item.sectionId!=='pre'&&item.sectionId!=='post',
   sourceHash: item.metadata.importMode === 'original' ? String(item.metadata.powerPointSourceHash) : undefined});
  cursor = {...cursor, liveItemId: item.id, liveSlideId: slide.id,
   liveLoopRound: target.loopRound ?? cursor.liveLoopRound};
 }
 return upcoming;
}

export function remoteLiveMetadata(state:PresentationState,events:Record<string,unknown>[],forecast?:Forecast,context:PreviewContext={}){
 const currentItem=state.items.find(item=>item.id===state.liveItemId),current=currentItem?.slides.find(slide=>slide.id===state.liveSlideId)??null;
 const upcoming = remoteUpcomingSlides(state, forecast,context);
 return{title:state.title,onAir:state.onAir,lightingColorsAllowed:currentItem?.sectionId!=='pre'&&currentItem?.sectionId!=='post',serviceTime:state.serviceTime,serviceCountdownAtMs:prepareServiceCountdown({enabled:true,sectionId:'pre',eventKey:state.eventLink?.eventKey,date:state.date,serviceTime:state.serviceTime},events),annotationTakeId:annotationTakeId(state),current,upcoming,nextSourceHash:upcoming[0]?.sourceHash,next:upcoming[0]?.slide??null,notes:[currentItem?.notes,current?.notes].filter(Boolean).join('\n\n'),order:state.items.filter(item=>item.enabled&&!item.disabled).sort((a,b)=>a.order-b.order).map(item=>item.title)};
}
