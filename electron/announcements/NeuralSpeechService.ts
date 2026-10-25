import fs from 'node:fs/promises';
import path from 'node:path';
import {bundledAnnouncementVoice,bundledFemaleAnnouncementVoice,isBundledAnnouncementVoice} from '../../src/announcements/settings';
import {normalizeAnnouncementSpeech,runBundledSpeech} from './BundledSpeechService';

/** Keep persisted gender IDs stable while replacing the native speech backend. */
export class NeuralSpeechService{
 private current:AbortController|null=null;
 constructor(private root:string,private platform:NodeJS.Platform=process.platform,private arch:string=process.arch,private run=runBundledSpeech){}
 private async resources(){
  if(!path.isAbsolute(this.root))throw Error('Sprachpaket fehlt.');
  const marker=JSON.parse(await fs.readFile(path.join(this.root,'ready.json'),'utf8'));
  if(marker.platform!==this.platform||marker.arch!==this.arch||marker.engine!=='piper-1.8.0')throw Error('Sprachpaket passt nicht zu diesem Gerät.');
  const python=path.join(this.root,'python',this.platform==='win32'?'python.exe':'bin/python3');
  for(const name of [python,path.join(this.root,'worker.py'),path.join(this.root,'site/piper/voice.py'),path.join(this.root,'voices/male/de_DE-thorsten-high.onnx'),path.join(this.root,'voices/female/de_DE-kerstin-low.onnx')]){const stat=await fs.stat(name);if(!stat.isFile()||!stat.size)throw Error('Sprachpaket ist unvollständig.')}
  return python;
 }
 async status(){try{await this.resources();return{ready:true,name:'Lokale deutsche KI-Stimmen · Thorsten und Kerstin · offline enthalten'}}catch{return{ready:false,name:'Das lokale Sprachpaket fehlt oder ist beschädigt. Bitte das vollständige Update installieren.'}}}
 cancel(){this.current?.abort()}
 async synthesize(value:unknown,voiceId:unknown=bundledAnnouncementVoice):Promise<Uint8Array>{
  if(!isBundledAnnouncementVoice(voiceId))throw Error('Ungültige Ansagenstimme.');
  if(typeof value!=='string'||!value.trim()||[...value].length>10000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Error('Ungültiger Durchsage-Text.');
  if(this.current)throw Error('Eine Spracherzeugung läuft bereits.');const controller=new AbortController();this.current=controller;
  try{const python=await this.resources();if(controller.signal.aborted)throw Error('Durchsage abgebrochen.');const wav=await this.run(python,['-I','-S',path.join(this.root,'worker.py'),voiceId===bundledFemaleAnnouncementVoice?'female':'male'],value,controller.signal);return await normalizeAnnouncementSpeech(wav,controller.signal)}finally{if(this.current===controller)this.current=null}
 }
}
