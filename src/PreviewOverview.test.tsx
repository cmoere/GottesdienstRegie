import{cleanup,render,screen}from'@testing-library/react';import{afterEach,expect,it,vi}from'vitest';import{ProductionWorkspace}from'./ProductionWorkspace';import{createServiceItem,usePresentation}from'./store';
import {usePreferences} from './preferences';
const saved=usePresentation.getState(),savedPreferences=usePreferences.getState();afterEach(()=>{cleanup();usePresentation.setState(saved,true);usePreferences.setState(savedPreferences,true);vi.unstubAllGlobals()});
it('uses text-only view switches and separate full captions beside unchanged live/selected semantics',()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});Element.prototype.scrollIntoView=()=>{};
 usePreferences.setState({language:'de',germanRegion:null});
 const item=createServiceItem('content',{id:'overview',sectionId:'service'});item.slides[0].title='Vollständiger langer Folientitel für die Übersicht';
 usePresentation.setState({items:[item],mode:'preview',previewLayout:'grid',onAir:false,previewItemId:item.id,previewSlideId:item.slides[0].id});
 const{container}=render(<ProductionWorkspace canEdit/>);
 for(const name of [/^Einzelvorschau$/i,/^Folienübersicht$/i])expect(screen.getByRole('button',{name}).querySelector('.material-symbols-outlined')).toBeNull();
 expect(container.querySelector('.preview-slide-caption')?.textContent).toBe(item.slides[0].title);expect(container.querySelector('.preview-slide-image')).not.toBeNull();
});
