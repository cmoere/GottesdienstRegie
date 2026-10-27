import {beforeEach,describe,expect,it,vi} from 'vitest';

const sends:unknown[][]=[],windows:any[]=[];
vi.mock('electron',()=>({
  screen:{getAllDisplays:()=>[{id:1,bounds:{x:0,y:0,width:1920,height:1080},label:'MAIN'},{id:2,bounds:{x:1920,y:0,width:1920,height:1080},label:'STAGE'}],getPrimaryDisplay:()=>({id:1})},
  BrowserWindow:class{
    destroyed=false;webContents={id:windows.length+1,send:(...args:unknown[])=>sends.push(args),insertCSS:vi.fn()};
    shown=false;constructor(public options:any){windows.push(this)}setMenu(){}on(){}showInactive(){this.shown=true}setFullScreen(){}close(){this.destroyed=true}isDestroyed(){return this.destroyed}loadURL(){return Promise.resolve()}
  },
}));
import {OutputWindowManager} from './OutputWindowManager';

describe('OutputWindowManager app mode',()=>{
  beforeEach(()=>{sends.length=0;windows.length=0});
  it('offers only live managed windows to the Main-only native composition controller',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});
    await manager.start({'1':'main','2':'stage'} as any,{});
    expect(manager.getNativeCompositionWindows().map(entry=>entry.role)).toEqual(['main','stage']);
    windows[0].destroyed=true;
    expect(manager.getNativeCompositionWindows().map(entry=>entry.role)).toEqual(['stage']);
  });
  it('keeps live renderer scheduling enabled even when an output is covered or inactive',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});
    await manager.start({'1':'main'} as any,{id:'slide'});
    expect(windows[0].options.webPreferences.backgroundThrottling).toBe(false);
  });
  it('keeps all outputs hidden until every assigned window has loaded',async()=>{
    let finish!:()=>void;const pending=new Promise<void>(resolve=>{finish=resolve});
    const manager=new OutputWindowManager('preload',async(_window,route)=>{if(route.includes('stage'))await pending},()=>{});
    const started=manager.start({'1':'main','2':'stage'} as any,{id:'slide'});
    for(let i=0;i<8&&windows.length<2;i++)await Promise.resolve();
    expect(windows).toHaveLength(2);expect(windows.every(window=>!window.shown)).toBe(true);
    finish();await started;expect(windows.every(window=>window.shown)).toBe(true);
  });
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
  it('restores latest state after late subscription and rejects unknown senders',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});
    await manager.start({'1':'main'} as any,{id:'first'});
    manager.send({id:'latest'});manager.sendQuick(['main'],{type:'black'});
    const state=manager.getStateForSender(1);
    expect(state?.slide).toEqual({id:'latest'});expect(state?.quick).toEqual({type:'black'});
    expect(manager.getStateForSender(999)).toBeNull();
    manager.sendQuick(['stage'],{type:'logo'});
    expect(manager.getStateForSender(1)?.quick).toEqual({type:'black'});
    manager.sendQuick(['main'],null);
    expect(manager.getStateForSender(1)?.quick).toBeNull();
    expect(manager.getStateForSender(1)!.revision).toBeGreaterThan(state!.revision);
    windows[0].destroyed=true;expect(manager.getStateForSender(1)).toBeNull();
  });
  it('anchors externally triggered quick countdowns once for every assigned output',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});await manager.start({'1':'main','2':'stage'} as any,{});
    manager.sendQuick(['main','stage'],{type:'countdown',duration:60});
    const main=manager.getStateForSender(1)!.quick as any,stage=manager.getStateForSender(2)!.quick as any;
    expect(Number.isFinite(main.startedAtMs)).toBe(true);expect(stage.startedAtMs).toBe(main.startedAtMs);
    manager.sendQuick(['main'],{type:'countdown',duration:60,startedAtMs:1234});expect((manager.getStateForSender(1)!.quick as any).startedAtMs).toBe(1234);
  });
  it('accepts test results only from the current managed MAIN and its exact active run/pattern',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});await manager.start({'1':'main','2':'stage'} as any,{});
    const runId='a'.repeat(32),result={runId,pattern:'bars',ok:true,width:1920,height:1080,frames:300,elapsedMs:5100};
    manager.sendQuick(['main'],{type:'screenTest',testRunId:runId,testPattern:'bars'});
    expect(manager.acceptScreenTestResult(1,result)).toEqual(result);
    expect(manager.acceptScreenTestResult(2,result)).toBeNull();expect(manager.acceptScreenTestResult(999,result)).toBeNull();
    expect(manager.acceptScreenTestResult(1,{...result,runId:'b'.repeat(32)})).toBeNull();
    expect(manager.acceptScreenTestResult(1,{...result,pattern:'white'})).toBeNull();
    expect(manager.acceptScreenTestResult(1,{...result,frames:1})).toBeNull();
    manager.sendQuick(['main'],{type:'black'});expect(manager.acceptScreenTestResult(1,result)).toBeNull();
    windows[0].destroyed=true;expect(manager.acceptScreenTestResult(1,result)).toBeNull();
  });
  it('atomically restores only its own active test, never a later remote emergency screen',async()=>{
    const manager=new OutputWindowManager('preload',async()=>{},()=>{});await manager.start({'1':'main','2':'stage'} as any,{});
    const runId='a'.repeat(32),previous={type:'custom',text:'Vorher'};
    manager.sendQuick(['main'],{type:'screenTest',testRunId:runId,testPattern:'bars'});
    expect(manager.restoreScreenTest('b'.repeat(32),previous)).toBe(false);
    manager.sendQuick(['main'],{type:'black'});
    expect(manager.restoreScreenTest(runId,previous)).toBe(false);expect(manager.getStateForSender(1)?.quick).toEqual({type:'black'});
    manager.sendQuick(['main'],{type:'screenTest',testRunId:runId,testPattern:'bars'});
    expect(manager.restoreScreenTest(runId,previous)).toBe(true);expect(manager.getStateForSender(1)?.quick).toEqual(previous);
    expect(manager.getStateForSender(2)?.quick).toBeNull();
    manager.sendQuick(['main'],{type:'screenTest',testRunId:runId,testPattern:'bars'});
    expect(manager.restoreScreenTest(runId,null)).toBe(true);expect(manager.getStateForSender(1)?.quick).toBeNull();
  });
});
