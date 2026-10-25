import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setImmediate as yieldToMain} from 'node:timers/promises';
import {bundledAnnouncementVoice,bundledFemaleAnnouncementVoice,isBundledAnnouncementVoice} from '../../src/announcements/settings';

export function readBundledSpeechWav(input:Buffer):Uint8Array {
  if(input.length<46||input.length>32*1024*1024||input.toString('ascii',0,4)!=='RIFF'||input.toString('ascii',8,12)!=='WAVE'||input.readUInt32LE(4)+8!==input.length)throw Error('Ungültige Sprachausgabe.');
  let format=false,signal=false;
  for(let offset=12;offset+8<=input.length;){
    const kind=input.toString('ascii',offset,offset+4),size=input.readUInt32LE(offset+4),start=offset+8,end=start+size;
    if(end>input.length)throw Error('Unvollständige Sprachausgabe.');
    if(kind==='fmt '){if(size<16||input.readUInt16LE(start)!==1||input.readUInt16LE(start+2)!==1||![16000,22050].includes(input.readUInt32LE(start+4))||input.readUInt16LE(start+14)!==16)throw Error('Nicht unterstütztes Sprachformat.');format=true}
    if(kind==='data'){if(!size||size%2)throw Error('Ungültige Sprachdaten.');for(let i=start;i<end;i+=2)if(input.readInt16LE(i)!==0){signal=true;break}}
    offset=end+(size%2);
  }
  if(!format||!signal)throw Error('Sprachausgabe enthält kein Audiosignal.');
  return Uint8Array.from(input);
}

/** Speech-only level correction. Preserve mute/master routing and never amplify the gong. */
export async function normalizeAnnouncementSpeech(input:Buffer,signal?:AbortSignal):Promise<Uint8Array>{
  const check=()=>{if(signal?.aborted)throw Error('Durchsage abgebrochen.')};check();
  const data=Buffer.from(readBundledSpeechWav(input)),ranges:Array<[number,number]>=[];let peak=0;
  for(let offset=12;offset+8<=data.length;){const size=data.readUInt32LE(offset+4),start=offset+8,end=start+size;
    if(data.toString('ascii',offset,offset+4)==='data'){ranges.push([start,end]);for(let block=start;block<end;block+=65536){const finish=Math.min(end,block+65536);for(let i=block;i<finish;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));if(finish<end){await yieldToMain();check()}}}
    offset=end+(size%2);
  }
  let sampleRate=16000;for(let offset=12;offset+8<=data.length;){const size=data.readUInt32LE(offset+4);if(data.toString('ascii',offset,offset+4)==='fmt ')sampleRate=data.readUInt32LE(offset+12);offset+=8+size+(size%2)}
  const ceiling=10**(-1/20)*32768,gain=Math.min(10**(18/20),ceiling/peak*1.8),blockBytes=Math.round(sampleRate*.01)*2;
  // 10ms blocks, 20ms lookahead and a 60ms release raise quiet syllables while
  // keeping a continuous gain envelope. Duration, pitch, route and gong stay unchanged.
  for(const[start,end]of ranges){
    const limits=new Float64Array(Math.ceil((end-start)/blockBytes));
    for(let b=0;b<limits.length;b++){let blockPeak=0;for(let i=start+b*blockBytes;i<Math.min(end,start+(b+1)*blockBytes);i+=2)blockPeak=Math.max(blockPeak,Math.abs(data.readInt16LE(i)));limits[b]=blockPeak?Math.min(1,ceiling/(blockPeak*gain)):1;if(b%204===203){await yieldToMain();check()}}
    let level=Math.min(1,limits[0]);
    for(let b=0;b<limits.length;b++){
      const finish=Math.min(end,start+(b+1)*blockBytes),from=start+b*blockBytes,count=(finish-from)/2;
      const next=Math.min(limits[b],limits[b+1]??1,limits[b+2]??1,level+(1-level)*(1-Math.exp(-.01/.06)));
      for(let n=0;n<count;n++){const envelope=level+(next-level)*(count>1?n/(count-1):0),offset=from+n*2;data.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(data.readInt16LE(offset)*gain*envelope))),offset)}
      level=next;if(b%204===203){await yieldToMain();check()}
    }
  }
  check();
  return Uint8Array.from(data);
}

