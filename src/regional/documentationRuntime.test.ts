import {expect,it} from 'vitest';
import {createDocumentationRuntime} from './documentationRuntime';
const source={help:{live:{title:'LIVE',body:'Ausgabe prüfen.'}},helpUI:{title:'Hilfe'},releases:{'versions[0.83].title':'Updates'}};
it('shares a lazy source request, retries failures and publishes a revision after a complete load',async()=>{
  let attempts=0;
  const runtime=createDocumentationRuntime(async()=>{attempts++;if(attempts===1)throw Error('not ready');return source},
    {ruhr:async()=>({id:'ruhr',...source}),berlin:async()=>({id:'berlin',...source})});
  expect(runtime.getSnapshot()).toBe(0);
  expect(await runtime.load('unknown')).toBe(false);expect(attempts).toBe(0);
  expect(await runtime.load('ruhr')).toBe(false);expect(runtime.getSnapshot()).toBe(0);
  const first=runtime.load('ruhr'),second=runtime.load('berlin');
  expect(await first).toBe(true);expect(await second).toBe(true);expect(attempts).toBe(2);
  expect(runtime.getSnapshot()).toBe(2);
  expect(runtime.get({language:'de',germanRegion:'ruhr'})?.id).toBe('ruhr');
  expect(runtime.get({language:'en',germanRegion:'ruhr'})).toBeUndefined();
});
