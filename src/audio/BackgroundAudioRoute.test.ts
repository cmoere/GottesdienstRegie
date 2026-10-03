import {describe,it,expect,vi} from 'vitest';
import {BackgroundAudioRoute} from './BackgroundAudioRoute';
describe('background sink ownership',()=>{
 it('uses configured sink and recovers after device returns',async()=>{
  let devices=[{deviceId:'usb',kind:'audiooutput',label:'USB'}];let sink='';
  const route=new BackgroundAudioRoute({setSinkId:async(id:string)=>{sink=id}} as any,async()=>devices as any);
  expect(await route.apply('usb')).toBe(true);expect(sink).toBe('usb');
  devices=[];expect(await route.apply('usb')).toBe(false);expect(route.ready).toBe(false);
  devices=[{deviceId:'usb',kind:'audiooutput',label:'USB'}];expect(await route.apply('usb')).toBe(true);expect(route.name).toBe('USB');
 });
 it('serializes stale requests so newest sink wins',async()=>{
  let release!:()=>void;let sink='';const held=new Promise<void>(resolve=>release=resolve);
  const route=new BackgroundAudioRoute({setSinkId:async(id:string)=>{if(id==='a')await held;sink=id}} as any,async()=>[{deviceId:'a',kind:'audiooutput'},{deviceId:'b',kind:'audiooutput'}] as any);
  const first=route.apply('a');await Promise.resolve();const second=route.apply('b');release();await Promise.all([first,second]);expect(sink).toBe('b');expect(route.deviceId).toBe('b');
 });
 it('does not swallow rejected explicit sink selection',async()=>{
  const route=new BackgroundAudioRoute({setSinkId:vi.fn().mockRejectedValue(Error('missing'))} as any,async()=>[{deviceId:'usb',kind:'audiooutput'}] as any);
  expect(await route.apply('usb')).toBe(false);expect(route.ready).toBe(false);
 });
});
