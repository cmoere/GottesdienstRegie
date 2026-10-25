import {expect,it} from 'vitest';
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {NeuralSpeechService} from './NeuralSpeechService';
import {defaultReadingSettings} from '../../src/announcements/readingSettings';
it('passes prepared dates and bounded device reading settings to the private worker',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-neural-test-'));
 for(const file of ['python/python.exe','worker.py','site/piper/voice.py','voices/male/de_DE-thorsten-high.onnx','voices/female/de_DE-kerstin-low.onnx']){await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),'fixture')}
 await fs.writeFile(path.join(root,'ready.json'),JSON.stringify({platform:'win32',arch:'x64',engine:'piper-1.8.0'}));
 const b=Buffer.alloc(48);b.write('RIFF');b.writeUInt32LE(40,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(4,40);b.writeInt16LE(500,44);
 let args:string[]=[],text='';const service=new NeuralSpeechService(root,'win32','x64',async(_binary,a,t)=>{args=a;text=t;return b});
 expect((await service.status()).ready).toBe(false);
 await service.synthesize('Am 25.10.2026.','marytts:bits1-hsmm',{...defaultReadingSettings,speed:.85});
 expect(text).toBe('Am fünfundzwanzigsten Oktober zweitausendsechsundzwanzig.');expect(args.at(-2)).toBe('female');expect(JSON.parse(args.at(-1)!)).toMatchObject({speed:.85,paragraphPauseMs:600});
 await expect(service.synthesize('Test','marytts:bits1-hsmm',{...defaultReadingSettings,speed:99})).rejects.toThrow();
});
