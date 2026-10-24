const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
async function check(root,platform=process.platform){
 const java=path.join(root,'runtime/bin',platform==='win32'?'java.exe':'java');
 const args=['-Xmx512m','-Djava.awt.headless=true','-Dfile.encoding=UTF-8','-Dmary.base='+root,'-cp',[path.join(root,'worker'),path.join(root,'lib/*')].join(platform==='win32'?';':':'),'AnnouncementSpeech'];
 const wav=await new Promise((resolve,reject)=>{
  const child=spawn(java,args,{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});let output=[],bytes=0,errors='';
  const timer=setTimeout(()=>{child.kill();reject(Error('Speech smoke timed out'))},90000);
  child.stdout.on('data',b=>{bytes+=b.length;if(bytes>32*1024*1024){child.kill();reject(Error('Speech smoke output too large'))}else output.push(b)});
  child.stderr.on('data',b=>{errors=(errors+b).slice(-4000)});child.stdin.on('error',()=>{});
  child.on('error',e=>{clearTimeout(timer);reject(e)});child.on('close',c=>{clearTimeout(timer);c===0?resolve(Buffer.concat(output)):reject(Error('Speech smoke failed '+c+': '+errors))});
  child.stdin.end('Herzlich willkommen zum Gottesdienst. Die nächste Veranstaltung beginnt um 12:30 Uhr im Gemeindesaal. Grüße aus Bielefeld.');
 });
 const {readBundledSpeechWav}=require('../dist-electron/electron/announcements/BundledSpeechService.js');
 readBundledSpeechWav(wav);
 await fs.writeFile(path.join(root,'verified-speech.wav'),wav);
 const report={voice:'marytts:dfki-pavoque-neutral',bytes:wav.length,sampleRate:16000,physicalPlayback:false,platform};
 await fs.writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));return report;
}
module.exports={check};
if(require.main===module)check(path.resolve(process.argv[2]),process.argv[3]).catch(e=>{console.error(e);process.exitCode=1});
