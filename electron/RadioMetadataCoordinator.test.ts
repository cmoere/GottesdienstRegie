import {describe,expect,it} from 'vitest';
import {RadioMetadataCoordinator} from './RadioMetadataCoordinator';
import {normalizeRadioTitle,type RadioNowPlaying} from '../src/radioNowPlaying';
const deferred=()=>{let resolve!:(value:any)=>void;const promise=new Promise<any>(done=>{resolve=done});return{resolve,promise}};
describe('radio metadata ownership',()=>{
 it('keeps browser preview metadata separate from background playback',()=>{
  const callbacks:Array<(value:RadioNowPlaying)=>void>=[],background:RadioNowPlaying[]=[],preview:RadioNowPlaying[]=[];
  const coordinator=new RadioMetadataCoordinator({start:(_id:string,_url:string,emit:(value:RadioNowPlaying)=>void)=>{callbacks.push(emit);return()=>{}}},{resolve:async()=>null});
  coordinator.start(1,'station','https://example.test/live',value=>background.push(value),'bg','background');
  coordinator.start(1,'station','https://example.test/live',value=>preview.push(value),'preview','preview');
  callbacks[0](normalizeRadioTitle('station','Band - A'));callbacks[1](normalizeRadioTitle('station','Band - B'));
  coordinator.stop(1,'preview','preview');callbacks[0](normalizeRadioTitle('station','Band - C'));
  expect(background.map(value=>value.title)).toEqual(['A','C']);expect(preview.map(value=>value.title)).toEqual(['B']);
 });
 it('never emits artwork of an older song when its lookup finishes last',async()=>{
  let metadata!:(value:RadioNowPlaying)=>void;const a=deferred(),b=deferred(),out:RadioNowPlaying[]=[];
  const coordinator=new RadioMetadataCoordinator({start:(_station:string,_url:string,emit:typeof metadata)=>{metadata=emit;return()=>{}}},{resolve:(title:string)=>title==='A'?a.promise:b.promise});
  coordinator.start(1,'station','https://example.test/live',value=>out.push(value),'session-one');
  metadata(normalizeRadioTitle('station','Band - A'));metadata(normalizeRadioTitle('station','Band - B'));
  b.resolve({album:'B',imageUrl:'https://example.test/b.jpg'});await Promise.resolve();
  a.resolve({album:'A',imageUrl:'https://example.test/a.jpg'});await Promise.resolve();
  expect(out.map(value=>value.title)).toEqual(['A','B','B']);
  expect(out.at(-1)).toMatchObject({title:'B',album:'B',sessionId:'session-one'});
 });
 it('invalidates pending replies and callbacks on stop or restart of the same station',async()=>{
  const callbacks:Array<(value:RadioNowPlaying)=>void>=[],pending=deferred(),out:RadioNowPlaying[]=[];
  const coordinator=new RadioMetadataCoordinator({start:(_id:string,_url:string,emit:(value:RadioNowPlaying)=>void)=>{callbacks.push(emit);return()=>{}}},{resolve:()=>pending.promise});
  coordinator.start(1,'station','https://example.test/live',value=>out.push(value),'old');callbacks[0](normalizeRadioTitle('station','Band - A'));
  coordinator.start(1,'station','https://example.test/live',value=>out.push(value),'new');
  callbacks[0](normalizeRadioTitle('station','Band - A'));
  pending.resolve({album:'A',imageUrl:'https://example.test/a.jpg'});await Promise.resolve();
  expect(out).toHaveLength(1);
  coordinator.stop(1);callbacks[1](normalizeRadioTitle('station','Band - B'));expect(out).toHaveLength(1);
 });
});
