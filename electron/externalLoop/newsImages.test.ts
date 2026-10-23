import {describe,it,expect,vi} from 'vitest';
import sharp from 'sharp';
import {approvedImageUrl,createPreparedImageLoader} from './newsImages';
describe('central public image preparation',()=>{
 it('allows only source-specific HTTPS images and rasterizes wiki references through thumbnails',()=>{
  for(const url of ['http://i.imgur.com/a.png','https://localhost/a','file:///tmp/x','https://i.imgur.com@127.0.0.1/a','https://i.imgur.com:888/a'])expect(approvedImageUrl('football',url)).toBeNull();
  expect(approvedImageUrl('westfalen-blatt','https://i.imgur.com/a.png')).toBeNull();
  expect(approvedImageUrl('football','https://upload.wikimedia.org/wikipedia/commons/a/ab/Club.svg')).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Club.svg/250px-Club.svg.png');
 });
 it('returns actual bounded JPEG data, coalesces and never asks an output to fetch a URL',async()=>{
  const bytes=await sharp({create:{width:40,height:30,channels:3,background:'#699f3e'}}).png().toBuffer();let requests=0;
  const load=createPreparedImageLoader((async()=>{requests++;return new Response(bytes,{headers:{'content-type':'image/png'}})}) as typeof fetch);
  const [a,b]=await Promise.all([load('football','https://i.imgur.com/a.png',new AbortController().signal),load('football','https://i.imgur.com/a.png',new AbortController().signal)]);
  expect(a).toMatch(/^data:image\/jpeg;base64,\/9j\//);expect(a).toBe(b);expect(requests).toBe(1);
  expect((await sharp(Buffer.from(a!.split(',')[1],'base64')).metadata()).format).toBe('jpeg');
 });
 it('ends the ten-second image deadline even when a transport ignores AbortSignal',async()=>{
  vi.useFakeTimers();
  try{const load=createPreparedImageLoader(()=>new Promise<Response>(()=>{}));const pending=load('football','https://i.imgur.com/slow.png',new AbortController().signal);await vi.advanceTimersByTimeAsync(10001);expect(await Promise.race([pending,Promise.resolve('still pending')])).toBeNull()}finally{vi.useRealTimers()}
 });
 it('rejects wrong MIME, oversized responses, cross-origin redirects, bad image bytes and cancellation',async()=>{
  for(const response of [new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}}),new Response('x',{headers:{'content-type':'image/png','content-length':'4194305'}}),new Response(null,{status:302,headers:{location:'https://localhost/private'}}),new Response('not a PNG',{headers:{'content-type':'image/png'}})]){
   const load=createPreparedImageLoader(async()=>response);expect(await load('football','https://i.imgur.com/x.png',new AbortController().signal)).toBeNull();
  }
  let reads=0;const abort=new AbortController();abort.abort();expect(await createPreparedImageLoader(async()=>{reads++;return new Response()} )('football','https://i.imgur.com/x.png',abort.signal)).toBeNull();expect(reads).toBe(0);
 });
 it('compresses an ordinary detailed photograph to the prepared limit instead of silently discarding it',async()=>{
  const raw=Buffer.alloc(1280*960*3);let seed=7;for(let i=0;i<raw.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;raw[i]=seed>>>24}
  const bytes=await sharp(raw,{raw:{width:1280,height:960,channels:3}}).jpeg({quality:95}).toBuffer();
  const load=createPreparedImageLoader(async()=>new Response(bytes,{headers:{'content-type':'image/jpeg'}}));
  const image=await load('westfalen-blatt','https://asc-images.forward-publishing.io/detailed.jpg',new AbortController().signal);
  expect(image).toMatch(/^data:image\/jpeg;base64,/);const decoded=Buffer.from(image!.split(',')[1],'base64');expect(decoded.length).toBeLessThanOrEqual(98304);expect((await sharp(decoded).metadata()).width).toBeGreaterThanOrEqual(640);
 });
});
