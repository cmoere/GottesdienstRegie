import {firstServiceContentTarget,nextLiveTarget,type LiveTarget,type Slide,type usePresentation} from './store';
import {annotationTakeId} from './LiveAnnotations';
import {prepareServiceCountdown} from './ServiceCountdownBadge';
import type {NextPreviewPacket} from '../shared/nextPreview';

type PresentationState = ReturnType<typeof usePresentation.getState>;
type Forecast = {revision: number; target: LiveTarget | undefined};

/** Walk the live navigation on a copy, including disabled slides and loop rounds. */
export function remoteUpcomingSlides(state: PresentationState, forecast?: Forecast): NextPreviewPacket<Slide>[] {
 const upcoming: NextPreviewPacket<Slide>[] = [];
 let cursor = state;
 for (let index = 0; index < 4; index++) {
  const currentItem = state.items.find(item => item.id === cursor.liveItemId);
  const countdownEnds = currentItem?.type === 'countdown'
   && (currentItem.sectionId === 'pre' || currentItem.sectionId === 'warmup');
  const target: LiveTarget | undefined = index === 0 && forecast?.revision === state.liveTransitionRevision
   ? forecast.target : countdownEnds ? firstServiceContentTarget(cursor) : nextLiveTarget(cursor);
  if (!target) break;
  const item = state.items.find(entry => entry.id === target.itemId);
  const slide = item?.slides.find(entry => entry.id === target.slideId);
  if (!item || !slide) break;
  upcoming.push({slide, itemTitle: item.title,
   sourceHash: item.metadata.importMode === 'original' ? String(item.metadata.powerPointSourceHash) : undefined});
  cursor = {...cursor, liveItemId: item.id, liveSlideId: slide.id,
   liveLoopRound: target.loopRound ?? cursor.liveLoopRound};
 }
 return upcoming;
}

export function remoteLiveMetadata(state:PresentationState,events:Record<string,unknown>[],forecast?:Forecast){
 const currentItem=state.items.find(item=>item.id===state.liveItemId),current=currentItem?.slides.find(slide=>slide.id===state.liveSlideId)??null;
 const upcoming = remoteUpcomingSlides(state, forecast);
 return{title:state.title,onAir:state.onAir,serviceTime:state.serviceTime,serviceCountdownAtMs:prepareServiceCountdown({enabled:true,sectionId:'pre',eventKey:state.eventLink?.eventKey,date:state.date,serviceTime:state.serviceTime},events),annotationTakeId:annotationTakeId(state),current,upcoming,nextSourceHash:upcoming[0]?.sourceHash,next:upcoming[0]?.slide??null,notes:[currentItem?.notes,current?.notes].filter(Boolean).join('\n\n'),order:state.items.filter(item=>item.enabled&&!item.disabled).sort((a,b)=>a.order-b.order).map(item=>item.title)};
}
