import {beforeEach,expect,it} from 'vitest';
import {createServiceItem,usePresentation,finishLiveCountdown,firstServiceContentTarget} from './store';

beforeEach(()=>usePresentation.getState().newDocument('Countdown'));
it('takes the first enabled service content after an arrival countdown, not the next warmup item',()=>{
 const countdown=createServiceItem('countdown',{id:'count',sectionId:'warmup'}),
  warmup=createServiceItem('content',{id:'later-warmup',sectionId:'warmup'}),
  disabled=createServiceItem('content',{id:'disabled',sectionId:'service',enabled:false,order:0}),
  first=createServiceItem('content',{id:'first',sectionId:'service',order:1});
 usePresentation.setState({items:[countdown,warmup,disabled,first],onAir:true,liveItemId:countdown.id,liveSlideId:countdown.slides[0].id});
 expect(firstServiceContentTarget(usePresentation.getState())).toEqual({itemId:first.id,slideId:first.slides[0].id});
 finishLiveCountdown(countdown.id,countdown.slides[0].id);
 expect(usePresentation.getState().liveItemId).toBe(first.id);
});
it('ignores completion from an old countdown or while OFF AIR',()=>{
 const countdown=createServiceItem('countdown',{sectionId:'warmup'}),first=createServiceItem('content',{sectionId:'service'});
 usePresentation.setState({items:[countdown,first],onAir:false,liveItemId:countdown.id,liveSlideId:countdown.slides[0].id});
 finishLiveCountdown(countdown.id,countdown.slides[0].id);
 expect(usePresentation.getState().liveItemId).toBe(countdown.id);
 usePresentation.setState({onAir:true,liveItemId:first.id,liveSlideId:first.slides[0].id});
 finishLiveCountdown(countdown.id,countdown.slides[0].id);
 expect(usePresentation.getState().liveItemId).toBe(first.id);
});
