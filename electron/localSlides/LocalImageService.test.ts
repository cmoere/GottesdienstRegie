import {expect,it,vi} from 'vitest';
import sharp from 'sharp';
import {LocalImageService} from './LocalImageService';
it('keeps actual generated PNGs private until explicitly accepted and rejects arbitrary IDs',async()=>{
 const png=await sharp({create:{width:1024,height:576,channels:3,background:'#699f3e'}}).png().toBuffer(),save=vi.fn(async()=>({url:'gottesdienst-media://media/owned.png'}));
 const service=new LocalImageService({verifiedDirectory:async()=>'/owned/model'},async()=>png,save,()=>false);
 await expect(service.generate('<lora:bad>')).rejects.toThrow();expect(save).not.toHaveBeenCalled();
 const image=await service.generate('A peaceful church in a green landscape');expect(image.preview.startsWith('data:image/png;base64,')).toBe(true);expect(save).not.toHaveBeenCalled();
 await expect(service.accept(['../../outside'])).rejects.toThrow();expect(save).not.toHaveBeenCalled();
 expect(await service.accept([image.id])).toEqual(['gottesdienst-media://media/owned.png']);expect(save).toHaveBeenCalledTimes(1);
 service.discard();await expect(service.accept([image.id])).rejects.toThrow();
});
it('cancels at ON AIR and never saves a late image',async()=>{
 let blocked=false,finish!:(value:Buffer)=>void;
 const service=new LocalImageService({verifiedDirectory:async()=>'/owned'},async()=>new Promise<Buffer>(done=>{finish=done}),async()=>({url:'unused'}),()=>blocked);
 const pending=service.generate('A landscape');for(let i=0;i<8&&!finish;i++)await Promise.resolve();blocked=true;service.cancel();finish(Buffer.alloc(0));await expect(pending).rejects.toThrow();expect(service.busy).toBe(false);await expect(service.generate('A landscape')).rejects.toThrow();
});
it('discards an image when live mode begins during asynchronous PNG validation',async()=>{
 const png=await sharp({create:{width:1024,height:576,channels:3,background:'#608f9a'}}).png().toBuffer();let checks=0;const save=vi.fn(async()=>({url:'unused'})),service=new LocalImageService({verifiedDirectory:async()=>'/owned'},async()=>png,save,()=>++checks>3);await expect(service.generate('A quiet meadow')).rejects.toThrow('LOCAL_IMAGE_CANCELLED');expect(save).not.toHaveBeenCalled();expect(service.busy).toBe(false);
});
