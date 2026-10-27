import fs from 'node:fs/promises';import path from 'node:path';
import type {PowerPointSourceStore} from './PowerPointSourceStore';
export async function readPowerPointThumbnail(root:string,source:PowerPointSourceStore['get'],hash:string,slideId:number){
 if(!/^[a-f0-9]{64}$/.test(hash)||!Number.isSafeInteger(slideId)||slideId<1||slideId>2147483647)throw Error('POWERPOINT_THUMBNAIL_INVALID');
 const original=await source(hash);
 if(!original.inspection.slides.some(slide=>slide.sourceId===String(slideId)))throw Error('POWERPOINT_SLIDE_MISSING');
 const cache=path.join(root,'powerpoint-thumbnails'),folder=path.join(cache,hash),filename=path.join(folder,slideId+'.png');
 try{
  for(const directory of[cache,folder]){const stat=await fs.lstat(directory);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('POWERPOINT_THUMBNAIL_INVALID')}
  const stat=await fs.lstat(filename);if(stat.isSymbolicLink()||!stat.isFile()||stat.size<8||stat.size>16*1024*1024)throw Error('POWERPOINT_THUMBNAIL_INVALID');
  const bytes=await fs.readFile(filename);
  if(bytes.length!==stat.size||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('POWERPOINT_THUMBNAIL_INVALID');
  return 'data:image/png;base64,'+bytes.toString('base64');
 }catch(error:any){if(error?.code==='ENOENT')return null;throw Error('POWERPOINT_THUMBNAIL_INVALID')}
}
