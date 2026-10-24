import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DeviceSettingsRepository} from '../DeviceSettingsRepository';
import {createAnnouncementSettingsAccess} from './SettingsAccess';

const dirs:string[]=[];
afterEach(async()=>{for(const dir of dirs.splice(0))await fs.rm(dir,{recursive:true,force:true})});
const settings={enabled:false,intervalMinutes:7,musicRemainingPercent:30,voiceId:'de_DE-mls-medium',speakerId:null,voiceAccepted:false};
async function setup(){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'regie-v83-access-'));dirs.push(dir);
 const repo=new DeviceSettingsRepository(path.join(dir,'device.json'));
 const access=createAnnouncementSettingsAccess(repo,(event:{control:boolean})=>event.control);
 return {repo,access};
}

describe('settings-only announcement access while speech is unavailable',()=>{
 it('enables only a selected non-neural engine that is available',async()=>{
  const{repo}=await setup();let ready=false;
  const access=createAnnouncementSettingsAccess(repo,(event:{control:boolean})=>event.control,async()=>ready);
  const chosen={...settings,enabled:true,voiceId:'espeak-ng:de',speakerId:0,voiceAccepted:true};
  await expect(access.write({control:true},chosen)).rejects.toThrow();ready=true;
  expect(await access.write({control:true},chosen)).toEqual(chosen);
  await expect(access.write({control:false},chosen)).rejects.toThrow();
  await expect(access.write({control:true},{...chosen,voiceId:'de_DE-mls-medium'})).rejects.toThrow();
 });
 it('persists inactive interval and music settings',async()=>{
  const {access,repo}=await setup();
  expect(await access.read({control:true})).toMatchObject({enabled:false,intervalMinutes:5});
  expect(await access.write({control:true},settings)).toEqual(settings);
  expect(await repo.readAnnouncements()).toEqual(settings);
 });
 it('denies output-window reads and writes',async()=>{
  const {access,repo}=await setup();
  await expect(access.read({control:false})).rejects.toThrow();
  await expect(access.write({control:false},settings)).rejects.toThrow();
  expect(await repo.readAnnouncements()).toMatchObject({intervalMinutes:5});
 });
 it('cannot enable a known unverified engine even with accepted speaker metadata',async()=>{
  const {access,repo}=await setup();
  await expect(access.write({control:true},{...settings,enabled:true,speakerId:2,voiceAccepted:true})).rejects.toThrow(/Sprachausgabe/);
  expect(await repo.readAnnouncements()).toMatchObject({enabled:false,speakerId:null});
 });
 it('rejects invalid settings without damaging previous values',async()=>{
  const {access,repo}=await setup();
  await access.write({control:true},settings);
  await expect(access.write({control:true},{...settings,intervalMinutes:0})).rejects.toThrow();
  expect(await repo.readAnnouncements()).toEqual(settings);
 });
});
