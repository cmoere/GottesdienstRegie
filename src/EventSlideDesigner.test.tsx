import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {usePresentation,createServiceItem} from './store';
import {EventSlideDesigner} from './EventSlideDesigner';
import {usePreferences} from './preferences';
afterEach(cleanup);
it('changes overview metadata and loop rendering together in one undo step',()=>{usePreferences.setState({language:'de',germanRegion:null});const item=createServiceItem('nextEvents',{id:'events-test',sectionId:'pre',title:'Termine',body:'',metadata:{}});item.slides[0].elements[0].type='loop';usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id,history:[],editHistory:[]});function Editor(){const current=usePresentation(state=>state.items.find(value=>value.id===item.id)!);return <EventSlideDesigner item={current} canEdit/>}render(<Editor/>);fireEvent.click(screen.getByRole('button',{name:'Karten'}));const current=usePresentation.getState();expect(current.history).toHaveLength(1);expect(current.items[0].metadata.eventDesign).toBe('cards');expect(current.items[0].slides[0].elements.find(element=>element.type==='loop')?.properties.eventDesign).toBe('cards');current.undo();expect(usePresentation.getState().items[0].metadata.eventDesign).toBeUndefined();});
