import {afterEach,expect,it} from 'vitest';
import {LiveEngine} from './LiveEngine';
import {createServiceItem} from './store';
import {useLiveOutputPreview} from './liveOutputPreview';

afterEach(()=>{delete window.desktop;useLiveOutputPreview.setState({slide:null})});
it('does not replace a newer MAIN preview with a late acknowledgement',async()=>{
  const engine=new LiveEngine(),slide=createServiceItem('content').slides[0];
  let firstDone!:(ok:boolean)=>void;
  window.desktop={sendLiveSlide:(value:unknown)=>(value as {id:string}).id==='old'?new Promise<boolean>(resolve=>{firstDone=resolve}):Promise.resolve(true)} as unknown as typeof window.desktop;
  const first=engine.show({...slide,id:'old'});
  await engine.show({...slide,id:'new'});
  firstDone(true);await first;
  expect(useLiveOutputPreview.getState().slide?.id).toBe('new');
});
it('does not restore a preview from an in-flight send after stopping',async()=>{
  const engine=new LiveEngine(),slide=createServiceItem('content').slides[0];
  let sent!:(ok:boolean)=>void;
  window.desktop={sendLiveSlide:()=>new Promise<boolean>(resolve=>{sent=resolve}),goOffAir:async()=>true} as unknown as typeof window.desktop;
  const pending=engine.show(slide);await engine.stop();sent(true);await pending;
  expect(useLiveOutputPreview.getState().slide).toBeNull();
});
it('does not report a rejected MAIN delivery as the current preview',async()=>{
  const engine=new LiveEngine(),slide=createServiceItem('content').slides[0];
  window.desktop={sendLiveSlide:async()=>false} as unknown as typeof window.desktop;
  expect(await engine.show(slide)).toBe(false);
  expect(useLiveOutputPreview.getState().slide).toBeNull();
});
