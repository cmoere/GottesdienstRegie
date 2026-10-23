import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {usePresentation,createServiceItem} from '../store';
import {ClockLoopDesigner} from './ClockLoopDesigner';
const saved=usePresentation.getState();
afterEach(()=>{cleanup();usePresentation.setState(saved,true)});
it('offers six actual preview tiles and persists independent clock choices',()=>{
 const document=usePresentation.getState().newDocument('Clock'),item=createServiceItem('clock',{id:'clock',sectionId:'pre',title:'Uhrzeit',body:'',metadata:{format:'HH:mm'}});
 usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id});
 function Editor(){const current=usePresentation(state=>state.items[0]);return <ClockLoopDesigner item={current} canEdit/>}
 render(<Editor/>);
 expect(screen.getAllByRole('button',{pressed:false}).length).toBe(5);
 fireEvent.click(screen.getByRole('button',{name:'Analog mit Digitalanzeige'}));
 fireEvent.change(screen.getByRole('combobox',{name:'Datumsformat'}),{target:{value:'iso'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Sekunden anzeigen'}));
 const state=usePresentation.getState();expect(state.items[0].metadata).toMatchObject({clockDesign:'analog-digital',clockDateFormat:'iso',clockShowSeconds:true});
 state.loadDocument({...document,items:state.items,sections:state.sections});
 expect(usePresentation.getState().items[0].metadata.clockDesign).toBe('analog-digital');
});
