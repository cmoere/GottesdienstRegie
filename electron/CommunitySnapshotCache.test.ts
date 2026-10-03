import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CommunitySnapshotCache} from './CommunitySnapshotCache';

const dirs:string[]=[];
afterEach(async()=>{await Promise.all(dirs.splice(0).map(dir=>fs.rm(dir,{recursive:true,force:true})))});

describe('CommunitySnapshotCache',()=>{
  it('persists and restores an atomic snapshot with age/status',async()=>{
    const dir=await fs.mkdtemp(path.join(os.tmpdir(),'gr-community-'));dirs.push(dir);
    const cache=new CommunitySnapshotCache(path.join(dir,'snapshot.json'),()=>1_000);
    await cache.write({events:[{eventKey:'event'}],rooms:[{roomId:'-room',raumname:'Saal'}],announcements:[{messageId:'message'}]});
    const restored=await cache.read(()=>true);
    expect(restored).toMatchObject({mode:'offline-cache',updatedAt:1000,ageMs:0,events:[{eventKey:'event'}],rooms:[{roomId:'-room',raumname:'Saal'}]});
  });

  it('filters records that are no longer fachlich valid and reports empty',async()=>{
    const dir=await fs.mkdtemp(path.join(os.tmpdir(),'gr-community-'));dirs.push(dir);
    const cache=new CommunitySnapshotCache(path.join(dir,'snapshot.json'));
    await cache.write({events:[{eventKey:'old'}],rooms:[],announcements:[{messageId:'expired'}]});
    const restored=await cache.read(()=>false);
    expect(restored).toMatchObject({mode:'empty',events:[],rooms:[],announcements:[]});
  });

  it('returns empty for a missing or corrupt cache',async()=>{
    const dir=await fs.mkdtemp(path.join(os.tmpdir(),'gr-community-'));dirs.push(dir);
    const cache=new CommunitySnapshotCache(path.join(dir,'snapshot.json'));
    expect(await cache.read(()=>true)).toMatchObject({mode:'empty',events:[],rooms:[],announcements:[]});
  });
});
