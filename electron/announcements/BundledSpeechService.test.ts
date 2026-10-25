import {describe,it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {BundledSpeechService,readBundledSpeechWav,runBundledSpeech,normalizeAnnouncementSpeech} from './BundledSpeechService';

function wav(){const b=Buffer.alloc(48);b.write('RIFF');b.writeUInt32LE(40,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(4,40);b.writeInt16LE(300,44);return b}
async function resources(){const root=await mkdtemp(path.join(os.tmpdir(),'Stimme Grüße '));for(const name of ['lib/voice-bits1-hsmm-5.2.jar','runtime/bin/java.exe','worker/AnnouncementSpeech.class','lib/voice-dfki-pavoque-neutral-5.2.jar','lib/marytts-runtime-5.2.1.jar','lib/marytts-lang-de-5.2.1.jar','lib/voices/dfki-pavoque-neutral/halfphoneFeatures_ac.mry','lib/voices/dfki-pavoque-neutral/halfphoneUnits.mry','lib/voices/dfki-pavoque-neutral/joinCostFeatures.mry','lib/voices/dfki-pavoque-neutral/timeline_basenames.mry','lib/voices/dfki-pavoque-neutral/timeline_waveforms.mry']){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),'fixture')}await writeFile(path.join(root,'ready.json'),JSON.stringify({platform:'win32',arch:'x64',voice:'marytts:dfki-pavoque-neutral'}));return root}
describe('bundled classical speech',()=>{
 it('raises average speech level with the selected boost while retaining the same peak ceiling',async()=>{
   const source=Buffer.alloc(32044);wav().copy(source);source.writeUInt32LE(source.length-8,4);source.writeUInt32LE(source.length-44,40);
   for(let i=0;i<16000;i++)source.writeInt16LE(Math.round((i>7500&&i<8500?10000:1500)*Math.sin(i*.12)),44+i*2);
   const normal=Buffer.from(await normalizeAnnouncementSpeech(source,undefined,100)),louder=Buffer.from(await normalizeAnnouncementSpeech(source,undefined,150));
   let first=0,second=0,peak=0;for(let i=44;i<source.length;i+=2){first+=normal.readInt16LE(i)**2;second+=louder.readInt16LE(i)**2;peak=Math.max(peak,Math.abs(louder.readInt16LE(i)))}
   expect(10*Math.log10(second/first)).toBeGreaterThan(1);expect(peak).toBeLessThanOrEqual(29206);
 });
 it('raises quiet speech passages while limiting peaks smoothly below full scale',async()=>{
   const source=Buffer.alloc(32044);wav().copy(source);source.writeUInt32LE(source.length-8,4);source.writeUInt32LE(source.length-44,40);
   for(let i=0;i<16000;i++)source.writeInt16LE(Math.round((i>7500&&i<8500?10000:1500)*Math.sin(i*.12)),44+i*2);
   const original=Buffer.from(source),data=Buffer.from(await normalizeAnnouncementSpeech(source));
   let energy=0,baseline=0,peak=0;for(let i=44;i<source.length;i+=2){energy+=data.readInt16LE(i)**2;baseline+=(source.readInt16LE(i)*29205/10000)**2;peak=Math.max(peak,Math.abs(data.readInt16LE(i)))}
   expect(10*Math.log10(energy/baseline)).toBeGreaterThan(1);expect(peak).toBeLessThanOrEqual(29206);expect(source).toEqual(original);
 });
 it('uses the whitelisted female worker voice and rejects arbitrary voice names',async()=>{
   const root=await resources();await writeFile(path.join(root,'lib/voice-bits1-hsmm-5.2.jar'),'fixture');let used:string[]=[];
   const service=new BundledSpeechService(root,'win32','x64',async(_file,args)=>{used=args;return wav()});
   await service.synthesize('Guten Tag.','marytts:bits1-hsmm');expect(used.at(-1)).toBe('bits1-hsmm');
   await expect(service.synthesize('Guten Tag.','../../foreign')).rejects.toThrow();
 });
 it('raises speech to a bounded peak without clipping or changing the original waveform',async()=>{
   const source=wav();source.writeInt16LE(10000,44);source.writeInt16LE(-5000,46);const original=Buffer.from(source);
   const normalized=Buffer.from(await normalizeAnnouncementSpeech(source));
   expect(normalized.readInt16LE(44)).toBe(29205);expect(normalized.readInt16LE(46)).toBe(-14602);expect(source).toEqual(original);
 });
 it('caps gain at 18 dB for extremely quiet speech and handles negative full-scale samples',async()=>{
   const quiet=wav();quiet.writeInt16LE(100,44);expect(Buffer.from(await normalizeAnnouncementSpeech(quiet)).readInt16LE(44)).toBe(794);
   const loud=wav();loud.writeInt16LE(-32768,44);expect(Buffer.from(await normalizeAnnouncementSpeech(loud)).readInt16LE(44)).toBe(-29205);
   const silence=wav();silence.fill(0,44);await expect(normalizeAnnouncementSpeech(silence)).rejects.toThrow();
 });
 it('yields during a long waveform and cancels gain preparation before any audio can play',async()=>{
   const long=Buffer.alloc(256*1024);wav().copy(long);long.writeUInt32LE(long.length-8,4);long.writeUInt32LE(long.length-44,40);
   const controller=new AbortController(),pending=normalizeAnnouncementSpeech(long,controller.signal);controller.abort();
   await expect(pending).rejects.toThrow(/abgebrochen/);
 });
 it('bounds actual crashing, oversized and cancelled subprocesses',async()=>{
   await expect(runBundledSpeech(process.execPath,['-e','process.exit(2)'],'',new AbortController().signal)).rejects.toThrow();
   await expect(runBundledSpeech(process.execPath,['-e','process.stdout.write(Buffer.alloc(33*1024*1024))'],'',new AbortController().signal)).rejects.toThrow();
   const controller=new AbortController();const child=runBundledSpeech(process.execPath,['-e','setInterval(()=>{},1000)'],'',controller.signal);controller.abort();await expect(child).rejects.toThrow();
 });
 it('validates real 16 kHz speech and rejects silence, truncation and foreign formats',()=>{
   expect(readBundledSpeechWav(wav()).length).toBe(48);
   expect(()=>readBundledSpeechWav(wav().subarray(0,47))).toThrow();
   const silent=wav();silent.fill(0,44);expect(()=>readBundledSpeechWav(silent)).toThrow();
   const foreign=wav();foreign.writeUInt32LE(8000,24);expect(()=>readBundledSpeechWav(foreign)).toThrow();
 });
 it('reports missing or wrong-platform resources instead of using the system voice',async()=>{
   const missing=new BundledSpeechService(path.join(os.tmpdir(),'missing-stimme'),'win32','x64');
   expect((await missing.status()).ready).toBe(false);
   const root=await resources();const wrong=new BundledSpeechService(root,'darwin','arm64');expect((await wrong.status()).ready).toBe(false);
 });
 it('uses only its private executable and fixed arguments with Unicode paths',async()=>{
   const root=await resources();let invoked='';let argumentsUsed:string[]=[];
   const service=new BundledSpeechService(root,'win32','x64',async(file,args,text)=>{invoked=file;argumentsUsed=args;expect(text).toBe('Grüße um 10:30 Uhr.');return wav()});
   expect((await service.status()).ready).toBe(true);expect((await service.synthesize('Grüße um 10:30 Uhr.')).length).toBe(48);
   expect(invoked).toBe(path.join(root,'runtime/bin/java.exe'));expect(argumentsUsed).toContain('AnnouncementSpeech');expect(argumentsUsed).toContain('-Djava.awt.headless=true');
 });
 it('rejects oversized text before starting a child',async()=>{
   const root=await resources();let invoked=false;const service=new BundledSpeechService(root,'win32','x64',async()=>{invoked=true;return wav()});
   await expect(service.synthesize('a'.repeat(10001))).rejects.toThrow();expect(invoked).toBe(false);
 });
 it('cancels preparation and rejects a late successful result',async()=>{
   const root=await resources();let finish!:(value:Buffer)=>void;let started!:()=>void;
   const begins=new Promise<void>(r=>{started=r});
   const service=new BundledSpeechService(root,'win32','x64',async()=>{started();return new Promise(r=>{finish=r})});
   const pending=service.synthesize('Guten Tag.');await begins;
   await expect(service.synthesize('Zweite Ansage.')).rejects.toThrow();service.cancel();finish(wav());await expect(pending).rejects.toThrow();
 });
});
