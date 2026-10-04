import {it,expect,beforeEach} from 'vitest';
import {usePresentation,createServiceItem} from './store';
import {resolveSessionAction} from './liveSession';
import {firstActiveTarget} from './release53Model';
beforeEach(()=>usePresentation.getState().newDocument('Test'));
it('follows section and slide order instead of storage order through the final service slide',()=>{
 const service=createServiceItem('content',{id:'service',sectionId:'service'}),post=createServiceItem('infoCard',{id:'post',sectionId:'post'});
 service.slides=[{...service.slides[0],id:'last',order:1},{...service.slides[0],id:'first',order:0}];
 usePresentation.setState({items:[post,service]});
 usePresentation.getState().goLive('service','first');usePresentation.getState().nextLive();
 expect(usePresentation.getState().liveSlideId).toBe('last');
 usePresentation.getState().nextLive();expect(usePresentation.getState().liveItemId).toBe('post');
});
it('creates an automatic post target when the linked service has no post slides',()=>{
 const service=createServiceItem('content',{id:'service',sectionId:'service'});
 usePresentation.setState({items:[service],eventLink:{eventKey:'linked'}});
 usePresentation.getState().goLive('service',service.slides[0].id);usePresentation.getState().nextLive();
 const state=usePresentation.getState(),live=state.items.find(item=>item.id===state.liveItemId);
 expect(live?.sectionId).toBe('post');
});
it('never replays final-service media in the automatic post entry',()=>{
 const service=createServiceItem('video',{id:'service',sectionId:'service'});
 service.slides[0].elements=[{id:'media',type:'video',name:'Clip',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{src:'clip.mp4',autoplay:true}}];
 usePresentation.setState({items:[service],eventLink:{eventKey:'linked'}});
 usePresentation.getState().goLive('service',service.slides[0].id);usePresentation.getState().nextLive();
 const state=usePresentation.getState(),post=state.items.find(item=>item.id===state.liveItemId)!;
 expect(post.slides[0].elements.some(element=>['video','audio','videoInput','web','loop'].includes(element.type))).toBe(false);
 expect(post.backgroundAudio).toBeUndefined();
 expect(state.saveState).toBe('dirty');
});
it('keeps production ON AIR separate from starting and stopping test output',()=>{
 expect(resolveSessionAction({mode:'normal',onAir:false},'test')).toBe('start');
 expect(resolveSessionAction({mode:'test',onAir:true},'live')).toBe('confirm-production');
 expect(resolveSessionAction({mode:'test',onAir:true},'test')).toBe('stop');
 expect(resolveSessionAction({mode:'normal',onAir:true},'live')).toBe('stop');
});
it('starts at the first ordered slide, regardless of storage order',()=>{
 const later=createServiceItem('content',{id:'later',order:2});
 const first=createServiceItem('content',{id:'first',order:0});
 first.slides=[{...first.slides[0],id:'last-slide',order:1},{...first.slides[0],id:'first-slide',order:0}];
 expect(firstActiveTarget([later,first])).toEqual({itemId:'first',slideId:'first-slide'});
});
it('repeats the ordered post loop without reintroducing disabled items',()=>{
 const first=createServiceItem('infoCard',{id:'first',sectionId:'post',order:0});
 const last=createServiceItem('infoCard',{id:'last',sectionId:'post',order:1});
 usePresentation.setState({items:[last,first]});
 usePresentation.getState().goLive(last.id,last.slides[0].id);
 usePresentation.getState().nextLive();
 expect(usePresentation.getState().liveItemId).toBe(first.id);
});
