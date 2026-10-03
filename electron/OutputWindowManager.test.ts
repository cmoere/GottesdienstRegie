import {beforeEach,describe,expect,it,vi} from 'vitest';

const sends:unknown[][]=[],windows:any[]=[];
vi.mock('electron',()=>({
  screen:{getAllDisplays:()=>[{id:1,bounds:{x:0,y:0,width:1920,height:1080},label:'MAIN'}],getPrimaryDisplay:()=>({id:1})},
  BrowserWindow:class{
    destroyed=false;webContents={send:(...args:unknown[])=>sends.push(args),insertCSS:vi.fn()};
    constructor(){windows.push(this)}setMenu(){}on(){}showInactive(){}setFullScreen(){}close(){this.destroyed=true}isDestroyed(){return this.destroyed}loadURL(){return Promise.resolve()}
  },
}));
import {OutputWindowManager} from './OutputWindowManager';

describe('OutputWindowManager app mode',()=>{
  beforeEach(()=>{sends.length=0;windows.length=0});
  it('sends current app mode to a newly opened output and broadcasts later changes',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});
    manager.setAppMode({mode:'test',onAir:true});
    await manager.start({'1':'main'} as any,{id:'slide'});
    expect(sends).toContainEqual(['outputs:app-mode',{mode:'test',onAir:true}]);
    manager.setAppMode({mode:'normal',onAir:true});
    expect(sends.at(-1)).toEqual(['outputs:app-mode',{mode:'normal',onAir:true}]);
  });
  it('ignores destroyed output windows',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});await manager.start({'1':'main'} as any,{});windows[0].destroyed=true;
    expect(()=>manager.setAppMode({mode:'test',onAir:false})).not.toThrow();
  });
});
