import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DeviceSettingsRepository} from './DeviceSettingsRepository';

const directories:string[]=[];
afterEach(async()=>{for(const dir of directories.splice(0))await fs.rm(dir,{recursive:true,force:true})});
async function repository(){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'regie-v83-settings-'));directories.push(dir);return {file:path.join(dir,'settings.json'),repo:new DeviceSettingsRepository(path.join(dir,'settings.json'))}}
const chosen={enabled:false,intervalMinutes:8,musicRemainingPercent:15,voiceId:'de_DE-mls-medium',speakerId:17,voiceAccepted:true};
describe('device-owned scheduled announcement settings',()=>{
  it('starts disabled with no fixed speaker and restores the chosen voice on another repository instance',async()=>{
    const {repo,file}=await repository();
    expect(await repo.readAnnouncements()).toMatchObject({enabled:false,speakerId:null,intervalMinutes:5});
    await repo.writeAnnouncements(chosen);
    expect(await new DeviceSettingsRepository(file).readAnnouncements()).toEqual(chosen);
  });
  it('serializes concurrent writes while keeping existing device fields',async()=>{
    const {repo,file}=await repository();
    await fs.writeFile(file,JSON.stringify({osb:{style:'focus'},outputDisplays:{primary:'screen'},announcementBannerPosition:'top'}));
    await Promise.all([repo.writeAnnouncements(chosen),repo.writeBannerPosition('bottom')]);
    expect(JSON.parse(await fs.readFile(file,'utf8'))).toEqual({osb:{style:'focus'},outputDisplays:{primary:'screen'},announcementBannerPosition:'bottom',announcements:chosen});
  });
  it('rejects invalid writes without altering the saved configuration',async()=>{
    const {repo,file}=await repository();await repo.writeAnnouncements(chosen);
    const before=await fs.readFile(file,'utf8');
    await expect(repo.writeAnnouncements({...chosen,intervalMinutes:0})).rejects.toThrow();
    expect(await fs.readFile(file,'utf8')).toBe(before);
  });
});
