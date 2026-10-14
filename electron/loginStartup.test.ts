import {describe,expect,it,vi} from 'vitest';
import {loginItemSettings,resolveLoginStartup,runBackgroundUpdateCheck,validateLoginPreferences,shouldCheckAfterWorkspace} from './loginStartup';

describe('Windows login startup',()=>{
  it('honors the separate login update setting when opening the full app at login',()=>{
    expect(shouldCheckAfterWorkspace(['--login-startup'],{automaticUpdates:false,checkUpdatesAtLogin:true})).toBe(true);
    expect(shouldCheckAfterWorkspace([],{automaticUpdates:false,checkUpdatesAtLogin:true})).toBe(false);
    expect(shouldCheckAfterWorkspace([],{automaticUpdates:true,checkUpdatesAtLogin:false})).toBe(true);
  });
  it('registers only one login command and lets opening the app win',()=>{
    expect(loginItemSettings({openAtLogin:false,checkUpdatesAtLogin:false})).toEqual({openAtLogin:false,args:['--login-startup']});
    expect(loginItemSettings({openAtLogin:true,checkUpdatesAtLogin:true})).toEqual({openAtLogin:true,args:['--login-startup']});
    expect(resolveLoginStartup(['--login-startup'],{openAtLogin:true,checkUpdatesAtLogin:true})).toBe('normal');
    expect(resolveLoginStartup(['--login-startup'],{openAtLogin:false,checkUpdatesAtLogin:true})).toBe('background');
    expect(resolveLoginStartup(['--login-startup'],{openAtLogin:false,checkUpdatesAtLogin:false})).toBe('exit');
    expect(resolveLoginStartup([],{openAtLogin:false,checkUpdatesAtLogin:true})).toBe('normal');
  });
  it('accepts only boolean login preferences at the IPC boundary',()=>{
    expect(validateLoginPreferences({openAtLogin:'true',checkUpdatesAtLogin:1})).toEqual({});
    expect(validateLoginPreferences({openAtLogin:false,checkUpdatesAtLogin:true,unexpected:true})).toEqual({openAtLogin:false,checkUpdatesAtLogin:true});
    expect(validateLoginPreferences(null)).toEqual({});
  });
  it('notifies once about an available update then exits without starting the app',async()=>{
    const effects:string[]=[];
    await runBackgroundUpdateCheck({check:async()=>({state:'available',version:'0.81.0'}),notify:version=>effects.push(`notify:${version}`),shouldOpen:()=>false,open:()=>{effects.push('open')},quit:()=>{effects.push('quit')}});
    expect(effects).toEqual(['notify:0.81.0','quit']);
  });
  it('exits on check failure and does not show a window',async()=>{
    const effects:string[]=[];
    await runBackgroundUpdateCheck({check:async()=>{throw Error('offline')},notify:()=>effects.push('notify'),shouldOpen:()=>false,open:()=>{effects.push('open')},quit:()=>{effects.push('quit')}});
    expect(effects).toEqual(['quit']);
  });
  it('opens one normal app when a manual launch arrives during the background check',async()=>{
    const effects:string[]=[];
    await runBackgroundUpdateCheck({check:async()=>({state:'available',version:'0.81.0'}),notify:()=>effects.push('notify'),shouldOpen:()=>true,open:()=>{effects.push('open')},quit:()=>{effects.push('quit')}});
    expect(effects).toEqual(['open']);
  });
  it('bounds a stalled network check so the login process cannot become a daemon',async()=>{
    vi.useFakeTimers();
    try{
      const effects:string[]=[];
      const done=runBackgroundUpdateCheck({check:()=>new Promise(()=>{}),notify:()=>effects.push('notify'),shouldOpen:()=>false,open:()=>{effects.push('open')},quit:()=>{effects.push('quit')}},30000);
      await vi.advanceTimersByTimeAsync(30000);await done;
      expect(effects).toEqual(['quit']);
    }finally{vi.useRealTimers()}
  });
  it('opens immediately on a manual launch during a hung check and never quits after its late result',async()=>{
    vi.useFakeTimers();
    try{
      const effects:string[]=[];
      let requestOpen!:()=>void,finishCheck!:(status:{state:string;version:string})=>void;
      let requested=false,checks=0;
      const openRequested=new Promise<void>(resolve=>{requestOpen=()=>{requested=true;resolve()}});
      const done=runBackgroundUpdateCheck({check:()=>{checks++;return new Promise(resolve=>{finishCheck=resolve})},openRequested,notify:()=>effects.push('notify'),shouldOpen:()=>requested,open:()=>{effects.push('open')},quit:()=>{effects.push('quit')}});
      requestOpen();
      await vi.advanceTimersByTimeAsync(0);
      expect(effects).toEqual(['open']);
      await done;
      finishCheck({state:'available',version:'0.81.0'});
      await vi.advanceTimersByTimeAsync(30000);
      expect(effects).toEqual(['open']);
      expect(checks).toBe(1);
    }finally{vi.useRealTimers()}
  });
});
