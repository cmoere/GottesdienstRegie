// Isolated native preparation check: real compiled preload/access/repository, no real Firebase or audio.
const {app,BrowserWindow,ipcMain,session}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/native-v83-preparation');
fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(out,'profile-'));app.setPath('userData',profile);
const {DeviceSettingsRepository}=require(path.join(root,'dist-electron/electron/DeviceSettingsRepository.js'));
const {createAnnouncementSettingsAccess}=require(path.join(root,'dist-electron/electron/announcements/SettingsAccess.js'));
const repository=new DeviceSettingsRepository(path.join(profile,'device-settings.json'));
let control,other,starts=0;const external=[];
const access=createAnnouncementSettingsAccess(repository,event=>Boolean(control&&!control.isDestroyed()&&!control.webContents.isDestroyed()&&event.sender.id===control.webContents.id&&event.senderFrame===control.webContents.mainFrame));
ipcMain.handle('announcements:settings-read',event=>access.read(event));
ipcMain.handle('announcements:settings-write',(event,value)=>access.write(event,value));
ipcMain.handle('community:start',event=>{starts++;setTimeout(()=>event.sender.send('community:announcements',[
 {messageId:'fictional-public',titel:'Hinweis zur Vorbereitung',status:'public',showDurchsage:true,durchsageSaalscreen:true,textDurchsageSaalscreen:'Herzlich willkommen. Bitte nehmen Sie im Saal Platz.',internalComment:'PRIVATE_SENTINEL'},
 {messageId:'fictional-internal',titel:'INTERNAL_SENTINEL',status:'internal',showDurchsage:true,durchsageSaalscreen:true,textDurchsageSaalscreen:'Nicht öffentlich.'}
]),30);return true;});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(code){const start=Date.now();while(Date.now()-start<15000){if(await control.webContents.executeJavaScript(code))return;await sleep(80)}throw Error('Timeout: '+code)}
const timeout=setTimeout(()=>{console.error('Native v83 preparation timed out');app.exit(1)},90000);timeout.unref();
app.whenReady().then(async()=>{try{
 session.defaultSession.webRequest.onBeforeRequest((details,done)=>{const blocked=/^https?:/.test(details.url)&&!details.url.startsWith('http://127.0.0.1:5183/');if(blocked)external.push(details.url);done({cancel:blocked});});
 const options={show:false,width:1200,height:1000,webPreferences:{preload:path.join(root,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}};
 control=new BrowserWindow(options);other=new BrowserWindow(options);
 await control.loadURL('http://127.0.0.1:5183/tests/smoke/native-v83.html');
 await until(`document.body.innerText.includes('Bitte nehmen Sie im Saal Platz.')&&document.querySelector('input[type=number]')?.disabled===false`);
 const js=code=>control.webContents.executeJavaScript(code);
 assert.equal(await js(`document.querySelector('input[type=checkbox]').disabled`),true);
 assert.equal(await js(`document.querySelector('input[type=checkbox]').checked`),false);
 assert.equal(await js(`(()=>{const labels=[...document.querySelectorAll('.settings-group>label')].map(label=>label.getBoundingClientRect());return labels.every((label,index)=>index===0||label.top>=labels[index-1].bottom)})()`),true,'Each setting must occupy a separate readable row');
 assert.equal(await js(`document.body.innerText.includes('PRIVATE_SENTINEL')||document.body.innerText.includes('INTERNAL_SENTINEL')`),false);
 await js(`(()=>{const fields=document.querySelectorAll('input[type=number]');for(const [index,value]of ['9','18'].entries()){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(fields[index],value);fields[index].dispatchEvent(new Event('input',{bubbles:true}));}})()`);
 await sleep(100);await js(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Ansageneinstellungen speichern').click()`);
 await until(`document.body.innerText.includes('Einstellungen gespeichert.')`);
 assert.deepEqual(await repository.readAnnouncements(),{enabled:false,intervalMinutes:9,musicRemainingPercent:18,voiceId:'de_DE-mls-medium',speakerId:null,voiceAccepted:false});
 assert.equal(await js(`window.desktop.announcements.writeSettings({enabled:true,intervalMinutes:9,musicRemainingPercent:18,voiceId:'de_DE-mls-medium',speakerId:2,voiceAccepted:true}).then(()=>false,()=>true)`),true);
 await other.loadURL('data:text/html,<title>Output access probe</title>');
 assert.equal(await other.webContents.executeJavaScript(`window.desktop.announcements.readSettings().then(()=>false,()=>true)`),true);
 assert.equal(await other.webContents.executeJavaScript(`window.desktop.announcements.writeSettings({enabled:false,intervalMinutes:12,musicRemainingPercent:50,voiceId:'de_DE-mls-medium',speakerId:null,voiceAccepted:false}).then(()=>false,()=>true)`),true);
 assert.equal((await new DeviceSettingsRepository(path.join(profile,'device-settings.json')).readAnnouncements()).intervalMinutes,9);
 assert.equal(await js(`!!document.querySelector('audio,video')`),false);
 assert.equal(starts,1);assert.deepEqual(external,[]);
 fs.writeFileSync(path.join(out,'settings.png'),(await control.webContents.capturePage()).toPNG());
 await new Promise(resolve=>{control.webContents.once('did-finish-load',resolve);control.reload();});
 await until(`document.querySelector('input[type=number]')?.value==='9'`);
 assert.equal(await js(`document.querySelectorAll('input[type=number]')[1].value`),'18');
 console.log('NATIVE_V83_PREPARATION_PASS: actual preload, guarded settings, UI save/reload, filtered hall texts, no media/download; profile retained:',profile);
 clearTimeout(timeout);other.destroy();control.destroy();app.exit(0);
}catch(error){console.error(error);app.exit(1)}});
