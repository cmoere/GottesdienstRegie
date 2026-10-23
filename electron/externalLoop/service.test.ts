import {describe,expect,it} from 'vitest';
import {ExternalLoopService} from './service';

describe('one external loop service owns the news lifecycle',()=>{
 it('returns public news and cancels pending work on disposal',async()=>{
  const service=new ExternalLoopService({cacheDirectory:null,fetchText:async()=>'<rss><channel><item><title>Nachricht</title><link>https://www.westfalen-blatt.de/a</link></item></channel></rss>'});
  expect((await service.read({kind:'news',sources:['wdr-owl']})).snapshot?.payload).toMatchObject({entries:[{title:'Nachricht'}]});
  service.dispose();expect(await service.read({kind:'news',sources:['wdr-owl']})).toEqual({snapshot:null,status:'unavailable'});
  let cancelled=false;
  const pendingService=new ExternalLoopService({cacheDirectory:null,fetchText:(_url,signal)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{cancelled=true;reject(Error('cancelled'))}))});
  const result=pendingService.read({kind:'news',sources:['wdr-owl']});await new Promise(resolve=>setTimeout(resolve,0));pendingService.dispose();
  expect(await result).toEqual({snapshot:null,status:'unavailable'});expect(cancelled).toBe(true);
 });
});
