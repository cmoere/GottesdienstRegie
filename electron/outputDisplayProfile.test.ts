import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DeviceSettingsRepository} from './DeviceSettingsRepository';
import type {OsbSettings} from '../src/osb/types';
import * as profileHelpers from './outputDisplayProfile';

const directories:string[]=[];
async function settingsFile(){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'output-display-profile-'));directories.push(directory);return path.join(directory,'device-settings.json')}
afterEach(async()=>{await Promise.all(directories.splice(0).map(directory=>fs.rm(directory,{recursive:true,force:true}))) });
const monitor=(id:number,label='Projector')=>({id,label,identityLabel:label,bounds:{x:1920,y:0,width:1920,height:1080},scaleFactor:1,rotation:0});
async function helpers(){return profileHelpers}

describe('machine output display profiles',()=>{
  it('does not treat a generated display label as monitor identity for changed IDs',async()=>{
    const {captureOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const old=captureOutputDisplayProfile({'20':'main'},[{...monitor(20,'Anzeige 2'),identityLabel:''}]);
    expect(resolveOutputDisplayProfile(old,[{...monitor(90,'Anzeige 2'),identityLabel:''}])).toMatchObject({assignments:{},unresolved:[{role:'main',reason:'missing'}]});
  });
  it('keeps a same-ID assignment among identical models without recovering missing IDs by position',async()=>{
    const {captureOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const old=captureOutputDisplayProfile({'20':'main'},[monitor(20)]);
    expect(resolveOutputDisplayProfile(old,[monitor(90),monitor(20)])).toMatchObject({assignments:{'20':'main'},unresolved:[]});
  });
  it('rejects a duplicate output role rather than silently replacing a monitor',async()=>{
    const {captureOutputDisplayProfile}=await helpers();
    expect(()=>captureOutputDisplayProfile({'20':'main','30':'main'},[monitor(20),monitor(30)])).toThrow();
  });
  it('does not overwrite unreadable machine settings during a save',async()=>{
    const file=await settingsFile(),repository=new DeviceSettingsRepository(file);
    await fs.writeFile(file,'broken JSON');
    await expect(repository.writeOsb({enabled:true} as OsbSettings)).rejects.toThrow();
    expect(await fs.readFile(file,'utf8')).toBe('broken JSON');
  });
  it('keeps disconnected MAIN while another role is assigned',async()=>{
    const {captureOutputDisplayProfile,mergeOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const old=captureOutputDisplayProfile({'20':'main'},[monitor(20)]);
    const updated=mergeOutputDisplayProfile(old,{'30':'stage'},[monitor(30,'Stage')]);
    expect(resolveOutputDisplayProfile(updated,[monitor(20),monitor(30,'Stage')])).toMatchObject({assignments:{'20':'main','30':'stage'}});
  });
  it('removes a disconnected role only when explicitly cleared',async()=>{
    const {captureOutputDisplayProfile,mergeOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const old=captureOutputDisplayProfile({'20':'main'},[monitor(20)]);
    const updated=mergeOutputDisplayProfile(old,{},[],{clearRoles:['main']});
    expect(resolveOutputDisplayProfile(updated,[monitor(20)])).toMatchObject({assignments:{},unresolved:[]});
  });
  it('preserves old monitor identity when its numeric ID is reused for another assigned role',async()=>{
    const {captureOutputDisplayProfile,mergeOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const old=captureOutputDisplayProfile({'20':'main'},[monitor(20)]);
    const updated=mergeOutputDisplayProfile(old,{'20':'stage'},[monitor(20,'Stage')]);
    expect(resolveOutputDisplayProfile(updated,[monitor(20,'Stage'),monitor(90)])).toMatchObject({assignments:{'90':'main','20':'stage'},unresolved:[]});
  });
  it('recovers MAIN after restart with a uniquely matching changed display ID',async()=>{
    const {captureOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const file=await settingsFile(),repository=new DeviceSettingsRepository(file);
    await repository.writeOutputDisplays(captureOutputDisplayProfile({'20':'main'},[monitor(20)]));
    const restarted=new DeviceSettingsRepository(file);
    expect(resolveOutputDisplayProfile(await restarted.readOutputDisplays(),[monitor(90)])).toMatchObject({assignments:{'90':'main'},unresolved:[]});
  });
  it('never chooses between identical monitors when the saved ID changed',async()=>{
    const {captureOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const profile=captureOutputDisplayProfile({'20':'main'},[monitor(20)]);
    expect(resolveOutputDisplayProfile(profile,[monitor(90),monitor(91)])).toMatchObject({assignments:{},unresolved:[{role:'main',reason:'ambiguous'}]});
  });
  it('does not assign a different monitor reusing the old numeric ID',async()=>{
    const {captureOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    expect(resolveOutputDisplayProfile(captureOutputDisplayProfile({'20':'main'},[monitor(20)]),[monitor(20,'Other monitor')])).toMatchObject({assignments:{},unresolved:[{role:'main',reason:'missing'}]});
  });
  it('retains a disconnected assignment for later reconnection',async()=>{
    const {captureOutputDisplayProfile,resolveOutputDisplayProfile}=await helpers();
    const file=await settingsFile(),repository=new DeviceSettingsRepository(file);
    await repository.writeOutputDisplays(captureOutputDisplayProfile({'20':'main'},[monitor(20)]));
    expect(resolveOutputDisplayProfile(await repository.readOutputDisplays(),[])).toMatchObject({assignments:{},unresolved:[{role:'main',reason:'missing'}]});
    expect(resolveOutputDisplayProfile(await new DeviceSettingsRepository(file).readOutputDisplays(),[monitor(20)])).toMatchObject({assignments:{'20':'main'}});
  });
  it('preserves OSB and unknown machine settings through output and OSB writes',async()=>{
    const {captureOutputDisplayProfile}=await helpers();
    const file=await settingsFile(),repository=new DeviceSettingsRepository(file);
    await fs.writeFile(file,JSON.stringify({osb:{enabled:true},futureSetting:7}));
    const profile=captureOutputDisplayProfile({'20':'main'},[monitor(20)]);
    await repository.writeOutputDisplays(profile);
    expect(await repository.readOsb()).toEqual({enabled:true});
    await repository.writeOsb({enabled:false} as OsbSettings);
    expect(JSON.parse(await fs.readFile(file,'utf8'))).toEqual({osb:{enabled:false},futureSetting:7,outputDisplays:profile});
  });
  it('serializes concurrent writes so neither machine setting disappears',async()=>{
    const {captureOutputDisplayProfile}=await helpers();
    const file=await settingsFile(),repository=new DeviceSettingsRepository(file);
    await Promise.all([repository.writeOutputDisplays(captureOutputDisplayProfile({'20':'main'},[monitor(20)])),repository.writeOsb({enabled:true} as OsbSettings)]);
    expect(await new DeviceSettingsRepository(file).readOutputDisplays()).toMatchObject({version:1});
    expect(await repository.readOsb()).toEqual({enabled:true});
  });
});
