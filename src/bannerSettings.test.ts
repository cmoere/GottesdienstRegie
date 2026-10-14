import {expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DeviceSettingsRepository} from '../electron/DeviceSettingsRepository';
import {normalizeBannerPosition} from './bannerSettings';
it('defaults to bottom and persists a technical top position without changing OSB/display settings',async()=>{
  expect(normalizeBannerPosition(undefined)).toBe('bottom');expect(normalizeBannerPosition('invalid')).toBe('bottom');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'regie-banner-settings-'));
  try{
    const file=path.join(dir,'device.json');await fs.writeFile(file,JSON.stringify({osb:{style:'focus'},outputDisplays:{keep:'existing'}}));
    const repository=new DeviceSettingsRepository(file);await repository.writeBannerPosition('top');
    expect(await new DeviceSettingsRepository(file).readBannerPosition()).toBe('top');
    expect(JSON.parse(await fs.readFile(file,'utf8'))).toMatchObject({osb:{style:'focus'},outputDisplays:{keep:'existing'}});
  }finally{await fs.rm(dir,{recursive:true,force:true})}
});
