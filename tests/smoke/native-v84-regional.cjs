// Real desktop main/preload IPC and dialog templates, isolated from the operator's profile.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');

async function parent(){
  const {spawn}=require('node:child_process');
  const {cleanupProfile}=require('./run-login-profile.cjs');
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(require('electron'),[__filename],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});
  let output='',profile='';
  child.stdout.on('data',chunk=>{const text=chunk.toString();output+=text;process.stdout.write(text);const match=output.match(/^REGIONAL_SMOKE_PROFILE: (.+)\r?$/m);if(match)profile=match[1].trim()});
  child.stderr.on('data',chunk=>process.stderr.write(chunk));
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
  if(profile&&!await cleanupProfile(profile,{childExited:true}))console.warn(`REGIONAL_SMOKE_PROFILE_RETAINED: ${profile}`);
  assert.equal(code,0);assert.ok(output.includes('NATIVE_REGIONAL_SMOKE_PASS'));
}

async function desktop(){
  const {app,BrowserWindow,dialog}=require('electron');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'regie-login-smoke-'));
  app.setPath('userData',profile);
  app.setAppPath(path.resolve(__dirname,'../..'));
  console.log(`REGIONAL_SMOKE_PROFILE: ${profile}`);
  fs.writeFileSync(path.join(profile,'app-preferences.json'),JSON.stringify({openAtLogin:false,checkUpdatesAtLogin:false,checkUpdatesOnStartup:false,autoDownloadUpdates:false,installUpdatesOnQuit:false}));
  // Test process only: never register protocols/login entries or expose windows on real displays.
  app.setAsDefaultProtocolClient=()=>false;
  app.setLoginItemSettings=()=>{throw Error('Smoke must not change operating-system login settings')};
  BrowserWindow.prototype.show=()=>{};BrowserWindow.prototype.showInactive=()=>{};BrowserWindow.prototype.focus=()=>{};
  const timeout=setTimeout(()=>{console.error('Native regional smoke timeout');app.exit(1)},30000);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  require('../../dist-electron/electron/main.js');
  await app.whenReady();
  let control;
  for(let attempt=0;attempt<200&&!control;attempt++){
    for(const win of BrowserWindow.getAllWindows()){
      if(win.isDestroyed()||!win.webContents.getURL().startsWith('file:'))continue;
      if(await win.webContents.executeJavaScript("Boolean(window.desktop?.regionalSettings && document.getElementById('root')?.childElementCount)").catch(()=>false)){control=win;break}
    }
    if(!control)await wait(100);
  }
  assert.ok(control,'real control preload bridge did not become ready');
  assert.ok(control.webContents.getURL().endsWith('/dist/index.html'),'control did not load the built application');
  await control.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const selection=await control.webContents.executeJavaScript("window.desktop.regionalSettings.write({language:'de',germanRegion:'bavarian-upper'})");
  assert.deepEqual(selection,{language:'de',germanRegion:'bavarian-upper'});
  assert.equal(app.getPath('userData'),profile);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(profile,'device-settings.json'),'utf8')).regionalSelection,selection);

  const helper=new BrowserWindow({show:false,webPreferences:{preload:path.resolve(__dirname,'../../dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false}});
  await helper.loadURL('about:blank');
  const denied=await helper.webContents.executeJavaScript("window.desktop.regionalSettings.write({language:'de',germanRegion:'berlin'}).then(()=>false,()=>true)");
  assert.equal(denied,true,'secondary window unexpectedly gained settings authority');
  helper.destroy();

  let captured;
  const previous=dialog.showMessageBox;
  dialog.showMessageBox=async(...args)=>{captured=args.at(-1);return {response:3,checkboxChecked:false}};
  const {autoUpdater}=require('electron-updater');
  autoUpdater.emit('update-available',{version:'99.0.84',releaseNotes:''});
  for(let attempt=0;attempt<100&&!captured;attempt++)await wait(20);
  dialog.showMessageBox=previous;
  assert.ok(captured,'native update dialog was not requested');
  const pack=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../shared/regional/packs/bavarian-upper.json'),'utf8'));
  assert.equal(captured.title,pack.native.updateAvailableTitle);
  assert.equal(captured.message,pack.native.updateAvailableMessage.replace('{version}','99.0.84'));
  assert.deepEqual(captured.buttons,[pack.native.updateInstallNow,pack.native.updateLater,pack.native.updateInstallOnExit,pack.native.cancel]);
  assert.equal(captured.cancelId,3);
  assert.equal(autoUpdater.autoDownload,false);
  assert.equal(autoUpdater.autoInstallOnAppQuit,false);
  clearTimeout(timeout);
  console.log('NATIVE_REGIONAL_SMOKE_PASS: isolated real main/preload; control-only persisted selection; secondary window denied; localized four-action dialog; no download/install');
  app.exit(0);
}
if(process.versions.electron)desktop().catch(error=>{console.error(error);require('electron').app.exit(1)});
else parent().catch(error=>{console.error(error);process.exitCode=1});
