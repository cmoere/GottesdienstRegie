import {describe,expect,it,vi,afterEach} from 'vitest';
import {playAnnouncementAudio} from './AnnouncementPlayer';
import {defaultAudioRouting} from '../audioRouting';
class Media extends EventTarget{src='';volume=0;muted=false;preload='';paused=false;pause(){this.paused=true}removeAttribute(){this.src=''}load(){}async play(){this.dispatchEvent(new Event('playing'))}async setSinkId(_id:string){}}
afterEach(()=>vi.useRealTimers());
describe('announcement audio uses the Background Audio sink without fallback',()=>{
 it('waits for sink selection and ended, reports only actual playing, then unloads media',async()=>{
  const events:string[]=[];const media=new Media();media.setSinkId=async id=>{events.push(`sink:${id}`)};const promise=playAnnouncementAudio('blob:speech',new AbortController().signal,()=>events.push('playing'),defaultAudioRouting,media as any,async()=>[]);
  await vi.waitFor(()=>expect(events).toEqual(['sink:','playing']));expect(media.volume).toBe(.8);media.dispatchEvent(new Event('ended'));await promise;expect(media.src).toBe('');expect(media.paused).toBe(true);
 });
 it('refuses missing configured devices and mute without starting audio',async()=>{
  for(const routing of [{...defaultAudioRouting,background:{...defaultAudioRouting.background,muted:true}},{...defaultAudioRouting,background:{...defaultAudioRouting.background,deviceId:'usb-gone'}}]){const media=new Media();await expect(playAnnouncementAudio('blob:speech',new AbortController().signal,()=>{throw Error('must not play')},routing,media as any,async()=>[])).rejects.toThrow(/Audioausgang/);expect(media.src).toBe('')}
 });
 it('aborts stalled playback and removes all event handlers and source',async()=>{const media=new Media(),controller=new AbortController();const promise=playAnnouncementAudio('blob:speech',controller.signal,()=>{},defaultAudioRouting,media as any,async()=>[]);await vi.waitFor(()=>expect(media.src).toBe('blob:speech'));controller.abort();await expect(promise).rejects.toThrow();expect(media.src).toBe('');expect(media.paused).toBe(true)});
});
