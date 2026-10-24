const{app,BrowserWindow,ipcMain,session}=require('electron'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),folder=process.env.FIXES_PROBE_FOLDER,url=process.env.FIXES_PROBE_URL;assert(folder&&url?.startsWith('http://127.0.0.1:'));
app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('mute-audio');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
const{BundledSpeechService}=require(path.join(root,'dist-electron/electron/announcements/BundledSpeechService.js'));
const{createSizedOperatorWindow}=require(path.join(root,'dist-electron/electron/windowStartup.js'));
const engine=new BundledSpeechService(path.join(root,'work/bundled-speech/win32-x64'));
let window,peak=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(code,timeout=40000){const started=Date.now();while(!await window.webContents.executeJavaScript(code)){if(Date.now()-started>timeout)throw Error('Timeout '+code);await sleep(80)}}
app.whenReady().then(async()=>{try{
 session.defaultSession.webRequest.onBeforeRequest((details,done)=>done({cancel:/^https?:/.test(details.url)&&!details.url.startsWith(new URL(url).origin+'/')}));
 ipcMain.handle('probe:settings',()=>({enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true}));
 ipcMain.handle('probe:status',()=>engine.status());ipcMain.handle('probe:cancel',()=>engine.cancel());ipcMain.handle('probe:indicator',()=>{});
 ipcMain.handle('probe:speech',async(_event,text)=>{const wav=await engine.synthesize(text),b=Buffer.from(wav),i=b.indexOf(Buffer.from('data'));for(let n=i+8;n+1<b.length;n+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(n)));return wav});
 window=createSizedOperatorWindow({bounds:{x:0,y:0,width:1920,height:1080},minimumSize:{width:960,height:620},resizable:true,maximizable:true,startMode:'window'},geometry=>new BrowserWindow({...geometry,show:false,frame:false,webPreferences:{preload:path.join(__dirname,'weather-speech-preload.cjs'),offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}}));
 window.webContents.on('paint',()=>{});window.webContents.setFrameRate(30);
 window.webContents.on('console-message',(_e,level,message)=>{if(level>=2)console.log('renderer',message)});
 await window.loadURL(url);await wait('!!window.weatherSpeechFixture');await window.webContents.executeJavaScript('document.fonts.ready');await sleep(500);
 const geometry=await window.webContents.executeJavaScript('(()=>{const root=document.querySelector(".output-composition").getBoundingClientRect(),warning=document.querySelector(".output-weather-layer").getBoundingClientRect(),content=document.querySelector(".output-content-area").getBoundingClientRect();return{initialWidth:window.fixtureInitialWidth,width:innerWidth,height:innerHeight,warningHeight:warning.height,contentTop:content.top-root.top,bodyFont:parseFloat(getComputedStyle(document.querySelector(".weather-warning-banner")).fontSize),titleFont:parseFloat(getComputedStyle(document.querySelector(".weather-warning-banner header strong")).fontSize),weather:document.querySelector(".weather-current svg").getAttribute("data-weather-kind")}})()');
 assert(geometry.initialWidth>=1800);assert(Math.abs(geometry.warningHeight-geometry.height*.24)<2);assert(Math.abs(geometry.contentTop-geometry.warningHeight)<2);assert(geometry.bodyFont>=27&&geometry.titleFont>=31);assert.equal(geometry.weather,'snow');
 fs.writeFileSync(path.join(folder,'snow-warning.png'),(await window.webContents.capturePage()).toPNG());
 for(const[code,name]of[[0,'sun'],[65,'rain'],[95,'thunder']]){await window.webContents.executeJavaScript(`window.weatherSpeechFixture.setCode(${code})`);await wait(`document.querySelector('.weather-current svg').dataset.weatherKind==='${name}'`);await sleep(100);fs.writeFileSync(path.join(folder,name+'.png'),(await window.webContents.capturePage()).toPNG())}
 await wait(`![...document.querySelectorAll('button')].find(b=>b.textContent==='Tonprobe starten')?.disabled`);
 await window.webContents.executeJavaScript(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Tonprobe starten').click()`,true);
 await wait(`window.weatherSpeechFixture.trace.includes('speech')`);await wait('!window.weatherSpeechFixture.testing()');assert(peak>20000&&peak<=29206);
 await window.webContents.executeJavaScript(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Tonprobe starten').click()`,true);await wait('window.weatherSpeechFixture.active()');await window.webContents.executeJavaScript('window.weatherSpeechFixture.closeSettings()');await wait('!window.weatherSpeechFixture.testing()&&!window.weatherSpeechFixture.active()');
 const trace=await window.webContents.executeJavaScript('window.weatherSpeechFixture.trace');const report={geometry,peak,peakDb:20*Math.log10(peak/32768),trace,offAirTest:true,closingStops:true,physicalAudioMuted:true};fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2));console.log('PASS native weather, warning geometry, initial workspace viewport and actual OFF AIR speech probe');
 window.webContents.stopPainting();window.webContents.removeAllListeners('paint');await window.loadURL('about:blank');await sleep(300);window.close();app.quit();
 }catch(error){console.error(error);engine.cancel();if(window&&!window.isDestroyed())window.close();app.exit(1)}});
