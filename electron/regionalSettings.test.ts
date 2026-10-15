import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DeviceSettingsRepository } from './DeviceSettingsRepository';
import { createRegionalSettingsAccess } from './regionalSettings';
import { normalizeRegionalSelection, validateRegionalSelection } from '../shared/regional/selection';

const directories:string[]=[];
afterEach(async()=>{for(const directory of directories.splice(0))await rm(directory,{recursive:true,force:true})});

describe('regional selection shared contract',()=>{
  it('defaults absent or corrupt stored fields to a safe German base selection',()=>{
    expect(normalizeRegionalSelection(undefined)).toEqual({language:'de',germanRegion:null});
    expect(normalizeRegionalSelection({language:'not-a-language',germanRegion:'__proto__'}))
      .toEqual({language:'de',germanRegion:null});
    expect(normalizeRegionalSelection({language:'en',germanRegion:'ruhr'}))
      .toEqual({language:'en',germanRegion:'ruhr'});
  });
  it('accepts valid selections but rejects foreign fields, invalid IDs and inherited payload fields',()=>{
    expect(validateRegionalSelection({language:'de',germanRegion:'bielefeld-ravensberg'}))
      .toEqual({language:'de',germanRegion:'bielefeld-ravensberg'});
    for(const value of [null,[],{language:'de'}, {language:'de',germanRegion:'de-DE'},
      {language:'invalid',germanRegion:null}, {language:'de',germanRegion:null,path:'C:/outside'},
      Object.create({language:'de',germanRegion:'ruhr'})]){
      expect(()=>validateRegionalSelection(value)).toThrow();
    }
  });
});

describe('native regional settings access',()=>{
  it('persists validated selection without replacing display, audio, OSB or unrelated settings',async()=>{
    const directory=await mkdtemp(path.join(os.tmpdir(),'regie-v84-selection-'));
    directories.push(directory);
    const filename=path.join(directory,'device-settings.json');
    const original={outputDisplays:{main:'usb-monitor'},audio:{deviceId:'usb-audio'},osb:{style:'focus'},other:'keep'};
    await writeFile(filename,JSON.stringify(original));
    const repository=new DeviceSettingsRepository(filename);
    const access=createRegionalSettingsAccess(repository,(event:{id:number;mainFrame:boolean})=>event.id===1&&event.mainFrame);
    expect(await access.read({id:1,mainFrame:true})).toEqual({language:'de',germanRegion:null});
    await access.write({id:1,mainFrame:true},{language:'de',germanRegion:'ruhr'});
    expect(JSON.parse(await readFile(filename,'utf8'))).toEqual({...original,regionalSelection:{language:'de',germanRegion:'ruhr'}});
    expect(await new DeviceSettingsRepository(filename).readRegionalSelection()).toEqual({language:'de',germanRegion:'ruhr'});
  });
  it('denies output-window/subframe access before creating any settings file',async()=>{
    const directory=await mkdtemp(path.join(os.tmpdir(),'regie-v84-selection-'));
    directories.push(directory);
    const filename=path.join(directory,'device-settings.json');
    const repository=new DeviceSettingsRepository(filename);
    const access=createRegionalSettingsAccess(repository,(event:{id:number;mainFrame:boolean})=>event.id===1&&event.mainFrame);
    for(const event of [{id:2,mainFrame:true},{id:1,mainFrame:false}]){
      await expect(access.read(event)).rejects.toThrow();
      await expect(access.write(event,{language:'de',germanRegion:'ruhr'})).rejects.toThrow();
    }
    await expect(readFile(filename)).rejects.toMatchObject({code:'ENOENT'});
  });
  it('rejects invalid writes and recovers safely from an unreadable stored regional selection',async()=>{
    const directory=await mkdtemp(path.join(os.tmpdir(),'regie-v84-selection-'));
    directories.push(directory);
    const filename=path.join(directory,'device-settings.json');
    await writeFile(filename,JSON.stringify({regionalSelection:{language:'de',germanRegion:'bad'}}));
    const repository=new DeviceSettingsRepository(filename);
    expect(await repository.readRegionalSelection()).toEqual({language:'de',germanRegion:null});
    const before=await readFile(filename,'utf8');
    await expect(repository.writeRegionalSelection({language:'de',germanRegion:'bad'})).rejects.toThrow();
    expect(await readFile(filename,'utf8')).toBe(before);
  });
});
