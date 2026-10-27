import {expect,it,vi} from 'vitest';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {readPowerPointThumbnail} from './PowerPointThumbnailReader';
it('returns only bounded cached PNG data for a verified source slide and rejects paths and foreign slides',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gdr-ppt-thumbnail-')),hash='a'.repeat(64),source=vi.fn(async()=>({inspection:{slides:[{sourceId:'256'}]}}));
 try{
  await expect(readPowerPointThumbnail(root,source as any,'../escape',256)).rejects.toThrow('POWERPOINT_THUMBNAIL_INVALID');expect(source).not.toHaveBeenCalled();
  expect(await readPowerPointThumbnail(root,source as any,hash,256)).toBeNull();
  const folder=path.join(root,'powerpoint-thumbnails',hash);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'256.png'),Buffer.from('89504e470d0a1a0a','hex'));
  expect(await readPowerPointThumbnail(root,source as any,hash,256)).toBe('data:image/png;base64,iVBORw0KGgo=');
  await expect(readPowerPointThumbnail(root,source as any,hash,257)).rejects.toThrow('POWERPOINT_SLIDE_MISSING');
  await fs.writeFile(path.join(folder,'256.png'),'not an image');await expect(readPowerPointThumbnail(root,source as any,hash,256)).rejects.toThrow('POWERPOINT_THUMBNAIL_INVALID');
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
