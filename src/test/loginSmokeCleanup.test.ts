import {afterEach,describe,expect,it} from 'vitest';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {cleanupProfile}=require('../../tests/smoke/run-login-profile.cjs');
const created:string[]=[];
afterEach(()=>{for(const dir of created.splice(0))fs.rmSync(dir,{recursive:true,force:true})});
function profile(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'regie-login-smoke-'));created.push(dir);fs.writeFileSync(path.join(dir,'lockfile'),'test');return dir}
describe('login smoke profile lifecycle',()=>{
  it('never removes a profile until its child has exited',async()=>{
    const dir=profile();expect(await cleanupProfile(dir,{childExited:false})).toBe(false);expect(fs.existsSync(dir)).toBe(true);
  });
  it('rejects roots, workspace paths and non-owned profile names',async()=>{
    for(const dir of [os.tmpdir(),process.cwd(),path.parse(os.tmpdir()).root,path.join(os.tmpdir(),'real-user-profile'),path.join(os.tmpdir(),'regie-login-smoke-x','nested')]){
      let removed=false;expect(await cleanupProfile(dir,{childExited:true,remove:()=>{removed=true}})).toBe(false);expect(removed).toBe(false);
    }
  });
  it('removes only a validated test profile after child exit',async()=>{
    const dir=profile();expect(await cleanupProfile(dir,{childExited:true})).toBe(true);expect(fs.existsSync(dir)).toBe(false);
  });
  it('retains a busy profile after three bounded attempts without throwing',async()=>{
    const dir=profile();let attempts=0;
    expect(await cleanupProfile(dir,{childExited:true,wait:async()=>{},remove:()=>{attempts++;throw Object.assign(new Error('locked'),{code:'EBUSY'})}})).toBe(false);
    expect(attempts).toBe(3);expect(fs.existsSync(dir)).toBe(true);
  });
  it('does not follow a symbolic link outside its owned temp directory',async()=>{
    const target=profile(),link=path.join(os.tmpdir(),`regie-login-smoke-link-${process.pid}`);fs.symlinkSync(target,link,'junction');created.push(link);
    expect(await cleanupProfile(link,{childExited:true})).toBe(false);expect(fs.existsSync(target)).toBe(true);
  });
});
