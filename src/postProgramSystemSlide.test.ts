import {beforeEach,expect,it} from 'vitest';
import {usePresentation,presentationDocument} from './store';

const system=()=>usePresentation.getState().items.find(item=>item.metadata.automaticRoomNotice===true)!;
beforeEach(()=>usePresentation.getState().newDocument('Systemfolie'));
it('adds exactly one protected first post item to new and legacy presentations',()=>{
 expect(system()).toBeDefined();
 const doc=presentationDocument(usePresentation.getState());
 usePresentation.getState().loadDocument({...doc,items:[]});
 expect(usePresentation.getState().items.filter(i=>i.sectionId==='post')).toHaveLength(1);
 usePresentation.getState().addItem('infoCard',{title:'Danach',section:'',sectionId:'post',body:'Danke'});
 expect(usePresentation.getState().items.filter(i=>i.sectionId==='post')[0]).toEqual(system());
});
it('rejects editing, deletion, disabling, duplication and moving the system slide',()=>{
 const original=structuredClone(system());expect(original).toBeDefined();
 const s=usePresentation.getState();s.select(original.id);
 s.updateItem(original.id,{title:'Manipuliert'});s.updateSlide({body:'Manipuliert'});
 s.addSlide();s.addElement('image');s.toggleSlide();s.setItemsEnabled([original.id],false);
 s.moveItemToSection(original.id,'pre');s.duplicateItem(original.id);s.removeItems([original.id]);
 expect(system()).toEqual(original);
 expect(usePresentation.getState().items.filter(i=>i.metadata.automaticRoomNotice)).toHaveLength(1);
});
it('restores the protected slide after undo and document reload',()=>{
 const s=usePresentation.getState();s.addItem('content');s.undo();s.redo();
 s.loadDocument(presentationDocument(usePresentation.getState()));
 expect(system()).toBeDefined();expect(system().enabled).toBe(true);
});
it('keeps the system slide reachable when an imported document omits the post section',()=>{
 const doc=presentationDocument(usePresentation.getState());
 usePresentation.getState().loadDocument({...doc,sections:[{id:'service',title:'Gottesdienst',order:0}],items:[]});
 expect(usePresentation.getState().sections.some(s=>s.id==='post')).toBe(true);
});
