const{app,BrowserWindow}=require('electron'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const folder=process.env.SPEECH_PROBE_FOLDER,url=process.env.SPEECH_PROBE_URL;assert(folder&&url?.startsWith('http://127.0.0.1:'));
app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('mute-audio');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let window;
async function wait(expression,timeout=25000){const start=Date.now();while(!await window.webContents.executeJavaScript(expression)){if(Date.now()-start>timeout){console.log('DIAGNOSTIC',await window.webContents.executeJavaScript('window.speechFixture?.debug()'));throw Error('Timeout: '+expression)}await sleep(100)}}
app.whenReady().then(async()=>{try{
 window=new BrowserWindow({show:false,frame:false,width:1920,height:1080,webPreferences:{offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}});window.webContents.on('paint',()=>{});window.webContents.setFrameRate(30);
 window.webContents.on('console-message',(_e,level,message)=>{if(level>=2)console.log('renderer',message)});
 await window.loadURL(url);await wait('!!window.speechFixture');await sleep(3000);await wait('!!window.speechFixture');
 assert(!await window.webContents.executeJavaScript('window.speechFixture.active()'));
 await window.webContents.executeJavaScript('window.fixtureContent=document.querySelector("#preserved");window.speechFixture.advance()');await wait('window.speechFixture.active()');await sleep(100);
 const geometry=await window.webContents.executeJavaScript('(()=>{const icon=document.querySelector(".announcement-speaker-indicator"),r=icon.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,label:icon.getAttribute("aria-label"),same:window.fixtureContent===document.querySelector("#preserved")}})()');assert(geometry.x<50&&geometry.y<50&&geometry.width<60&&geometry.same);assert.equal(geometry.label,'Durchsage läuft');
 fs.writeFileSync(path.join(folder,'speaker.png'),(await window.webContents.capturePage()).toPNG());
 await wait('window.speechFixture.trace.includes(false)&&!window.speechFixture.active()',40000);
 const trace=await window.webContents.executeJavaScript('window.speechFixture.trace');assert(trace.filter(Boolean).length>=2,'Gong and speech must both reach actual playing');
 await window.webContents.executeJavaScript('window.speechFixture.reset()');await sleep(1100);await window.webContents.executeJavaScript('window.speechFixture.advance()');await wait('window.speechFixture.active()');await window.webContents.executeJavaScript('window.speechFixture.cancel()');await wait('!window.speechFixture.active()');
 assert.equal(await window.webContents.executeJavaScript('document.querySelectorAll(".announcement-speaker-indicator").length'),0);
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({geometry,trace,physicalAudioMuted:true,cancellation:true},null,2));console.log('PASS: real Chromium gong/speech playback, speaker overlay and OFF AIR cancellation; physical audio muted.');
 window.webContents.stopPainting();window.webContents.removeAllListeners('paint');await window.loadURL('about:blank');await sleep(300);window.close();app.quit();
 }catch(error){console.error(error);if(window&&!window.isDestroyed())window.close();app.exit(1)}});
