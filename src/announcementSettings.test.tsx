import {describe,it,expect,afterEach,beforeEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {AnnouncementSlideDesigner} from './AnnouncementSlideDesigner';
import {createServiceItem,usePresentation} from './store';
import {announcementSettings} from './announcementSettings';
import {SlideRenderer} from './SlideRenderer';
import {usePreferences} from './preferences';

const savedPreferences=usePreferences.getState();
beforeEach(()=>usePreferences.setState({language:'de',germanRegion:null}));
afterEach(()=>{cleanup();usePreferences.setState(savedPreferences,true)});
describe('announcement editor controls',()=>{
 it('removes the QR area from the actual editable slide preview',()=>{
  const item=createServiceItem('announcement',{itemCategory:'loop'});
  const slide=item.slides[0];
  slide.elements=[{id:'loop',type:'loop',name:'Meldungen',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:0,properties:{loopType:'announcement',announcementQrEnabled:false}}];
  const view=render(<SlideRenderer slide={slide} mode="preview"/>);
  expect(view.container.querySelector('.slide-renderer-element.qr')).toBeNull();
  const text=view.container.querySelectorAll<HTMLElement>('.announcement-loop-preview .slide-renderer-element.text')[1];
  expect(parseFloat(text.style.width)).toBeGreaterThan(80);
 });
 it('accepts one second and extended manual reading durations',()=>{
  expect(announcementSettings({announcementReadingSeconds:1}).readingSeconds).toBe(1);
  expect(announcementSettings({announcementReadingSeconds:240}).readingSeconds).toBe(240);
  expect(announcementSettings({announcementReadingSeconds:-5}).readingSeconds).toBe(0);
 });
 it('offers eight design cards and saves QR, category, priority and reading settings on the whole item',()=>{
  const item=createServiceItem('announcement',{itemCategory:'loop',slides:[]});
  usePresentation.setState({items:[item]});
  render(<AnnouncementSlideDesigner item={item} canEdit/>);
  expect(screen.getAllByRole('button')).toHaveLength(8);
  expect(screen.getByRole('checkbox',{name:'QR-Codes anzeigen'})).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox',{name:'QR-Codes anzeigen'}));
  expect(usePresentation.getState().items[0].metadata.announcementQrEnabled).toBe(false);
  fireEvent.change(screen.getByLabelText('Kategorie'),{target:{value:'event'}});
  expect(usePresentation.getState().items[0].metadata.announcementCategory).toBe('event');
  fireEvent.click(screen.getByRole('checkbox',{name:'Nach Priorität sortieren'}));
  expect(usePresentation.getState().items[0].metadata.announcementPrioritySort).toBe(false);
  fireEvent.change(screen.getByLabelText('Mindestanzeigedauer (Sekunden)'),{target:{value:'25'}});
  expect(usePresentation.getState().items[0].metadata.announcementReadingSeconds).toBe(25);
 });
});
