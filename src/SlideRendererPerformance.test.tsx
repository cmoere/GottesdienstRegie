import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {SlideRenderer} from './SlideRenderer';
import {createServiceItem} from './store';
afterEach(cleanup);
it('does not rebuild an unchanged thumbnail when its parent updates, but shows actual edits',()=>{
 const slide={...createServiceItem('content',{body:'Vorher'}).slides[0],elements:[]},read=vi.fn(()=> 'Vorher');Object.defineProperty(slide,'body',{enumerable:true,get:read});
 const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>);expect(screen.getByText('Vorher')).toBeTruthy();read.mockClear();view.rerender(<SlideRenderer slide={slide} mode="thumbnail"/>);expect(read).not.toHaveBeenCalled();
 view.rerender(<SlideRenderer slide={{...slide,body:'Nachher'}} mode="thumbnail"/>);expect(screen.getByText('Nachher')).toBeTruthy();
});
