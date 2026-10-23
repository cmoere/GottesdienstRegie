import {describe,expect,it} from 'vitest';
import {handleExternalLoopRead,handleWeatherLocationSearch} from './ipc';

describe('operator-only external loop IPC',()=>{
 it('allows explicit place search only from the operator main frame',async()=>{
  const frame={},event={sender:{id:7,mainFrame:frame},senderFrame:frame};let calls=0;const service={searchWeatherLocations:async()=>{calls++;return[{name:'Bielefeld',latitude:52.03,longitude:8.53}]}};
  expect(await handleWeatherLocationSearch(event,'Bielefeld',7,service)).toHaveLength(1);
  for(const [candidate,value] of [[{...event,senderFrame:{}},'Bielefeld'],[event,'x'],[event,{url:'https://localhost'}],[{...event,sender:{id:8,mainFrame:frame}},'Bielefeld']] as const)expect(await handleWeatherLocationSearch(candidate,value,7,service)).toEqual([]);expect(calls).toBe(1);
 });
 it('accepts the operator mainframe and rejects outputs, subframes and malformed requests before transport',async()=>{
  const frame={},event={sender:{id:7,mainFrame:frame},senderFrame:frame};let reads=0;
  const service={read:async()=>{reads++;return{snapshot:null,status:'empty' as const}}};
  expect(await handleExternalLoopRead(event,{kind:'news',sources:['wdr-owl']},7,service)).toEqual({snapshot:null,status:'empty'});
  for(const input of [null,{kind:'news',sources:['http://127.0.0.1']},{kind:'news',sources:['wdr-owl','wdr-owl']},{kind:'football',league:'bl8',mode:'table'},{kind:'news',sources:['wdr-owl'],url:'https://localhost'}])await handleExternalLoopRead(event,input,7,service);
  await handleExternalLoopRead({...event,senderFrame:{}},{kind:'news',sources:['wdr-owl']},7,service);
  await handleExternalLoopRead({...event,sender:{id:8,mainFrame:frame}},{kind:'news',sources:['wdr-owl']},7,service);
  await handleExternalLoopRead(event,{kind:'news',sources:['wdr-owl']},null,service);
  expect(reads).toBe(1);
 });
 it('does not send stacktraces back when the service fails',async()=>{
  const frame={},event={sender:{id:7,mainFrame:frame},senderFrame:frame};
  expect(await handleExternalLoopRead(event,{kind:'football',league:'bl2',mode:'table'},7,{read:async()=>{throw Error('private stack')}})).toEqual({snapshot:null,status:'unavailable'});
 });
});
