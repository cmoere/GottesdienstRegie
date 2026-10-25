import fs from 'node:fs/promises';
import path from 'node:path';
import {bundledAnnouncementVoice,bundledFemaleAnnouncementVoice,isBundledAnnouncementVoice} from '../../src/announcements/settings';
import {normalizeAnnouncementSpeech,runBundledSpeech} from './BundledSpeechService';
import {normalizeReadingSettings,validateReadingSettings,type SpeechReadingSettings} from '../../src/announcements/readingSettings';
import {prepareGermanSpeech} from './prepareGermanSpeech';
import {bundledVoices} from '../../src/announcements/voices';

/** Keep persisted gender IDs stable while replacing the native speech backend. */
export class NeuralSpeechService{
 private current:AbortController|null=null;
 constructor(private root:string,private platform:NodeJS.Platform=process.platform,private arch:string=process.arch,private run=runBundledSpeech){}
 private async resources(modelKey='male'){
  if(!path.isAbsolute(this.root))throw Error('Sprachpaket fehlt.');
  const marker=JSON.parse(await fs.readFile(path.join(this.root,'ready.json'),'utf8'));
  if(marker.platform!==this.platform||marker.arch!==this.arch||marker.engine!=='piper-1.8.0')throw Error('Sprachpaket passt nicht zu diesem Gerät.');
  const python=path.join(this.root,'python',this.platform==='win32'?'python.exe':'bin/python3');
  const voice=bundledVoices.find(v=>v.modelKey===modelKey);if(!voice)throw Error('Ungültige Ansagenstimme.');
  for(const name of [python,path.join(this.root,'worker.py'),path.join(this.root,'site/piper/voice.py'),path.join(this.root,'voices',voice.modelKey,voice.modelFile)]){const stat=await fs.stat(name);if(!stat.isFile()||!stat.size)throw Error('Sprachpaket ist unvollständig.')}
  return python;
 }
 async status(){try{await Promise.all(bundledVoices.map(voice=>this.resources(voice.modelKey)));return{ready:true,name:'Lokale deutsche KI-Stimmen · Thorsten, Kerstin, Karlsson, Ramona und Eva K. · offline enthalten'}}catch{return{ready:false,name:'Das lokale Sprachpaket fehlt oder ist beschädigt. Bitte das vollständige Update installieren.'}}}
 cancel(){this.current?.abort()}
 async synthesize(value:unknown,voiceId:unknown=bundledAnnouncementVoice,reading?:SpeechReadingSettings):Promise<Uint8Array>{
  if(!isBundledAnnouncementVoice(voiceId))throw Error('Ungültige Ansagenstimme.');
  if(typeof value!=='string'||!value.trim()||[...value].length>10000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Error('Ungültiger Durchsage-Text.');
  const options=reading===undefined?normalizeReadingSettings(undefined):validateReadingSettings(reading),prepared=prepareGermanSpeech(value);
  if([...prepared].length>10000)throw Error('Der ausgeschriebene Durchsagetext ist zu lang.');
  if(this.current)throw Error('Eine Spracherzeugung läuft bereits.');const controller=new AbortController();this.current=controller;
  try{const voice=bundledVoices.find(v=>v.id===voiceId)!,python=await this.resources(voice.modelKey);if(controller.signal.aborted)throw Error('Durchsage abgebrochen.');const wav=await this.run(python,['-I','-S',path.join(this.root,'worker.py'),voice.modelKey,JSON.stringify(options)],prepared,controller.signal);return await normalizeAnnouncementSpeech(wav,controller.signal,options.loudnessPercent)}finally{if(this.current===controller)this.current=null}
 }
}
