import {describe,it,expect,vi} from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {SlideModelPack} from './SlideModelPack';
describe('local slide model pack integrity and lifecycle',()=>{
 const bytes=Buffer.from('owned model fixture');
 const descriptor={model:'owned/model',revision:'a'.repeat(40),licenseText:'Owned test model license',files:[{name:'onnx/model_quantized.onnx',size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}]};
 it('marks ready only after verified atomic download and rejects same-size tampering',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-'));
  const pack=new SlideModelPack(root,descriptor,async()=>new Response(bytes));
  expect((await pack.status()).state).toBe('missing');await pack.download();expect((await pack.status()).state).toBe('ready');
  const directory=await pack.verifiedDirectory();expect(await fs.readFile(path.join(directory,'LICENSE.txt'),'utf8')).toBe(descriptor.licenseText);await fs.writeFile(path.join(directory,descriptor.files[0].name),Buffer.alloc(bytes.length));
  await expect(pack.verifiedDirectory()).rejects.toThrow('SLIDE_MODEL_CORRUPT');await pack.remove();expect((await pack.status()).state).toBe('missing');
 });
 it('never exposes an interrupted partial model as ready',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-'));
  let started!:()=>void;const began=new Promise<void>(done=>{started=done});
  const pack=new SlideModelPack(root,descriptor,async(_url,init)=>{started();return new Promise<Response>((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(Error('aborted'))))});
  const pending=pack.download();await began;expect((await pack.status()).state).toBe('downloading');pack.cancel();await expect(pending).rejects.toThrow();expect((await pack.status()).state).toBe('missing');
 });
 it('interrupts verification before hashing large model files when live output begins',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-'));const pack=new SlideModelPack(root,descriptor,async()=>new Response(bytes));await pack.download();const controller=new AbortController();controller.abort();await expect(pack.verifiedDirectory(controller.signal)).rejects.toThrow('SLIDE_MODEL_CANCELLED');await pack.remove();
 });
 it('rejects corrupt downloads and unsafe descriptor file paths before writing',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-'));
  const pack=new SlideModelPack(root,descriptor,async()=>new Response(Buffer.alloc(bytes.length)));
  await expect(pack.download()).rejects.toThrow();expect((await pack.status()).state).not.toBe('ready');
  expect(()=>new SlideModelPack(root,{...descriptor,files:[{...descriptor.files[0],name:'../escape'}]},async()=>new Response(bytes))).toThrow();
 });
 it('removes an obsolete model revision too when the operator removes the replacement',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-')),old='b'.repeat(40);await fs.mkdir(path.join(root,old));await fs.writeFile(path.join(root,old,'old.onnx'),bytes);
  const pack=new SlideModelPack(root,{...descriptor,previousRevisions:[old]},async()=>new Response(bytes));await pack.download();await pack.remove();await expect(fs.stat(path.join(root,old))).rejects.toThrow();expect(()=>new SlideModelPack(root,{...descriptor,previousRevisions:['../outside']})).toThrow();
 });
 it('tolerates transient Windows scanner locks at the verified model commit without refetching',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-')),request=vi.fn(async()=>new Response(bytes)),pack=new SlideModelPack(root,descriptor,request),rename=fs.rename.bind(fs);let attempts=0;const spy=vi.spyOn(fs,'rename').mockImplementation(async(source,target)=>{if(String(source).startsWith(root)&&++attempts<3)throw Object.assign(Error('scanner lock'),{code:'EPERM'});return rename(source,target)});
  try{await pack.download();expect((await pack.status()).state).toBe('ready');expect(request).toHaveBeenCalledTimes(1);expect(attempts).toBeGreaterThanOrEqual(3)}finally{spy.mockRestore();await fs.rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
 });
 it('cleans interrupted owned downloads on retry/removal while leaving unrelated folders alone',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-')),orphan=path.join(root,'download-12345678-1234-1234-1234-123456789abc'),keep=path.join(root,'keep-extra');await fs.mkdir(orphan);await fs.writeFile(path.join(orphan,'partial.bin'),bytes);await fs.mkdir(keep);const pack=new SlideModelPack(root,descriptor,async()=>new Response(bytes));try{await pack.download();await expect(fs.stat(orphan)).rejects.toThrow();expect((await fs.stat(keep)).isDirectory()).toBe(true);await fs.mkdir(orphan);await pack.remove();await expect(fs.stat(orphan)).rejects.toThrow();expect((await fs.stat(keep)).isDirectory()).toBe(true)}finally{await fs.rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
 });
});
