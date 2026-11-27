import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,act} from '@testing-library/react';
import {TransitView} from './TransitView';
import {TransitDesigner} from './TransitDesigner';
import {ExternalLoopView} from './View';
import {usePreferences} from '../preferences';
import {TRANSIT_DESIGNS,TRANSIT_STOP_ID,TRANSIT_STOP_NAME,transitSettings,transitMinimumDuration,type TransitPayload} from '../../shared/transit';
import {ExternalLoopController} from './controller';
import {createServiceItem} from '../store';
import {canInsertItemType} from '../itemPlacementPolicy';
import type {ExternalSnapshot} from '../../shared/externalLoop';
const savedLanguage=usePreferences.getState().language,savedRegion=usePreferences.getState().germanRegion;
beforeEach(()=>usePreferences.setState({language:'de',germanRegion:null}));
afterEach(()=>{cleanup();vi.useRealTimers();usePreferences.setState({language:savedLanguage,germanRegion:savedRegion})});
const now=Date.parse('2026-11-27T10:00:00Z');
const payload:TransitPayload={kind:'transit',stopId:TRANSIT_STOP_ID,stopName:TRANSIT_STOP_NAME,walkMinutes:6,messagesUpdatedAt:now,departures:Array.from({length:12},(_,i)=>({line:i===0?'27':'2',destination:'Ziel '+(i+1),platform:'Gleis 2',plannedAt:now+(i+1)*60000,effectiveAt:now+(i+6)*60000,delayMinutes:5,cancelled:i===0,status:'',via:['Schillerstraße']})),messages:[{id:'m',title:'Umleitung',text:'Bitte die Ersatzhaltestelle nutzen.',lines:['2']}]};
const snapshot:ExternalSnapshot={version:1,key:'transit:beckhausstrasse',revision:'r',stale:false,fetchedAt:now,payload};
describe('native transit loop',()=>{
 it.each(TRANSIT_DESIGNS)('renders %s with station, matching messages and distinguishable planned/forecast times',design=>{
  const {container}=render(<TransitView snapshot={snapshot} payload={payload} settings={transitSettings({transitDesign:design})} elapsed={0} reduced/>);
  expect(container.querySelector('[data-transit-design]')).toHaveAttribute('data-transit-design',design);
  expect(screen.getByText(TRANSIT_STOP_NAME)).toBeInTheDocument();expect(screen.getByText(/Umleitung/)).toBeInTheDocument();
  expect(screen.getByText('Fällt aus')).toBeInTheDocument();expect(screen.getAllByText(/\+5 Min/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/undefined|ERR_NETWORK|\[object Object\]/)).toBeNull();
 });
 it('paginates complete departures and hides optional fields without changing shared data',()=>{
  render(<TransitView snapshot={snapshot} payload={payload} settings={transitSettings({transitShowMessages:false,transitShowPlatform:false,transitShowVia:false})} elapsed={12000} reduced/>);
  expect(screen.getByText('Ziel 7')).toBeInTheDocument();expect(screen.queryByText('Ziel 1')).toBeNull();expect(screen.queryByText(/Umleitung/)).toBeNull();expect(screen.queryByText('Gleis 2')).toBeNull();
  expect(payload.messages).toHaveLength(1);
  expect(transitMinimumDuration(payload,transitSettings({transitDesign:'focus'}))).toBeGreaterThanOrEqual(72000);
 });
 it('provides six designs, restrictions and individual switches',()=>{
  const onChange=vi.fn();render(<TransitDesigner settings={transitSettings({})} canEdit onChange={onChange}/>);
  expect(screen.getByText(/Beschränkt auf/)).toHaveTextContent(TRANSIT_STOP_NAME);
  expect(screen.getAllByRole('button')).toHaveLength(6);
  fireEvent.click(screen.getByRole('button',{name:'Dunkle Abfahrtstafel'}));expect(onChange).toHaveBeenCalledWith({transitDesign:'board'});
  fireEvent.click(screen.getByLabelText('Verkehrsmeldungen anzeigen'));expect(onChange).toHaveBeenCalledWith({transitShowMessages:false});
 });
 it('advances live departure pages on the shared clock even without reduced motion',()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  render(<ExternalLoopView snapshot={snapshot} settings={transitSettings({transitDesign:'focus'})} startedAt={now}/>);
  expect(screen.getByText('Ziel 1')).toBeInTheDocument();act(()=>vi.advanceTimersByTime(12000));expect(screen.getByText('Ziel 3')).toBeInTheDocument();expect(screen.queryByText('Ziel 1')).toBeNull();
 });
 it('translates the editor controls without translating the fixed stop name',()=>{
  usePreferences.setState({language:'en'});render(<TransitDesigner settings={transitSettings({})} canEdit onChange={()=>{}}/>);
  expect(screen.getByRole('button',{name:'Dark departure board'})).toBeInTheDocument();expect(screen.getByLabelText('Show service notices')).toBeInTheDocument();expect(screen.getByText(TRANSIT_STOP_NAME)).toBeInTheDocument();
 });
 it('is loop-only, freezes current output and rejects old data for new takes',async()=>{
  expect(canInsertItemType('transit',{id:'service',title:'Gottesdienst',order:0,type:'service'})).toBe(false);
  expect(canInsertItemType('transit',{id:'post',title:'Nachprogramm',order:0,type:'postLoop'})).toBe(true);
  let time=now;const controller=new ExternalLoopController(async()=>({snapshot:structuredClone(snapshot),status:'ready'}),()=>time);
  await controller.prepare({kind:'transit'});
  const item=createServiceItem('transit',{sectionId:'post',metadata:{externalKind:'transit'}}),slide=item.slides[0];slide.elements=[{id:'loop',name:'ÖPNV',type:'loop',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{loopType:'transit'}}];
  const first=controller.outputForTake(item,slide,1,time);expect(first?.elements[0].properties.externalSnapshotJson).toContain('Ziel 1');
  time+=121000;expect(controller.outputForTake(item,slide,1,time)).toEqual(first);expect(controller.outputForTake(item,slide,2,time)).toBeNull();
 });
});
