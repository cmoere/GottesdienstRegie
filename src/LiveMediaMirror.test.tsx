import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,waitFor} from '@testing-library/react';
import {TransitionStage} from './transitions';
import {createServiceItem,defaultTransition,usePresentation,type Slide} from './store';
import {ProductionWorkspace} from './ProductionWorkspace';
import {liveEngine} from './LiveEngine';
afterEach(()=>{cleanup();delete window.desktop;vi.unstubAllGlobals()});
function video():Slide{const slide=createServiceItem('video').slides[0];return {...slide,elements:[{...slide.elements[0],type:'video',properties:{src:'clip.mp4',autoplay:true,endBehavior:'nextSlide'}}]}}
it('connects both actual live-preview panels to the silent mirror renderer',async()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}unobserve(){}});Element.prototype.scrollIntoView=()=>{};
 usePresentation.getState().newDocument('Live preview');const item=createServiceItem('video'),slide={...video(),itemId:item.id};item.slides=[slide];
 usePresentation.setState({items:[item],onAir:true,mode:'preview',previewLayout:'single',liveItemId:item.id,liveSlideId:slide.id});
 const ended:string[]=[];window.desktop={sendLiveSlide:async()=>true,notifyMediaEnded:(behavior:string)=>{ended.push(behavior)}} as unknown as typeof window.desktop;
 const view=render(<ProductionWorkspace canEdit/>);await act(async()=>{await liveEngine.show(slide)});
 const media=[...view.container.querySelectorAll('video')];expect(media).toHaveLength(2);
 expect(media.every(element=>element.muted)).toBe(true);
 media.forEach(element=>fireEvent.ended(element));expect(ended).toEqual([]);
});
it('plays live preview pictures silently and never advances MAIN on its own',async()=>{
 const ended:string[]=[];window.desktop={notifyMediaEnded:(behavior:string)=>{ended.push(behavior)}} as unknown as typeof window.desktop;
 const view=render(<TransitionStage slide={video()} transition={defaultTransition} renderMode="mirror"/>);
 const media=view.container.querySelector('video')!;
 expect(media.autoplay).toBe(true);
 await waitFor(()=>expect(media.muted).toBe(true));
 expect(media.controls).toBe(false);fireEvent.ended(media);expect(ended).toEqual([]);
});
it('keeps real MAIN audio and its end action enabled',()=>{
 const ended:string[]=[];window.desktop={notifyMediaEnded:(behavior:string)=>{ended.push(behavior)}} as unknown as typeof window.desktop;
 const view=render(<TransitionStage slide={video()} transition={defaultTransition}/>),media=view.container.querySelector('video')!;
 expect(media.autoplay).toBe(true);fireEvent.ended(media);expect(ended).toEqual(['nextSlide']);
});
