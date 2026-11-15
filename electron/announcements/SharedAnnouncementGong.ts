import {createGitHubCredentialReader} from '../storage/gitCredential';
import {isAnnouncementGong,type AnnouncementGong} from '../../src/announcements/settings';

const owner = 'cmoere';
const repository = 'GottesdienstRegie';
const file = 'regie-settings/announcement-gong.json';
const contents = `https://api.github.com/repos/${owner}/${repository}/contents/${file}`;
const publicUrl = `https://raw.githubusercontent.com/${owner}/${repository}/main/${file}`;
const headers = {'user-agent':'GottesdienstRegie-Settings','accept':'application/vnd.github+json'};

function readGong(value:unknown):AnnouncementGong {
  const gong = (value as {gongId?:unknown}|null)?.gongId;
  if (!isAnnouncementGong(gong)) throw Error('INVALID_SHARED_GONG');
  return gong;
}

type Cache = {
  readSharedGong(): Promise<AnnouncementGong | undefined>;
  writeSharedGong(gong:AnnouncementGong): Promise<unknown>;
};

export class SharedAnnouncementGong {
  private reading?:Promise<AnnouncementGong>;
  private saving?:Promise<AnnouncementGong>;

  constructor(private cache:Cache, private credential = createGitHubCredentialReader(), private fetcher = fetch) {}

  read():Promise<AnnouncementGong> {
    if (this.saving) return this.saving.catch(() => this.cached());
    return this.reading ??= this.readOnline().finally(() => {this.reading=undefined});
  }

  private async cached(){
    return await this.cache.readSharedGong().catch(() => undefined) ?? 'classic';
  }

  private async readOnline(){
    try {
      const response = await this.fetcher(publicUrl+'?t='+Date.now(),{headers,cache:'no-store',signal:AbortSignal.timeout(4000)});
      if (!response.ok) return this.cached();
      const gong = readGong(await response.json());
      await this.cache.writeSharedGong(gong).catch(() => {});
      return gong;
    } catch {return this.cached()}
  }

  write(value:unknown):Promise<AnnouncementGong> {
    if (!isAnnouncementGong(value)) return Promise.reject(Error('INVALID_SHARED_GONG'));
    if (this.saving) return Promise.reject(Error('SHARED_GONG_SAVE_BUSY'));
    return this.saving = this.writeOnline(value).finally(() => {this.saving=undefined});
  }

  private async writeOnline(gong:AnnouncementGong){
    await this.reading;
    const token = await this.credential(owner);
    if (!token) throw Error('SHARED_GONG_WRITE_PERMISSION');
    const authorized = {...headers,authorization:`Bearer ${token}`};
    const current = await this.fetcher(contents+'?ref=main',{headers:authorized,signal:AbortSignal.timeout(8000)});
    if (!current.ok) throw Error('SHARED_GONG_READ_FAILED');
    const {sha,content} = await current.json() as {sha:string;content:string};
    if (!/^[a-f0-9]{40}$/i.test(sha)) throw Error('SHARED_GONG_READ_FAILED');
    const previous = readGong(JSON.parse(Buffer.from(content,'base64').toString('utf8')));
    if (previous !== gong) {
      const response = await this.fetcher(contents,{
        method:'PUT',headers:{...authorized,'content-type':'application/json'},
        body:JSON.stringify({branch:'main',sha,message:'Update shared announcement chime',
          content:Buffer.from(JSON.stringify({gongId:gong},null,2)+'\n').toString('base64')}),
        signal:AbortSignal.timeout(8000),
      });
      if (!response.ok) throw Error('SHARED_GONG_WRITE_FAILED');
    }
    await this.cache.writeSharedGong(gong).catch(() => {});
    return gong;
  }
}
