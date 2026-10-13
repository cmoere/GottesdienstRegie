import {afterEach,expect,it,vi} from 'vitest';
import {LiveEngine} from './LiveEngine';
import {createServiceItem} from './store';
import {useLiveOutputPreview} from './liveOutputPreview';
import {setNowPlayingState} from './nowPlayingModel';

afterEach(()=>{delete window.desktop;useLiveOutputPreview.setState({slide:null});vi.useRealTimers()});
it('keeps a successful pending take when the following delivery is rejected',async()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);
 const engine=new LiveEngine(),slide=createServiceItem('content').slides[0];
 window.desktop={sendLiveSlide:async(value:{id:string})=>value.id!=='rejected'} as unknown as typeof window.desktop;
 const first=engine.show({...slide,id:'accepted'});await Promise.resolve();
 await vi.advanceTimersByTimeAsync(50);
 expect(await engine.show({...slide,id:'rejected'})).toBe(false);
 await vi.advanceTimersByTimeAsync(50);await first;
 expect(useLiveOutputPreview.getState().slide?.id).toBe('accepted');
});
it('keeps the committed preview until the shared output presentation time',async()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);
 const engine=new LiveEngine(),slide=createServiceItem('content').slides[0];let sent:Record<string,unknown>={};
 window.desktop={sendLiveSlide:async(value:Record<string,unknown>)=>{sent=value;return true}} as unknown as typeof window.desktop;
 const pending=engine.show(slide);await Promise.resolve();
 expect(useLiveOutputPreview.getState().slide).toBeNull();
 expect(sent._presentAtMs).toBe(1100);
 await vi.advanceTimersByTimeAsync(100);await pending;
 expect(useLiveOutputPreview.getState().slide?.id).toBe(slide.id);
});
it('prepares current music on every take, including re-entering the same slide',async()=>{
 const engine=new LiveEngine(),item=createServiceItem('nowPlaying');
 item.slides[0].elements[0]={...item.slides[0].elements[0],type:'loop',properties:{loopType:'nowPlaying'}};
 setNowPlayingState({active:true,track:{assetId:'song',url:'radio',name:'Aktueller Titel',artist:'Interpret'}});
 window.desktop={sendLiveSlide:async()=>true} as unknown as typeof window.desktop;
 await engine.show(item.slides[0]);
 expect(useLiveOutputPreview.getState().slide?.elements.find(element=>element.type==='loop')?.properties).toMatchObject({nowPlayingActive:true,nowPlayingTitle:'Aktueller Titel',nowPlayingArtist:'Interpret'});
 await engine.show(createServiceItem('content').slides[0]);
 await engine.show(item.slides[0]);
 expect(useLiveOutputPreview.getState().slide?.elements.find(element=>element.type==='loop')?.properties.nowPlayingTitle).toBe('Aktueller Titel');
 setNowPlayingState({active:false});
});
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
