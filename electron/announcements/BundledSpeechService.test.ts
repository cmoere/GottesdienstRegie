import {describe,it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {BundledSpeechService,readBundledSpeechWav,runBundledSpeech} from './BundledSpeechService';

function wav(){const b=Buffer.alloc(48);b.write('RIFF');b.writeUInt32LE(40,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(4,40);b.writeInt16LE(300,44);return b}
async function resources(){const root=await mkdtemp(path.join(os.tmpdir(),'Stimme Grüße '));for(const name of ['runtime/bin/java.exe','worker/AnnouncementSpeech.class','lib/voice-dfki-pavoque-neutral-5.2.jar','lib/marytts-runtime-5.2.1.jar','lib/marytts-lang-de-5.2.1.jar','lib/voices/dfki-pavoque-neutral/halfphoneFeatures_ac.mry','lib/voices/dfki-pavoque-neutral/halfphoneUnits.mry','lib/voices/dfki-pavoque-neutral/joinCostFeatures.mry','lib/voices/dfki-pavoque-neutral/timeline_basenames.mry','lib/voices/dfki-pavoque-neutral/timeline_waveforms.mry']){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),'fixture')}await writeFile(path.join(root,'ready.json'),JSON.stringify({platform:'win32',arch:'x64',voice:'marytts:dfki-pavoque-neutral'}));return root}
describe('bundled classical speech',()=>{
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
