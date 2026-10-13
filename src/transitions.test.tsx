import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {TransitionStage} from './transitions';
import {createServiceItem,type Slide} from './store';
afterEach(()=>{cleanup();vi.useRealTimers()});
function page(id:string,text:string):Slide{const slide=createServiceItem('content').slides[0];return {...slide,id,body:text,elements:slide.elements.map(element=>({...element,properties:{...element.properties,text}}))}}
it('updates the entering snapshot immediately when the same slide changes during a two-second transition',()=>{
 vi.useFakeTimers();const transition={type:'crossfade' as const,durationMs:2000,direction:'left' as const,easing:'linear' as const,reverseOnPrevious:true};
 const view=render(<TransitionStage slide={page('old','Vorher')} transition={transition}/>);
 view.rerender(<TransitionStage slide={page('new','Erste Fassung')} transition={transition}/>);
 expect(view.container.querySelector('.entering')?.textContent).toContain('Erste Fassung');
 view.rerender(<TransitionStage slide={page('new','Aktuelle Fassung')} transition={transition}/>);
 expect(view.container.querySelector('.entering')?.textContent).toContain('Aktuelle Fassung');
});
