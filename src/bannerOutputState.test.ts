import {beforeEach,expect,it,vi} from 'vitest';
const windows:any[]=[];
vi.mock('electron',()=>({screen:{getAllDisplays:()=>[{id:1,bounds:{x:0,y:0,width:1920,height:1080}},{id:2,bounds:{x:1920,y:0,width:1920,height:1080}}]},BrowserWindow:class{webContents={id:windows.length+1,send(){},insertCSS(){}};destroyed=false;constructor(){windows.push(this)}setMenu(){}on(){}showInactive(){}setFullScreen(){}close(){this.destroyed=true}isDestroyed(){return this.destroyed}}}));
import {OutputWindowManager} from '../electron/OutputWindowManager';
import {changedOutputLayers,readBannerOutputState} from './outputState';
const banner={revision:1,position:'bottom' as const,items:[{id:'m',text:'Bitte beachten',priority:'normal' as const}],cycleStartedAtMs:100000,reserved:true};
beforeEach(()=>{windows.length=0});
it('updates only the banner layer and preserves the current media take',async()=>{
  const manager=new OutputWindowManager('',async()=>{},()=>{});
  await manager.start({'1':'main','2':'stage'} as any,{id:'video',_presentAtMs:1000});
  const before=manager.getStateForSender(1)!;manager.setBanner(banner);const after=manager.getStateForSender(1)!;
  expect(after.slide).toEqual(before.slide);expect(after.slideRevision).toBe(before.slideRevision);expect(after.quickRevision).toBe(before.quickRevision);
  expect(changedOutputLayers(before,after)).toEqual({slide:false,quick:false,banner:true,appMode:false});
  expect(after.revision).toBeGreaterThan(before.revision);expect(after.banner).toEqual(banner);
  expect(manager.getStateForSender(2)?.banner??null).toBeNull();
  manager.setAppMode({mode:'test',onAir:true});expect(changedOutputLayers(after,manager.getStateForSender(1)!)).toEqual({slide:false,quick:false,banner:false,appMode:true});
});
it('replays complete banner state for late subscribers and rejects older snapshots',async()=>{
  const manager=new OutputWindowManager('',async()=>{},()=>{});manager.setBanner(banner);await manager.start({'1':'main'} as any,{id:'first'});
  const state=manager.getStateForSender(1)!;expect(state.banner).toEqual(banner);
  expect(changedOutputLayers(state,{...state,revision:state.revision-1})).toEqual({slide:false,quick:false,banner:false,appMode:false});
});
it('rejects malformed or private-field payloads instead of forwarding raw Firebase data',()=>{
  expect(readBannerOutputState(banner)).toEqual(banner);expect(readBannerOutputState(null)).toBeNull();
  for(const value of [{...banner,position:'elsewhere'},{...banner,revision:NaN},{...banner,createdBy:'admin'},{...banner,items:[{...banner.items[0],internalComment:'secret'}]}])expect(readBannerOutputState(value)).toBeUndefined();
});
