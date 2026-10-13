import {beforeEach,expect,it} from 'vitest';
import {usePresentation,presentationDocument} from './store';
import {loopDurationMs} from './loopDomain';

it('migrates a persisted v76 room notice to a full minute',async()=>{
 const old=structuredClone(system());
 old.plannedDuration=15000;old.timing.slideDurationSeconds=15;old.slides[0].timing={durationSeconds:15};
 localStorage.setItem('gottesdienstregie2.presentation',JSON.stringify({version:14,state:{...presentationDocument(usePresentation.getState()),items:[old]}}));
 await usePresentation.persist.rehydrate();
 expect(loopDurationMs(system())).toBe(60000);
 expect(system().slides[0].timing?.durationSeconds).toBe(60);
});

const system=()=>usePresentation.getState().items.find(item=>item.metadata.automaticRoomNotice===true)!;
it('keeps a system slide selected via multi-selection in preview',()=>{
 usePresentation.setState({mode:'edit'});
 usePresentation.getState().selectServiceItems([system().id],system().id);
 expect(usePresentation.getState().mode).toBe('preview');
 expect(usePresentation.getState().previewItemId).toBe(system().id);
});
it('keeps the protected page in preview and explains edit attempts',()=>{
 usePresentation.getState().select(system().id);
 expect(usePresentation.getState().mode).toBe('preview');
 let explained=false;const listener=()=>{explained=true};
 window.addEventListener('gottesdienstregie:protected-slide',listener);
 usePresentation.getState().setMode('edit');
 window.removeEventListener('gottesdienstregie:protected-slide',listener);
 expect(explained).toBe(true);expect(usePresentation.getState().mode).toBe('preview');
});
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
