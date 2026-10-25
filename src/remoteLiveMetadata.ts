import {nextLiveTarget,type usePresentation} from './store';
import {annotationTakeId} from './LiveAnnotations';
import {prepareServiceCountdown} from './ServiceCountdownBadge';
export function remoteLiveMetadata(state:ReturnType<typeof usePresentation.getState>,events:Record<string,unknown>[]){
 const currentItem=state.items.find(item=>item.id===state.liveItemId),current=currentItem?.slides.find(slide=>slide.id===state.liveSlideId)??null,next=nextLiveTarget(state),nextItem=state.items.find(item=>item.id===next?.itemId);
 return{title:state.title,onAir:state.onAir,serviceTime:state.serviceTime,serviceCountdownAtMs:prepareServiceCountdown({enabled:true,sectionId:'pre',eventKey:state.eventLink?.eventKey,date:state.date,serviceTime:state.serviceTime},events),annotationTakeId:annotationTakeId(state),current,next:nextItem?.slides.find(slide=>slide.id===next?.slideId)??null,notes:[currentItem?.notes,current?.notes].filter(Boolean).join('\n\n'),order:state.items.filter(item=>item.enabled&&!item.disabled).sort((a,b)=>a.order-b.order).map(item=>item.title)};
}
