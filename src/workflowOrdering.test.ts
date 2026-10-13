import {beforeEach, expect, it} from 'vitest';
import {usePresentation, type ServiceItem} from './store';
import {ensurePostProgramSystemSlide} from './postProgramSystemSlide';

const template=ensurePostProgramSystemSlide([])[0];
const item=(id:string,sectionId='service',type:ServiceItem['type']='content'):ServiceItem=>({...structuredClone(template),id,sectionId,type,groupId:undefined,itemCategory:type==='infoCard'?'loop':'standard',placementPolicy:type==='infoCard'?'loopOnly':'any',metadata:{},order:0});
beforeEach(()=>usePresentation.setState({items:[item('a'),item('b'),item('c')],history:[],future:[]}));
const move=(id:string,target:string,sectionId:string,position:'before'|'after')=>(usePresentation.getState().reorder as (id:string,target:string,sectionId:string,position:'before'|'after')=>void)(id,target,sectionId,position);
it('honors an explicit before boundary when moving down',()=>{
 move('a','c','service','before');
 expect(usePresentation.getState().items.filter(i=>i.sectionId==='service').map(i=>i.id)).toEqual(['b','a','c']);
});
it('moves to an empty section atomically and undo restores the section',()=>{
 move('a','','pre','after');
 expect(usePresentation.getState().items.find(i=>i.id==='a')?.sectionId).toBe('pre');
 expect(usePresentation.getState().history).toHaveLength(1);
 usePresentation.getState().undo();
 expect(usePresentation.getState().items.find(i=>i.id==='a')?.sectionId).toBe('service');
});
it('rejects loop items dropped into service without adding history',()=>{
 usePresentation.setState({items:[item('loop','pre','infoCard'),item('b')]});
 move('loop','b','service','after');
 expect(usePresentation.getState().items.find(i=>i.id==='loop')?.sectionId).toBe('pre');
 expect(usePresentation.getState().history).toHaveLength(0);
});
it('keeps the protected system item first when dropping before it',()=>{
 usePresentation.setState({items:ensurePostProgramSystemSlide([item('a'),item('b'),item('post','post','infoCard')])});
 const system=usePresentation.getState().items.find(i=>i.metadata.automaticRoomNotice)!;
 move('a',system.id,'post','before');
 expect(usePresentation.getState().items.filter(i=>i.sectionId==='post').map(i=>i.id).slice(0,2)).toEqual([system.id,'a']);
 const before=usePresentation.getState().history.length;
 move(system.id,'b','service','after');
 expect(usePresentation.getState().history).toHaveLength(before);
});
