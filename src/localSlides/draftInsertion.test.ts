import {beforeEach,describe,it,expect} from 'vitest';
import {usePresentation,createServiceItem} from '../store';
import {buildDraftItem,insertDraftItem} from './draftInsertion';
describe('reviewed AI draft insertion',()=>{
 beforeEach(()=>usePresentation.getState().newDocument('Owned drafting test','2026-11-03'));
 it('builds editable real slide content without mutating a document, then inserts with one undo',()=>{
  const initial=usePresentation.getState(),before=initial.items.length;
  const item=buildDraftItem('Dankbarkeit',[{title:'Danke sagen',body:'Wem möchtest du heute danken?'}],'service','light');
  expect(usePresentation.getState().items).toHaveLength(before);
  expect(item.slides[0].elements.filter(e=>e.type==='text').map(e=>e.properties.text)).toEqual(['Danke sagen','Wem möchtest du heute danken?']);
  expect(insertDraftItem(item,initial.presentationId,'service')).toBe(true);
  expect(usePresentation.getState().items).toHaveLength(before+1);expect(usePresentation.getState().liveSlideId).toBe('');
  usePresentation.getState().undo();expect(usePresentation.getState().items).toHaveLength(before);
 });
 it('rejects a changed document and invalid section, including ON AIR',()=>{
  const initial=usePresentation.getState(),item=buildDraftItem('Thema',[{title:'Titel',body:'Text'}],'service','light');
  expect(insertDraftItem(item,'other','service')).toBe(false);expect(insertDraftItem(item,initial.presentationId,'missing')).toBe(false);
  usePresentation.setState({onAir:true});expect(insertDraftItem(item,'other','service')).toBe(false);
  expect(usePresentation.getState().liveSlideId).toBe('');
 });
 it('can preview temporarily empty edited fields but refuses their insertion',()=>{
  const state=usePresentation.getState();
  const item=buildDraftItem('Thema',[{title:'',body:'Text'}],'service','light');
  expect(item.slides[0].title).toBe('');expect(insertDraftItem(item,state.presentationId,'service')).toBe(false);
 });
});
