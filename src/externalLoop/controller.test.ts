import {afterEach,describe,expect,it,vi} from 'vitest';
import {ExternalLoopController,startExternalLoopDemand} from './controller';
import {createServiceItem,type ItemType} from '../store';
import {usePresentation,type Slide} from '../store';
import {LiveEngine} from '../LiveEngine';
import {useLiveOutputPreview} from '../liveOutputPreview';
import type {ExternalReply,ExternalRequest} from '../../shared/externalLoop';

const request:ExternalRequest={kind:'news',sources:['westfalen-blatt']};
function ready(title:string):ExternalReply{return{status:'ready',snapshot:{version:1,key:'news:westfalen-blatt',revision:title,fetchedAt:1000,stale:false,payload:{kind:'news',entries:[{id:'one',title,source:'westfalen-blatt',publishedAt:null,url:'https://www.westfalen-blatt.de/a'}]}}}}
function item(){const result=createServiceItem('news' as ItemType,{id:'item',sectionId:'pre',title:'Nachrichten',metadata:{externalKind:'news',newsSources:'westfalen-blatt'}});result.slides[0].elements=[{id:'news-core',type:'loop',name:'News',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,locked:true,visible:true,zIndex:1,properties:{loopType:'news'}}];return result}
afterEach(()=>vi.useRealTimers());
describe('immutable external loop takes',()=>{
 it('prepareDoesNotMutateVisibleSnapshot and changes only at a new take',async()=>{
  let title='Alt';const controller=new ExternalLoopController(async()=>ready(title),()=>1000),current=item(),slide=current.slides[0];await controller.prepare(request);
  const first=controller.outputForTake(current,slide,7,1000);expect(first).not.toBeNull();title='Neu';await controller.prepare(request);
  const repeated=controller.outputForTake({...current,metadata:{...current.metadata,newsSources:'westfalen-blatt'}},slide,7,2000);
  expect(repeated).toEqual(first);expect(first?.elements[0].properties.externalStartedAtMs).toBe(1000);
  const next=controller.outputForTake(current,slide,8,3000);expect(String(next?.elements[0].properties.externalSnapshotJson)).toContain('Neu');
  expect(slide.elements[0].properties.externalSnapshotJson).toBeUndefined();
 });
 it('lateSelectionResponseCannotReplaceNewSelection or a later refresh of the same request',async()=>{
  const resolvers:Array<(reply:ExternalReply)=>void>=[];
  const controller=new ExternalLoopController(()=>new Promise(resolve=>resolvers.push(resolve)),()=>1000);
  const old=controller.prepare(request),fresh=controller.prepare(request);resolvers[1](ready('Neu'));await fresh;resolvers[0](ready('Alt'));await old;
  expect(controller.peek(request).snapshot?.revision).toBe('Neu');
 });
 it('takeAndMirrorShareRevisionAndEpoch without fetching during a take',async()=>{
  vi.useFakeTimers();vi.setSystemTime(1000);
  let calls=0;const controller=new ExternalLoopController(async()=>{calls++;return ready('Einheitlich')},()=>1000),current=item(),saved=usePresentation.getState(),savedDesktop=window.desktop;
  await controller.prepare(request);const first=controller.outputForTake(current,current.slides[0],1,1234);expect(first).not.toBeNull();
  let delivered:Slide|undefined;
  window.desktop={goOnAir:async(_assignments:unknown,slide:Slide)=>{delivered=slide;return true}} as unknown as typeof window.desktop;
  usePresentation.setState({items:[current],liveTransitionRevision:1});
  try{
   const start=new LiveEngine().start({'1':'main'},first!);await vi.advanceTimersByTimeAsync(100);expect(await start).toBe(true);
   const mirror=useLiveOutputPreview.getState().slide;
   expect(delivered?.elements[0].properties).toMatchObject({externalRevision:'Einheitlich',externalStartedAtMs:1234});
   expect(mirror?.elements[0].properties).toEqual(delivered?.elements[0].properties);expect(mirror).toMatchObject({_presentAtMs:1100});expect(delivered).toMatchObject({_presentAtMs:1100});expect(calls).toBe(1);
  }finally{usePresentation.setState(saved,true);useLiveOutputPreview.setState({slide:null});window.desktop=savedDesktop}
 });
 it('failedSourceDoesNotBlockTake and EMPTY contents have no prepared output',async()=>{
  const controller=new ExternalLoopController(async()=>{throw Error('network')},()=>1000),current=item();await controller.prepare(request);
  expect(controller.outputForTake(current,current.slides[0],1,1234)).toBeNull();expect(controller.hasEligible(current)).toBe(false);
 });
 it('rejects malformed transport data and never forwards private fields to MAIN',async()=>{
  const reply=ready('Headline');if(reply.snapshot?.payload.kind==='news')Object.assign(reply.snapshot.payload.entries[0],{internalComment:'private'});
  const controller=new ExternalLoopController(async()=>reply,()=>1000),current=item();
  await controller.prepare(request);expect(controller.outputForTake(current,current.slides[0],1,1234)).toBeNull();
 });
 it('reports nonblocking source warnings without exposing technical error details',async()=>{
  const controller=new ExternalLoopController(async()=>{throw Error('ERR_PRIVATE_NETWORK')},()=>1000),current=item();await controller.prepare(request);
  const warnings=controller.preflightWarnings([current]);expect(warnings).toHaveLength(1);expect(warnings[0]).toContain('Nachrichten');expect(warnings[0]).not.toContain('ERR_PRIVATE_NETWORK');
 });
 it('schedules unique requests every60seconds and stops on cleanup',async()=>{
  vi.useFakeTimers();let calls=0;const controller=new ExternalLoopController(async()=>{calls++;return ready('Ready')},()=>1000),a=item(),b={...item(),id:'other'};
  const stop=startExternalLoopDemand(controller,[a,b]);await vi.advanceTimersByTimeAsync(0);expect(calls).toBe(1);
  await vi.advanceTimersByTimeAsync(60000);expect(calls).toBe(2);stop();await vi.advanceTimersByTimeAsync(60000);expect(calls).toBe(2);
 });
});
