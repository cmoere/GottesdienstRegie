// Run: node_modules/.bin/electron tests/smoke/native-v81-login.cjs
// Exercises the actual main entry using an isolated profile, without OS login writes.
const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'regie-login-smoke-'));
app.setPath('userData',profile);
fs.writeFileSync(path.join(profile,'app-preferences.json'),JSON.stringify({openAtLogin:false,checkUpdatesAtLogin:true,installUpdatesOnQuit:true,autoDownloadUpdates:true}));
process.argv.push('--login-startup');
let windows=0,loginWrites=0;
app.setLoginItemSettings=()=>{loginWrites++;throw Error('Native smoke must never change Windows autostart')};
app.on('browser-window-created',()=>{windows++});
const deadline=setTimeout(()=>{console.error('Background main entry did not exit');app.exit(1)},10000);
app.on('will-quit',()=>{
  clearTimeout(deadline);
  try{
    assert.equal(windows,0,'background startup created a window');
    assert.equal(BrowserWindow.getAllWindows().length,0);
    assert.equal(loginWrites,0);
    const {autoUpdater}=require('electron-updater');
    assert.equal(autoUpdater.autoDownload,false);
    assert.equal(autoUpdater.autoInstallOnAppQuit,false);
    console.log('LOGIN_BACKGROUND_SMOKE_PASS: real main exited; zero windows/login writes; download/install disabled');
  }catch(error){console.error(error);process.exitCode=1}
});
// Chromium still owns profile files in exit callbacks; keep cleanup outside this process.
console.log(`LOGIN_SMOKE_PROFILE: ${profile}`);
require('../../dist-electron/electron/main.js');
