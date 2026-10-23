import {afterEach,describe,expect,it,vi} from 'vitest';
import {createBoundedFetcher} from './http';

afterEach(()=>vi.useRealTimers());
describe('external loop bounded HTTP',()=>{
 it('accepts approved HTTPS sources and rejects hostile URLs before transport',async()=>{
  const read=createBoundedFetcher(async()=>new Response('news'));
  expect(await read('https://www1.wdr.de/test',new AbortController().signal)).toBe('news');
  for(const url of ['http://www1.wdr.de/test','https://127.0.0.1/test','https://www1.wdr.de.evil.test/','https://user:secret@www1.wdr.de/','https://www1.wdr.de:8443/'])await expect(read(url,new AbortController().signal)).rejects.toThrow('blocked-url');
 });
 it('rejects redirects to another host or local address',async()=>{
  for(const location of ['https://127.0.0.1/','https://api.openligadb.de/','http://www1.wdr.de/']){
   const read=createBoundedFetcher(async()=>new Response(null,{status:302,headers:{location}}));
   await expect(read('https://www1.wdr.de/feed',new AbortController().signal)).rejects.toThrow('blocked-redirect');
  }
 });
 it('follows bounded same-host redirects without accepting a loop',async()=>{
  const read=createBoundedFetcher(async url=>new URL(String(url)).pathname==='/a'?new Response(null,{status:302,headers:{location:'/b'}}):new Response('done'));
  expect(await read('https://www1.wdr.de/a',new AbortController().signal)).toBe('done');
  const loop=createBoundedFetcher(async()=>new Response(null,{status:302,headers:{location:'/again'}}));
  await expect(loop('https://www1.wdr.de/a',new AbortController().signal)).rejects.toThrow('redirect-limit');
 });
 it('enforces the size limit on streamed bytes even without content-length',async()=>{
  const read=createBoundedFetcher(async()=>new Response('x'.repeat(2*1024*1024+1)));
  await expect(read('https://www1.wdr.de/feed',new AbortController().signal)).rejects.toThrow('size-limit');
 });
 it('times out a stalled request and preserves explicit cancellation',async()=>{
  vi.useFakeTimers();
  const read=createBoundedFetcher((_url,options)=>new Promise((_resolve,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted')))));
  const promise=read('https://www1.wdr.de/feed',new AbortController().signal);
  const check=expect(promise).rejects.toThrow('timeout');
  await vi.advanceTimersByTimeAsync(10000);await check;
  const controller=new AbortController();controller.abort();
  await expect(read('https://www1.wdr.de/feed',controller.signal)).rejects.toThrow('cancelled');
 });
 it('rejects non-success responses and XML decoding errors',async()=>{
  await expect(createBoundedFetcher(async()=>new Response('no',{status:503}))('https://www1.wdr.de/feed',new AbortController().signal)).rejects.toThrow('http-status');
  await expect(createBoundedFetcher(async()=>new Response(new Uint8Array([255])))('https://www1.wdr.de/feed',new AbortController().signal)).rejects.toThrow();
 });
 it('cancels a stalled body when the whole-request deadline expires',async()=>{
  vi.useFakeTimers();let cancelled=false;
  const body=new ReadableStream<Uint8Array>({cancel(){cancelled=true}});
  const read=createBoundedFetcher(async()=>new Response(body));
  const check=expect(read('https://www1.wdr.de/feed',new AbortController().signal)).rejects.toThrow('timeout');
  await vi.advanceTimersByTimeAsync(10000);await check;expect(cancelled).toBe(true);
 });
});
