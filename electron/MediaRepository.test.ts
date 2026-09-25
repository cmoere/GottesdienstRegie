import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach,describe,expect,it} from 'vitest';
import {MediaRepository} from './MediaRepository';

const roots:string[]=[];
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>fs.rm(root,{recursive:true,force:true})))});

describe('MediaRepository generated media',()=>{
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
