import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {ExternalCache} from './cache';
import type {ExternalSnapshot} from '../../shared/externalLoop';

const directories:string[]=[];
afterEach(async()=>{for(const dir of directories.splice(0))await fs.rm(dir,{recursive:true,force:true})});
async function folder(){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'regie-external-cache-'));directories.push(dir);return dir}
const now=1_700_000_000_000;
function snapshot(key='news:wdr-owl',fetchedAt=now):ExternalSnapshot{return{version:1,key,revision:'abc',fetchedAt,stale:false,payload:{kind:'news',entries:[{id:'one',title:'Nachricht',source:'wdr-owl',publishedAt:null,url:'https://www1.wdr.de/news'}]}}}
describe('external loop snapshot cache',()=>{
 it('persists validated public data and expires beyond24hours',async()=>{
  const dir=await folder(),cache=new ExternalCache(dir,()=>now);await cache.write(snapshot());
  expect((await new ExternalCache(dir,()=>now+86400000).read('news:wdr-owl',86400000))?.payload).toMatchObject({kind:'news',entries:[{title:'Nachricht'}]});
  expect(await new ExternalCache(dir,()=>now+86400001).read('news:wdr-owl',86400000)).toBeNull();
  expect(await fs.readdir(dir)).toEqual([]);
 });
 it('rejectsWrongSchemaAndFutureCache',async()=>{
  const dir=await folder(),cache=new ExternalCache(dir,()=>now);await cache.write(snapshot());
  const [filename]=await fs.readdir(dir),file=path.join(dir,filename);
  for(const change of [{version:2},{fetchedAt:now+60001},{key:'news:other'},{payload:{kind:'news',entries:[{internalComment:'secret'}]}}]){
   await fs.writeFile(file,JSON.stringify({...snapshot(),...change}));
   expect(await new ExternalCache(dir,()=>now).read('news:wdr-owl',86400000)).toBeNull();
  }
 });
 it('validates writes and never propagates internal fields',async()=>{
  const dir=await folder(),cache=new ExternalCache(dir,()=>now);
  await expect(cache.write({...snapshot(),payload:{kind:'news',entries:[{id:'one',title:'News',source:'wdr-owl',publishedAt:null,url:'https://www1.wdr.de/news',internalComment:'private'}]}} as any)).rejects.toThrow('invalid-snapshot');
  expect(await fs.readdir(dir)).toEqual([]);
 });
 it('retains at most32keys without touching a sibling file',async()=>{
  const dir=await folder(),inside=path.join(dir,'cache'),cache=new ExternalCache(inside,()=>now);
  await fs.writeFile(path.join(dir,'keep.txt'),'keep');
  for(let i=0;i<34;i++)await cache.write(snapshot(`news:test-${i}`,now-i));
  expect((await fs.readdir(inside)).filter(name=>name.endsWith('.json'))).toHaveLength(32);
  expect(await fs.readFile(path.join(dir,'keep.txt'),'utf8')).toBe('keep');
 });
});
