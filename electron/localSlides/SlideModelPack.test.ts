import {describe,it,expect} from 'vitest';
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
 it('rejects corrupt downloads and unsafe descriptor file paths before writing',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-slide-pack-'));
  const pack=new SlideModelPack(root,descriptor,async()=>new Response(Buffer.alloc(bytes.length)));
  await expect(pack.download()).rejects.toThrow();expect((await pack.status()).state).not.toBe('ready');
  expect(()=>new SlideModelPack(root,{...descriptor,files:[{...descriptor.files[0],name:'../escape'}]},async()=>new Response(bytes))).toThrow();
 });
});
