import {afterEach,expect,it} from 'vitest';
import {usePreferences} from '../preferences';
import {startNativeSelectionSync} from './nativeSelectionSync';
import type {RegionalSelection} from '../../shared/regional/catalog';
const initial=usePreferences.getState();
afterEach(()=>usePreferences.setState(initial,true));
const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
it('synchronizes only selection, coalesces pending choices, and never writes audio preferences',async()=>{
  usePreferences.getState().setLanguage('de');
  const writes:RegionalSelection[]=[];
  let finish!:(value:RegionalSelection)=>void;
  const audio=usePreferences.getState().audioRouting;
  const stop=startNativeSelectionSync(usePreferences,{write:selection=>{
    writes.push(selection);
    if(writes.length===1)return new Promise(resolve=>{finish=resolve});
    return Promise.resolve(selection);
  }});
  await settle();
  usePreferences.getState().setGermanRegion('ruhr');
  usePreferences.getState().setGermanRegion('berlin');
  usePreferences.setState({theme:'dark'});
  expect(writes).toEqual([{language:'de',germanRegion:null}]);
  finish(writes[0]);await settle();
  expect(writes).toEqual([{language:'de',germanRegion:null},{language:'de',germanRegion:'berlin'}]);
  expect(usePreferences.getState().audioRouting).toBe(audio);
  stop();usePreferences.getState().setGermanRegion('ruhr');await settle();
  expect(writes).toHaveLength(2);
});
it('reports a failed native save and can send a later selection without an unhandled rejection',async()=>{
  const errors:unknown[]=[];const writes:RegionalSelection[]=[];
  const stop=startNativeSelectionSync(usePreferences,{write:async selection=>{
    writes.push(selection);if(writes.length===1)throw new Error('unavailable');return selection;
  }},error=>errors.push(error));
  await settle();expect(errors).toHaveLength(1);
  usePreferences.getState().setGermanRegion('ruhr');await settle();
  expect(writes).toHaveLength(2);stop();
});
