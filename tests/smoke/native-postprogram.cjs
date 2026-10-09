// Run after npm run build, with Vite at localhost:5173. Uses an isolated profile.
const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('path'),fs=require('fs'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/postprogram-native');
const packaged=process.argv.find(arg=>arg.startsWith('--packaged='));
const runtime=packaged?path.resolve(root,packaged.slice('--packaged='.length)):process.argv.includes('--packaged')?path.join(root,'release/win-unpacked/resources/app.asar'):root;
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
let main,operator,state={revision:0,slide:null,quick:null,appMode:{mode:'test',onAir:true}};
setTimeout(()=>{console.error('Native smoke exceeded 90 seconds');app.exit(1)},90000).unref();
for(const channel of ['device:get','spelling:set-language'])ipcMain.handle(channel,()=>null);
ipcMain.handle('outputs:get-state',()=>state);
ipcMain.handle('outputs:get-app-mode',()=>state.appMode);
// Same payload boundary as desktop MAIN, without connecting to real displays or Firebase.
ipcMain.handle('outputs:send-slide',(_event,slide)=>{state={...state,slide,revision:state.revision+1};main.webContents.send('outputs:state',state);return true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(window,expression){for(let i=0;i<100;i++){if(await window.webContents.executeJavaScript(expression))return;await sleep(100)}throw Error('Timed out: '+expression)}
async function capture(window,name){await sleep(700);fs.writeFileSync(path.join(out,name+'.png'),(await window.webContents.capturePage()).toPNG())}
app.whenReady().then(async()=>{
 try{
  const options={show:false,width:1920,height:1080,useContentSize:true,webPreferences:{preload:path.join(runtime,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}};
  main=new BrowserWindow(options);operator=new BrowserWindow({...options,width:1440,height:900});
  await main.loadFile(path.join(runtime,'dist/index.html'),{hash:'output?role=main'});
  console.log('MAIN loaded');
  await operator.loadURL('http://127.0.0.1:5173/tests/smoke/postprogram-fixture.html');
  console.log('Operator loaded');
  await until(operator,"document.querySelector('.preview-nav.next') && !document.querySelector('.preview-nav.next').disabled");
  await operator.webContents.executeJavaScript("document.querySelector('.preview-nav.next').click()");
  await until(main,"document.body.innerText.includes('Gemeindeforum')");
  await until(operator,"document.querySelectorAll('.post-program-room-notice').length===2");
  const text=await main.webContents.executeJavaScript('document.body.innerText');
  assert(text.includes('Zweiter Termin'));assert(!text.includes('Zu spät'));assert(!text.includes('-saal'));assert(text.includes('TESTBETRIEB'));
  await capture(main,'main-events');await capture(operator,'operator-events');
  await operator.webContents.executeJavaScript('window.cancelNext()');
  assert((await main.webContents.executeJavaScript('document.body.innerText')).includes('Gemeindeforum'));
  await operator.webContents.executeJavaScript("document.querySelector('.preview-nav.next').click()");
  await until(main,"document.body.innerText.includes('Wir bitten alle Besucher, den Raum zu verlassen.')");
  await until(operator,"[...document.querySelectorAll('.post-program-room-notice')].every(el=>el.innerText.includes('Wir bitten alle Besucher, den Raum zu verlassen.'))");
  assert.equal(await main.webContents.executeJavaScript("getComputedStyle(document.querySelector('.post-program-room-notice>header')).backgroundColor"),'rgb(96, 143, 154)');
  await capture(main,'main-leave');await capture(operator,'operator-leave');
  const paragraph=await operator.webContents.executeJavaScript("(()=>{const p=document.querySelector('.live-slide-panel .post-program-body>p'),style=getComputedStyle(p);return{whiteSpace:style.whiteSpace,color:style.color,overflow:style.overflow}})()");
  assert.equal(paragraph.whiteSpace,'normal');assert.equal(paragraph.color,'rgb(255, 255, 255)');assert.notEqual(paragraph.overflow,'hidden');
  console.log('PASS: native last-slide click, MAIN + two previews, inclusive 61 minutes, resolved room, stable snapshot/color, safe next update, test watermark');app.exit(0);
 }catch(error){console.error(error);app.exit(1)}
});
