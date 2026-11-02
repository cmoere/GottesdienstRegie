import {afterEach,expect,it,vi} from 'vitest';import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {ProductionWorkspace} from './ProductionWorkspace';import {createServiceItem,usePresentation} from './store';import {usePreferences} from './preferences';
const original=usePresentation.getState(),prefs=usePreferences.getState();afterEach(()=>{cleanup();usePresentation.setState(original,true);usePreferences.setState(prefs,true);vi.unstubAllGlobals()});
it('shows a rendered next slide and exposes overview preferences in an outside-dismissible popup',()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});Element.prototype.scrollIntoView=()=>{};usePreferences.setState({language:'de',germanRegion:null});
 const first=createServiceItem('content',{id:'first',body:'Erste Folie'}),next=createServiceItem('content',{id:'next',body:'Gestaltete nächste Folie'});next.slides[0].body='Nur Ersatztext';
 usePresentation.setState({items:[first,next],sections:[{id:'service',title:'Gottesdienst',order:0,type:'service'}],mode:'preview',previewLayout:'grid',onAir:false,previewItemId:first.id,previewSlideId:first.slides[0].id});
 const view=render(<ProductionWorkspace canEdit/>),picture=view.container.querySelector('.preview-next-image');expect(picture?.querySelector('.slide-renderer')).not.toBeNull();expect(picture?.textContent).toContain('Gestaltete nächste Folie');
 fireEvent.click(screen.getByRole('button',{name:'Einstellungen'}));const dialog=screen.getByRole('dialog',{name:'Ansichtseinstellungen'});expect(dialog).toContainElement(screen.getByRole('slider',{name:'Thumbnailgröße'}));
 expect(screen.getByRole('checkbox',{name:'Folientitel anzeigen'})).toBeChecked();fireEvent.pointerDown(document.body);expect(screen.queryByRole('dialog')).toBeNull();
 expect(usePresentation.getState().liveSlideId).toBe(original.liveSlideId);
});
