import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

export function espeakArguments(file:string,platform:NodeJS.Platform=process.platform){
  return [...(platform==='win32'?['--path='+path.dirname(file)]:[]),'-v','de','-s','155','-b','1','--stdin','--stdout'];
}

/** Standard standalone CLI protocol. Never uses SAPI, a neural model or a shell. */
export function runEspeak(file:string,args:string[],input:string,signal:AbortSignal):Promise<Buffer>{
  return new Promise((resolve,reject)=>{
    const child=spawn(file,args,{windowsHide:true,shell:false,stdio:['pipe','pipe','ignore'],signal});
    const chunks:Buffer[]=[];let size=0,overflow=false;
    child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>32*1024*1024){overflow=true;child.kill()}else chunks.push(chunk)});
    const timer=setTimeout(()=>{child.kill();reject(Error('Spracherzeugung hat zu lange gedauert.'))},30_000);
    child.stdin.on('error',()=>{});
    child.once('error',()=>{clearTimeout(timer);reject(Error('eSpeak NG konnte nicht gestartet werden.'))});
    child.once('close',code=>{clearTimeout(timer);code===0&&!overflow?resolve(Buffer.concat(chunks)):reject(Error('eSpeak NG konnte keine Sprache erzeugen.'))});
    child.stdin.end(input,'utf8');
  });
}

/** Accept finite PCM WAVs, not eSpeak stdout's streaming size sentinel or arbitrary files. */
export function readSpeechWav(input:Buffer,streaming=false):Uint8Array{
  const data=Buffer.from(input);
  if(streaming&&data.length>=44&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,16)==='WAVEfmt '&&data.toString('ascii',36,40)==='data'&&data.readUInt32LE(4)===0x7ffff024&&data.readUInt32LE(40)===0x7ffff000){data.writeUInt32LE(data.length-8,4);data.writeUInt32LE(data.length-44,40)}
  if(data.length<44||data.length>32*1024*1024||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WAVE'||data.readUInt32LE(4)+8!==data.length)throw Error('Ungültige Sprachausgabe.');
  let format=false,samples=false;
  for(let offset=12;offset+8<=data.length;){const kind=data.toString('ascii',offset,offset+4),size=data.readUInt32LE(offset+4),start=offset+8,end=start+size;if(end>data.length)throw Error('Unvollständige Sprachausgabe.');
    if(kind==='fmt '){if(size<16||data.readUInt16LE(start)!==1||data.readUInt16LE(start+2)!==1||data.readUInt16LE(start+14)!==16||data.readUInt32LE(start+4)!==22050)throw Error('Nicht unterstütztes Sprachformat.');format=true}
    if(kind==='data'){samples=size>0&&size%2===0}
    offset=end+(size%2);
  }
  if(!format||!samples)throw Error('Leere Sprachausgabe.');
  return Uint8Array.from(data);
}

export class EspeakService{
  private current:AbortController|null=null;
  private verified='';
  constructor(private readonly executable:()=>Promise<string|null>,_tempRoot:string,private readonly run=runEspeak){}
  private async file(){const file=await this.executable();if(!file||!path.isAbsolute(file)||!/^espeak-ng(?:\.exe)?$/i.test(path.basename(file))||!(await fs.stat(file)).isFile())throw Error('Bitte eSpeak NG separat installieren und auswählen.');return file}
  async status(){
    try{const file=await this.file();if(this.verified!==file)await this.synthesize('Guten Tag.');return{ready:true,name:'eSpeak NG · Deutsch (lokal geprüft)'}}catch{return{ready:false,name:'eSpeak NG nicht verfügbar. Bitte separat im Standardordner ohne Umlaute installieren.'}}
  }
  cancel(){this.current?.abort()}
  async synthesize(value:unknown):Promise<Uint8Array>{
    if(typeof value!=='string'||!value.trim()||[...value].length>10_000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Error('Ungültiger Durchsage-Text.');
    if(this.current)throw Error('Eine Spracherzeugung läuft bereits.');
    const controller=new AbortController();this.current=controller;
    try{
      const file=await this.file();
      if(controller.signal.aborted)throw Error('Durchsage abgebrochen.');
      const data=await this.run(file,espeakArguments(file),value,controller.signal);
      if(controller.signal.aborted)throw Error('Durchsage abgebrochen.');
      const wav=readSpeechWav(data,true);this.verified=file;return wav;
    }finally{
      if(this.current===controller)this.current=null;
    }
  }
}
