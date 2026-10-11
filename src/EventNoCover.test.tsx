import {render,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {SlideRenderer} from './SlideRenderer';
import {createServiceItem} from './store';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('never renders event cover images, including the existing poster design',()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 const slide=createServiceItem('event').slides[0];
 slide.elements=[{id:'events',type:'loop',name:'Events',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{loopType:'event',eventDesign:'poster',eventItemsJson:JSON.stringify([{title:'Gemeindeforum',effectiveStart:'2026-10-10T12:00:00Z',coverUrl:'https://example.invalid/cover.jpg'}])}}];
 const {container}=render(<SlideRenderer slide={slide}/>);
 expect(container.querySelector('.event-title-text')?.textContent).toBe('Gemeindeforum');
 expect(container.querySelector('img')).toBeNull();
});
