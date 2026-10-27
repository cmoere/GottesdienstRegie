import {expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const runtimeRequire=createRequire(path.resolve(process.cwd(),'package.json'));
it('builds a sandbox-compatible product preload and only private GPU runtime modules',async()=>{
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'gdr-production-preload-'));
 try{
  await promisify(execFile)(process.execPath,['-e',"require('./scripts/bundle-desktop-runtime.cjs').bundleDesktopRuntime({outdir:process.argv[1]}).catch(e=>{console.error(e);process.exitCode=1})",folder],{cwd:process.cwd()});
  const preload=await fs.readFile(path.join(folder,'electron/preload.js'),'utf8');
  expect(preload).toContain('powerpoint:receiver-boot');
  expect(preload).toContain('powerpoint:frame-ack');
  expect(preload).toContain('setSharedTextureReceiver');
  expect([...preload.matchAll(/require\(["']([^"']+)["']\)/g)].map(match=>match[1])).toEqual(['electron']);
  const modules=await fs.readdir(path.join(folder,'electron/powerpoint-runtime'));
  expect(modules.sort()).toEqual(['frame-broker.cjs','managed-texture.cjs','producer-client.cjs']);
  for(const name of modules){const runtime=runtimeRequire(path.join(folder,'electron/powerpoint-runtime',name));expect(Object.values(runtime).some(value=>typeof value==='function')).toBe(true)}
 }finally{await fs.rm(folder,{recursive:true,force:true})}
});
