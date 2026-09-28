import {describe,expect,it} from 'vitest';
import {getAddElementGroups} from './addElementCatalog';
import type {ServiceSection} from './store';
const section=(id:string,supportsLoopItems=false)=>({id,title:id,order:0,type:id==='pre'?'preLoop':'service',autoLoop:supportsLoopItems,supportsLoopItems} as ServiceSection);
describe('add element catalog',()=>{
 it('always exposes general and pre/post groups',()=>{const groups=getAddElementGroups(section('service'));expect(groups.map(g=>g.id)).toEqual(['service','loop']);expect(groups[1].entries.find(e=>e.type==='nowPlaying')).toMatchObject({label:'Läuft gerade',disabled:true})});
 it('enables loop elements in mandatory loop sections',()=>{const groups=getAddElementGroups(section('pre',true));expect(groups[1].entries.every(e=>!e.disabled)).toBe(true)});
});
