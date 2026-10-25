import {expect,it,vi} from 'vitest';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {AdvertisingService} from './service';
it('downloads bounded creatives into local media and coalesces repeated campaign preparation',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'regie-ad-test-')),xml='<VAST><Ad><InLine><AdTitle>Partner</AdTitle><Creatives><Creative><Linear><Duration>00:00:15</Duration><MediaFiles><MediaFile type="video/mp4">https://cdn.example/spot.mp4</MediaFile></MediaFiles></Linear></Creative></Creatives></InLine></Ad></VAST>',mp4=Buffer.concat([Buffer.from([0,0,0,20]),Buffer.from('ftypisom00000000')]);
 const fetch=vi.fn(async(url:string)=>({bytes:url.includes('/vast')?Buffer.from(xml):mp4,type:url.includes('/vast')?'application/xml':'video/mp4'})),service=new AdvertisingService(path.join(folder,'files'),fetch,()=>1000),source={kind:'vast',url:'https://ads.example/vast'};
 const [first,second]=await Promise.all([service.read(source),service.read(source)]);expect(first).toEqual(second);expect(fetch).toHaveBeenCalledTimes(2);expect(first.creatives[0]).toMatchObject({title:'Partner',kind:'video',durationSeconds:15});const name=first.creatives[0].url.split('/').at(-1)!;expect(await readFile(path.join(folder,'files',name))).toEqual(mp4);expect(await service.read(source)).toEqual(first);expect(fetch).toHaveBeenCalledTimes(2);
});
