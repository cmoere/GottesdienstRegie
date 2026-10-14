import {describe,expect,it} from 'vitest';
import {initializePresentationStartup} from './presentationStartup';

function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return{promise,resolve}}

describe('presentation startup readiness',()=>{
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
