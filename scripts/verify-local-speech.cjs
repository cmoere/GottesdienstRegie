// File-only check: no sound is played and no installed application/profile is opened.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {EspeakService}=require('../dist-electron/electron/announcements/EspeakService.js');
(async()=>{
 const executable=path.resolve(process.argv[2]||''),root=path.resolve('work/v89-espeak/probe');
 assert(/espeak-ng\.exe$/.test(executable));
 const service=new EspeakService(async()=>executable,root),status=await service.status();assert(status.ready);
 const bytes=await service.synthesize('Guten Morgen. Herzlich willkommen in der Philippus Gemeinde. Bitte nehmen Sie im Saal Platz.'),data=Buffer.from(bytes);
 let nonzero=0;for(let i=44;i+1<data.length;i+=2)if(data.readInt16LE(i)!==0)nonzero++;
 assert(nonzero>1000);await fs.writeFile(path.join(root,'verified-speech.wav'),data);
 const report={engine:status.name,bytes:data.length,sampleRate:22050,nonzeroSamples:nonzero,played:false};
 await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exitCode=1});
