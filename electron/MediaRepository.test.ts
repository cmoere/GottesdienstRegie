import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach,describe,expect,it} from 'vitest';
import {MediaRepository} from './MediaRepository';

const roots:string[]=[];
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>fs.rm(root,{recursive:true,force:true})))});

describe('MediaRepository generated media',()=>{
  it('retains every asset when overlapping imports finish together',async()=>{
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'gr-media-'));roots.push(root);
    const repository=new MediaRepository(root);
    const results=await Promise.allSettled(Array.from({length:8},(_,index)=>repository.importGenerated({name:'Parallel '+index,kind:'image',extension:'svg',data:Buffer.from('<svg>'+index+'</svg>')})));
    expect(results.every(result=>result.status==='fulfilled')).toBe(true);
    expect(await repository.list()).toHaveLength(8);
  });
  it('continues after a failed write and retains concurrent metadata changes',async()=>{
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'gr-media-'));roots.push(root);const repository=new MediaRepository(root);
    await expect(repository.update('missing',{favorite:true})).rejects.toThrow('MEDIA_NOT_FOUND');
    const asset=await repository.importGenerated({name:'Test',kind:'image',extension:'svg',data:Buffer.from('<svg/>')});
    await Promise.all([repository.update(asset.id,{favorite:true}),repository.markUsed(asset.id,'2026-11-03T08:00:00Z'),repository.update(asset.id,{syncState:'synced'})]);
    expect((await repository.list())[0]).toMatchObject({favorite:true,lastUsedAt:'2026-11-03T08:00:00Z',syncState:'synced'});
  });
  it('persists a generated asset only when explicitly saved',async()=>{
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'gr-media-'));roots.push(root);
    const repository=new MediaRepository(root);
    expect(await repository.list()).toEqual([]);
    const saved=await repository.importGenerated({name:'Abendhimmel',kind:'image',extension:'svg',data:Buffer.from('<svg/>'),tags:['KI-generiert']});
    expect(saved.name).toBe('Abendhimmel');
    expect(saved.aiGenerated).toBe(true);
    expect(saved.syncState).toBe('local-only');
    expect((await repository.list()).map(asset=>asset.id)).toEqual([saved.id]);
    expect(await fs.readFile(path.join(repository.directory,saved.fileName),'utf8')).toBe('<svg/>');
  });
});
