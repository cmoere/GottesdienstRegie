import {afterEach,describe,expect,it,vi} from 'vitest';
const bridge=vi.hoisted(()=>({desktop:{} as Record<string,any>,calls:[] as unknown[][]}));
vi.mock('electron',()=>({contextBridge:{exposeInMainWorld:(_name:string,api:Record<string,any>)=>{bridge.desktop=api}},ipcRenderer:{invoke:async(...args:unknown[])=>{bridge.calls.push(args);return{snapshot:null,status:'empty'}}}}));
afterEach(()=>{location.hash='';bridge.calls=[]});
describe('actual preload source-data boundary',()=>{
 it('does not expose source loading on MAIN or STAGE routes but forwards operator requests to the validated channel',async()=>{
  for(const role of ['main','stage']){vi.resetModules();location.hash=`#output?role=${role}`;await import('../preload');expect(bridge.desktop.externalLoop).toBeUndefined()}
  vi.resetModules();location.hash='';await import('../preload');
  const request={kind:'news',sources:['wdr-owl']};expect(await bridge.desktop.externalLoop.read(request)).toEqual({snapshot:null,status:'empty'});
  expect(bridge.calls).toEqual([['external-loop:read',request]]);
 });
});
