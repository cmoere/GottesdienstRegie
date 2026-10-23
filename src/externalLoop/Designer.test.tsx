import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {ExternalLoopDesigner} from './Designer';
import {ExternalLoopContext} from './context';
import {ExternalLoopController} from './controller';
import {requestForExternalItem} from './model';
import {createServiceItem,usePresentation} from '../store';
import type {ExternalReply,ExternalRequest} from '../../shared/externalLoop';

const saved=usePresentation.getState();
afterEach(()=>{cleanup();usePresentation.setState(saved,true)});
function response(request:ExternalRequest):ExternalReply{
 if(request.kind==='weather')return{snapshot:null,status:'unavailable'};
 const payload=request.kind==='news'?{kind:'news' as const,entries:[{id:'one',title:'Nachricht aus Bielefeld',source:'wdr-owl' as const,publishedAt:'2026-10-23T12:00:00Z',url:'https://www1.wdr.de/a'}]}:{kind:'football' as const,league:request.league,season:2026,mode:request.mode,teams:[{id:1,name:'Verein A'},{id:2,name:'Verein B'}],matches:[{id:1,startsAt:'2026-10-23T12:00:00Z',home:{id:1,name:'Verein A'},away:{id:2,name:'Verein B'},score:null,status:'scheduled' as const}],table:[]};
 return{status:'ready',snapshot:{version:1,key:request.kind==='news'?`news:${request.sources.slice().sort().join(',')}`:`football:${request.league}:${request.mode}`,revision:'a',fetchedAt:1000,stale:false,payload}};
}
async function fixture(type:'news'|'football',read:(request:ExternalRequest)=>Promise<ExternalReply>=async request=>response(request)){
 const doc=usePresentation.getState().newDocument('External'),item=createServiceItem(type,{id:'item',sectionId:'pre',title:type==='news'?'Nachrichten':'Fußball',metadata:{externalKind:type},body:''});
 item.slides[0].elements[0]={...item.slides[0].elements[0],type:'loop',properties:{loopType:type,externalKind:type}};
 usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id});
 const controller=new ExternalLoopController(read,()=>1000);await controller.prepare(requestForExternalItem(item)!);
 function Editor(){const current=usePresentation(state=>state.items.find(entry=>entry.id==='item')!);return <ExternalLoopContext.Provider value={controller}><ExternalLoopDesigner item={current} canEdit/></ExternalLoopContext.Provider>}
 render(<Editor/>);return{controller,doc};
}
describe('real stored news and football configuration',()=>{
 it('offers both source toggles and persists choices without saving runtime data',async()=>{
  const {doc}=await fixture('news');
  fireEvent.click(screen.getByRole('checkbox',{name:/WDR/}));
  expect(usePresentation.getState().items[0].metadata.newsSources).toBe('westfalen-blatt');
  const state=usePresentation.getState();act(()=>state.loadDocument({...doc,items:state.items,sections:state.sections}));
  expect(screen.getByRole('checkbox',{name:/WDR/})).not.toBeChecked();
  expect(usePresentation.getState().items[0].slides[0].elements[0].properties.externalSnapshotJson).toBeUndefined();
 });
 it('shows only available club choices and clears the club on a league change',async()=>{
  await fixture('football');
  const select=screen.getByRole('combobox',{name:'Verein'});
  expect(within(select).getAllByRole('option').map(option=>option.textContent)).toEqual(['Alle Vereine','Verein A','Verein B']);
  fireEvent.change(select,{target:{value:'2'}});expect(usePresentation.getState().items[0].metadata.footballTeamId).toBe(2);
  fireEvent.change(screen.getByRole('combobox',{name:'Liga'}),{target:{value:'bl2'}});
  expect(usePresentation.getState().items[0].metadata).toMatchObject({footballLeague:'bl2',footballTeamId:0});
  fireEvent.click(screen.getByRole('button',{name:'Tabelle'}));expect(usePresentation.getState().items[0].metadata.footballMode).toBe('table');
 });
 it('exposes last-success information, empty status and a numeric readable duration',async()=>{
  await fixture('news');expect(screen.getByText(/Datenstand:/)).toBeInTheDocument();
  const duration=screen.getByRole('spinbutton',{name:'Anzeigedauer in Sekunden'});expect(duration).toHaveAttribute('min','1');
  fireEvent.change(duration,{target:{value:'1'}});expect(usePresentation.getState().items[0].plannedDuration).toBeGreaterThanOrEqual(10000);
  cleanup();await fixture('news',async()=>({snapshot:null,status:'unavailable'}));expect(screen.getByText(/keine gültigen Daten/i)).toBeInTheDocument();
 });
});
