import type {ServiceItem} from './store';
import {isLoopCandidateAvailable} from './nowPlayingModel';
import {isPostProgramSystemItem} from './postProgramSystemSlide';

// The system page belongs to the full post-program, not a separate loop-only playlist.
export function postProgramCandidates(items:ServiceItem[],noticeReady:boolean){
 return items.filter(item=>item.sectionId==='post'&&isLoopCandidateAvailable(item)&&(!isPostProgramSystemItem(item)||noticeReady)&&item.slides.some(slide=>slide.enabled)).sort((a,b)=>a.order-b.order);
}
export function unavailablePostProgramTarget(items:ServiceItem[]){
 const post=postProgramCandidates(items,false)[0];
 if(post)return{itemId:post.id,slideId:post.slides.find(slide=>slide.enabled)!.id};
 const service=items.filter(item=>item.sectionId==='service'&&isLoopCandidateAvailable(item)).sort((a,b)=>a.order-b.order).flatMap(item=>item.slides.filter(slide=>slide.enabled).map(slide=>({itemId:item.id,slideId:slide.id})));
 return service.at(-1);
}
