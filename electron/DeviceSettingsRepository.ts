import fs from 'node:fs/promises';
import path from 'node:path';
import {atomicRename} from './atomicRename';
import type {OsbSettings} from '../src/osb/types';
import {normalizeOutputDisplayProfile,type OutputDisplayProfile} from './outputDisplayProfile';
import {normalizeBannerPosition} from '../src/bannerSettings';
import {normalizeAnnouncementSettings,validateAnnouncementSettings} from '../src/announcements/settings';
import {normalizeRegionalSelection,validateRegionalSelection} from '../shared/regional/selection';

export class DeviceSettingsRepository {
  private writes:Promise<void>=Promise.resolve();
  constructor(private file:string){}
  private async readSettings():Promise<Record<string,unknown>>{
    try {const value:unknown=JSON.parse(await fs.readFile(this.file,'utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Ungültige Geräteeinstellungen.');return value as Record<string,unknown>}
    catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {};throw error}
  }
  async readOsb():Promise<unknown>{await this.writes;try{return (await this.readSettings()).osb??null}catch{return null}}
  async readAnnouncements(){await this.writes;return normalizeAnnouncementSettings((await this.readSettings()).announcements)}
  async writeAnnouncements(value:unknown){const normalized=validateAnnouncementSettings(value);await this.update({announcements:normalized});return normalized}
  async readRegionalSelection(){await this.writes;try{return normalizeRegionalSelection((await this.readSettings()).regionalSelection)}catch{return normalizeRegionalSelection(undefined)}}
  async writeRegionalSelection(value:unknown){const normalized=validateRegionalSelection(value);await this.update({regionalSelection:normalized});return normalized}
  async readBannerPosition(){await this.writes;return normalizeBannerPosition((await this.readSettings()).announcementBannerPosition)}
  async writeBannerPosition(value:unknown){if(value!=='top'&&value!=='bottom')throw new Error('Ungültige Bannerposition.');await this.update({announcementBannerPosition:value});return value}
  async readOutputDisplays():Promise<OutputDisplayProfile|null>{await this.writes;try{return normalizeOutputDisplayProfile((await this.readSettings()).outputDisplays)}catch{return null}}
  private update(patch:Record<string,unknown>):Promise<void>{
    const operation=this.writes.then(async()=>{
      const settings={...await this.readSettings(),...patch};
      await fs.mkdir(path.dirname(this.file),{recursive:true});
      const temp=`${this.file}.tmp`;
      await fs.writeFile(temp,JSON.stringify(settings,null,2),'utf8');
      await atomicRename(temp,this.file);
    });
    this.writes=operation.catch(()=>{});
    return operation;
  }
  async writeOsb(osb:OsbSettings){await this.update({osb});return osb}
  async writeOutputDisplays(profile:OutputDisplayProfile){const normalized=normalizeOutputDisplayProfile(profile);if(!normalized)throw new Error('Ungültiges Bildschirmprofil.');await this.update({outputDisplays:normalized});return normalized}
}
