import {expect,it,vi} from 'vitest';
import type {AnnouncementGong} from '../../src/announcements/settings';
import {SharedAnnouncementGong} from './SharedAnnouncementGong';

it('shares a confirmed selection with another PC and keeps its last value offline',async()=>{
  let shared:AnnouncementGong='classic';
  let online=true;
  const sha='a'.repeat(40);
  const fetcher=vi.fn(async(url:string,init?:RequestInit)=>{
    if(!online) throw Error('offline');
    if(init?.method==='PUT'){
      const request=JSON.parse(String(init.body));
      expect(request.sha).toBe(sha);
      shared=JSON.parse(Buffer.from(request.content,'base64').toString()).gongId;
      return new Response('{}');
    }
    if(url.includes('api.github.com'))return Response.json({sha,content:Buffer.from(JSON.stringify({gongId:shared})).toString('base64')});
    return Response.json({gongId:shared});
  });
  function pc(credential:string|null){
    let saved:AnnouncementGong|undefined;
    return new SharedAnnouncementGong({
      readSharedGong:async()=>saved,
      writeSharedGong:async gong=>{saved=gong},
    },async()=>credential,fetcher as typeof fetch);
  }
  const writer=pc('test-credential'),reader=pc(null);
  expect(await reader.read()).toBe('classic');
  await expect(reader.write('soft')).rejects.toThrow('SHARED_GONG_WRITE_PERMISSION');
  await expect(writer.write('../gong.wav')).rejects.toThrow('INVALID_SHARED_GONG');
  expect(await writer.write('bright')).toBe('bright');
  expect(await reader.read()).toBe('bright');
  online=false;
  expect(await reader.read()).toBe('bright');
});
