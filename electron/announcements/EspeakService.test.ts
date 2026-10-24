import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {EspeakService,readSpeechWav,runEspeak,espeakArguments} from './EspeakService';
const directories:string[]=[];
afterEach(async()=>{for(const directory of directories.splice(0))await fs.rm(directory,{recursive:true,force:true})});
function wav(){const data=Buffer.alloc(244);data.write('RIFF');data.writeUInt32LE(236,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(22050,24);data.writeUInt32LE(44100,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(200,40);return data}
async function fixture(){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'regie-espeak-test-'));directories.push(directory);const executable=path.join(directory,process.platform==='win32'?'espeak-ng.exe':'espeak-ng');await fs.writeFile(executable,'fixture');return{directory,executable}}
describe('separately installed eSpeak NG file boundary',()=>{
 it('keeps packaged Unix data discovery instead of looking for dictionaries beside /usr/bin',()=>{
  expect(espeakArguments('/usr/bin/espeak-ng','linux')).toEqual(['-v','de','-s','155','-b','1','--stdin','--stdout']);
  expect(espeakArguments('/opt/homebrew/bin/espeak-ng','darwin')).toEqual(['-v','de','-s','155','-b','1','--stdin','--stdout']);
  expect(espeakArguments('C:/Speech/espeak-ng.exe','win32')).toEqual(['--path=C:/Speech','-v','de','-s','155','-b','1','--stdin','--stdout']);
 });
 it('does not execute missing, relative or unrelated executable paths',async()=>{const{directory}=await fixture();for(const file of ['espeak-ng.exe',path.join(directory,'other.exe'),path.join(directory,'missing','espeak-ng.exe')]){const service=new EspeakService(async()=>file,directory,async()=>{throw Error('must not execute')});expect((await service.status()).ready).toBe(false);await expect(service.synthesize('Hallo')).rejects.toThrow()}});
 it('sends literal UTF-8 through a fixed stdout protocol without Unicode temp output paths',async()=>{
  const{directory,executable}=await fixture();let seen:unknown;
  const service=new EspeakService(async()=>executable,directory,async(file,args,input)=>{seen={file,args,input};return wav()});
  const bytes=await service.synthesize('Ältere & Jüngere; $(echo nein)');expect(Buffer.from(bytes)).toEqual(wav());
  const args=process.platform==='win32'?['--path='+directory,'-v','de','-s','155','-b','1','--stdin','--stdout']:['-v','de','-s','155','-b','1','--stdin','--stdout'];
  expect(seen).toEqual({file:executable,args,input:'Ältere & Jüngere; $(echo nein)'});expect(await fs.readdir(directory)).toEqual([process.platform==='win32'?'espeak-ng.exe':'espeak-ng']);
 });
 it('refuses empty, excessive or control-sequence text before invoking the engine',async()=>{const{directory,executable}=await fixture();const service=new EspeakService(async()=>executable,directory,async()=>{throw Error('must not execute')});for(const text of ['', 'a'.repeat(10001),'test\u0000'])await expect(service.synthesize(text)).rejects.toThrow(/Text/)});
 it('cancels the current generation and does not return a late WAV',async()=>{const{directory,executable}=await fixture();let entered!:()=>void,release!:()=>void;const ready=new Promise<void>(resolve=>entered=resolve);const service=new EspeakService(async()=>executable,directory,async()=>{entered();await new Promise<void>(resolve=>release=resolve);return wav()});const pending=service.synthesize('Hallo');await ready;await expect(service.synthesize('Zweite')).rejects.toThrow(/läuft/);service.cancel();release();await expect(pending).rejects.toThrow(/abgebrochen/);expect((await fs.readdir(directory)).filter(name=>name.startsWith('speech-'))).toEqual([])});
 it('requires actual verified PCM, not merely an existing executable, before reporting ready',async()=>{const{directory,executable}=await fixture();const broken=new EspeakService(async()=>executable,directory,async()=>Buffer.alloc(44));expect((await broken.status()).ready).toBe(false);const working=new EspeakService(async()=>executable,directory,async()=>wav());expect((await working.status()).ready).toBe(true)});
 it('normalizes only the exact eSpeak streaming header to a finite WAV without mutating the source',()=>{const stream=wav();stream.writeUInt32LE(0x7ffff024,4);stream.writeUInt32LE(0x7ffff000,40);const result=readSpeechWav(stream,true);expect(Buffer.from(result)).toEqual(wav());expect(stream.readUInt32LE(4)).toBe(0x7ffff024);expect(()=>readSpeechWav(stream)).toThrow()});
 it('rejects malformed, truncated, non-PCM and empty audio instead of reporting success',()=>{expect(readSpeechWav(wav()).byteLength).toBe(244);for(const corrupt of [Buffer.alloc(44),wav().subarray(0,80),(()=>{const v=wav();v.writeUInt16LE(3,20);return v})(),(()=>{const v=wav();v.writeUInt32LE(0,40);return v})()])expect(()=>readSpeechWav(corrupt)).toThrow()});
 it('bounds a failing actual subprocess without invoking a shell',async()=>{await expect(runEspeak(process.execPath,['-e','process.stdin.resume();process.stdin.on("end",()=>process.exit(3))'],'Hallo',new AbortController().signal)).rejects.toThrow()});
});
