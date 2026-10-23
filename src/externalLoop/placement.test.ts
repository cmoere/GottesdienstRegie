import {describe,expect,it} from 'vitest';
import {canPlaceItem,isLoopItemType} from '../loopDomain';
import {createServiceItem,type ItemType,usePresentation} from '../store';
import {createLoopItem} from '../loopItemFactory';
import {getAddElementGroups} from '../addElementCatalog';

describe('new external loop types retain placement restrictions',()=>{
 it('offers news and football but never places them into service or arrival',()=>{
  for(const type of ['news','football']){
   expect(isLoopItemType(type)).toBe(true);const item=createServiceItem(type as ItemType,{sectionId:'pre'});
   for(const id of ['pre','post'])expect(canPlaceItem(item,{id,type:id==='pre'?'preLoop':'postLoop'})).toBe(true);
   for(const id of ['service','warmup'])expect(canPlaceItem(item,{id,type:id==='service'?'service':'warmup'})).toBe(false);
   expect(getAddElementGroups(null)[1].entries.some(entry=>entry.type===type)).toBe(true);
   expect(createLoopItem(type as any,'pre').metadata.externalKind).toBe(type);
  }
 });
 it('rejects direct insertion into service and keeps external selections on reload',()=>{
  for(const type of ['news','football'] as const){
   const initial=usePresentation.getState().newDocument('External');const count=usePresentation.getState().items.length;
   usePresentation.getState().addItem(type,{title:type,section:'GOTTESDIENST',sectionId:'service',body:''});expect(usePresentation.getState().items).toHaveLength(count);
   usePresentation.getState().addItem(type,{title:type,section:'VORPROGRAMM',sectionId:'pre',body:'',metadata:{externalKind:type,newsSources:'wdr-owl',footballLeague:'bl2'}});
   const state=usePresentation.getState(),saved=state.items.find(item=>item.type===type);expect(saved?.sectionId).toBe('pre');
   state.loadDocument({...initial,items:state.items,sections:state.sections});expect(usePresentation.getState().items.find(item=>item.id===saved?.id)?.metadata).toMatchObject({externalKind:type,footballLeague:'bl2'});
  }
 });
});
