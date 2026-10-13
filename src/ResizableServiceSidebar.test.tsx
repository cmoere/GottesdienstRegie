import {fireEvent,render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {ResizableServiceSidebar,sidebarWidth} from './ResizableServiceSidebar';
afterEach(cleanup);
it('caps desktop widths at 15 percent even when the usable minimum cannot fit',()=>{
 expect(sidebarWidth(800,1200)).toBe(180);
 expect(sidebarWidth(20,1200)).toBe(144);
 expect(sidebarWidth(800,1920)).toBe(288);
});
it('resizes with the keyboard and restores the personal width without presentation data',()=>{
 localStorage.clear();Object.defineProperty(window,'innerWidth',{configurable:true,value:1920});
 const view=render(<ResizableServiceSidebar><p>Ablauf</p></ResizableServiceSidebar>);
 fireEvent.keyDown(screen.getByRole('separator'),{key:'ArrowLeft'});
 expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow','242');
 view.unmount();render(<ResizableServiceSidebar><p>Ablauf</p></ResizableServiceSidebar>);
 expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow','242');
 expect(localStorage.getItem('gottesdienstregie2.presentation')).toBeNull();
});
it('retains the mobile layout without a desktop separator',()=>{
 Object.defineProperty(window,'innerWidth',{configurable:true,value:500});
 render(<ResizableServiceSidebar><p>Ablauf</p></ResizableServiceSidebar>);
 expect(screen.queryByRole('separator')).toBeNull();
 expect(screen.getByText('Ablauf')).toBeVisible();
});