export function runBundledSpeech(file:string,args:string[],text:string,signal:AbortSignal):Promise<Buffer>{
  return new Promise((resolve,reject)=>{
    const env={...process.env};
    // Do not inherit global Java injection settings from another installation.
    delete env.JAVA_TOOL_OPTIONS;delete env._JAVA_OPTIONS;delete env.JDK_JAVA_OPTIONS;delete env.CLASSPATH;
    delete env.PYTHONHOME;delete env.PYTHONPATH;delete env.PYTHONSTARTUP;delete env.ESPEAK_DATA_PATH;
    const child=spawn(file,args,{windowsHide:true,shell:false,stdio:['pipe','pipe','ignore'],signal,env});
    const chunks:Buffer[]=[];let size=0,failed=false;
    const timer=setTimeout(()=>{failed=true;child.kill();reject(Error('Spracherzeugung hat zu lange gedauert.'))},90_000);
    child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>32*1024*1024){failed=true;child.kill()}else chunks.push(chunk)});
    child.stdin.on('error',()=>{});
    child.once('error',()=>{clearTimeout(timer);reject(Error('Mitgelieferte Sprachausgabe konnte nicht gestartet werden.'))});
    child.once('close',code=>{clearTimeout(timer);if(code===0&&!failed&&!signal.aborted)resolve(Buffer.concat(chunks));else reject(Error('Sprachausgabe wurde abgebrochen oder ist fehlgeschlagen.'))});
    child.stdin.end(text,'utf8');
  });
}

export class BundledSpeechService {
  private current:AbortController|null=null;
  constructor(private root:string,private platform:NodeJS.Platform=process.platform,private arch:string=process.arch,private run=runBundledSpeech){}
  private async resources(){
    if(!path.isAbsolute(this.root))throw Error('Sprachpaket fehlt.');
    const marker=JSON.parse(await fs.readFile(path.join(this.root,'ready.json'),'utf8'));
    if(marker.platform!==this.platform||marker.arch!==this.arch||marker.voice!=='marytts:dfki-pavoque-neutral')throw Error('Sprachpaket passt nicht zu diesem Gerät.');
    const java=path.join(this.root,'runtime/bin',this.platform==='win32'?'java.exe':'java');
    const files=[java,'worker/AnnouncementSpeech.class','lib/voice-dfki-pavoque-neutral-5.2.jar','lib/voice-bits1-hsmm-5.2.jar','lib/marytts-runtime-5.2.1.jar','lib/marytts-lang-de-5.2.1.jar',...['halfphoneFeatures_ac.mry','halfphoneUnits.mry','joinCostFeatures.mry','timeline_basenames.mry','timeline_waveforms.mry'].map(name=>'lib/voices/dfki-pavoque-neutral/'+name)];
    for(const file of files){const stat=await fs.stat(path.isAbsolute(file)?file:path.join(this.root,file));if(!stat.isFile()||!stat.size)throw Error('Sprachpaket ist unvollständig.')}
    return java;
  }
  async status(){try{await this.resources();return{ready:true,name:'Deutsche Stimmen sind enthalten · männlich und weiblich · offline verfügbar'}}catch{return{ready:false,name:'Mitgeliefertes Sprachpaket fehlt oder ist beschädigt. Bitte das vollständige Update installieren.'}}}
  cancel(){this.current?.abort()}
  async synthesize(value:unknown,voiceId:unknown=bundledAnnouncementVoice):Promise<Uint8Array>{
    if(!isBundledAnnouncementVoice(voiceId))throw Error('Ungültige Ansagenstimme.');
    const workerVoice=voiceId===bundledFemaleAnnouncementVoice?'bits1-hsmm':'dfki-pavoque-neutral';
    if(typeof value!=='string'||!value.trim()||[...value].length>10_000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Error('Ungültiger Durchsage-Text.');
    if(this.current)throw Error('Eine Spracherzeugung läuft bereits.');
    const controller=new AbortController();this.current=controller;
    try{
      const java=await this.resources();if(controller.signal.aborted)throw Error('Durchsage abgebrochen.');
      const args=['-Xmx512m','-Djava.awt.headless=true','-Dfile.encoding=UTF-8','-Dmary.base='+this.root,'-cp',[path.join(this.root,'worker'),path.join(this.root,'lib','*')].join(this.platform==='win32'?';':':'),'AnnouncementSpeech',workerVoice];
      const wav=await this.run(java,args,value,controller.signal);if(controller.signal.aborted)throw Error('Durchsage abgebrochen.');return await normalizeAnnouncementSpeech(wav,controller.signal);
    }finally{if(this.current===controller)this.current=null}
  }
}
