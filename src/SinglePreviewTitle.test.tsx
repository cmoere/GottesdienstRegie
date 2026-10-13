import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {ProductionWorkspace} from './ProductionWorkspace';
import {createServiceItem,usePresentation} from './store';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('places the preview title outside the rendered output surface',()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 Element.prototype.scrollIntoView=()=>{};
 const item=createServiceItem('content',{id:'title-test',sectionId:'service'});
 item.slides[0].title='Begrüßungstitel';
 usePresentation.setState({items:[item],mode:'preview',previewLayout:'single',onAir:false,previewItemId:item.id,previewSlideId:item.slides[0].id});
 const {container}=render(<ProductionWorkspace canEdit/>);
 const title=screen.getByRole('heading',{name:'Begrüßungstitel'});
 expect(title.closest('.main-preview-surface')).toBeNull();
 expect(title.compareDocumentPosition(container.querySelector('.main-preview-surface')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
