import {describe,expect,it} from 'vitest';
import {initializePresentationStartup,prepareStartupSession} from './presentationStartup';

function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return{promise,resolve}}

describe('presentation startup readiness',()=>{
  it('does not let optional device/version/network queries block an authenticated document',async()=>{
    const stalled=deferred<unknown>(),events:string[]=[];
    const session=prepareStartupSession(Promise.resolve('authenticated'),[
      ()=>stalled.promise,
      ()=>Promise.reject(Error('offline')),
      ()=>{throw Error('optional IPC unavailable')},
    ]);
    await initializePresentationStartup(session,Promise.resolve('document'),Promise.resolve(null),value=>events.push(value));
    expect(events).toEqual(['document']);
    expect(await session).toBe('authenticated');
  });
  it('preserves authentication as a required boundary even when optional queries finish',async()=>{
    const authentication=deferred<string>(),events:string[]=[];
    const session=prepareStartupSession(authentication.promise,[()=>Promise.resolve('devices')]);
    const ready=initializePresentationStartup(session,Promise.resolve('document'),Promise.resolve(null),()=>events.push('applied'));
    await Promise.resolve();await Promise.resolve();expect(events).toEqual([]);
    authentication.resolve('authenticated');expect(await ready).toBe('authenticated');expect(events).toEqual(['applied']);
  });
  it('keeps startup pending after authentication until loading and the recovery decision complete',async()=>{
    const load=deferred<string>(),recovery=deferred<string>();
    const events:string[]=[];
    const ready=initializePresentationStartup(Promise.resolve('authenticated'),load.promise,recovery.promise,(document,offer)=>{
      events.push(`loaded ${document}`,`decided ${offer}`);
    });
    void ready.then(session=>events.push(`opened ${session}`));
    await Promise.resolve();await Promise.resolve();
    expect(events).toEqual([]);
    load.resolve('saved document');
    await Promise.resolve();await Promise.resolve();
    expect(events).toEqual([]);
    recovery.resolve('recovery offer');
    await ready;
    expect(events).toEqual(['loaded saved document','decided recovery offer','opened authenticated']);
  });
});
