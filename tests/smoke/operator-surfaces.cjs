'use strict';
const {app,BrowserWindow,ipcMain,session}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),base=process.env.OPERATOR_DESIGN_URL;
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(base));
const folder=fs.mkdtempSync(path.join(root,'work/v95-operator-surfaces-'));
app.setPath('userData',path.join(folder,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,label){for(let i=0;i<150;i++){if(await check())return;await sleep(100)}throw Error('OPERATOR_SURFACE_TIMEOUT '+label)}
app.whenReady().then(async()=>{let window;try{
 const handlers=new Map([
  ['device:get',()=>({id:'design-test',organizationId:'test',name:'Test-PC',type:'personal',platform:'win32',status:'online'})],
  ['platform:appearance',()=>({})],['window-preferences:get',()=>({})],['displays:list',()=>[]],
  ['updates:status',()=>({state:'not-available'})],['updates:current-version',()=>require('../../package.json').version],
  ['updates:metadata',()=>({})],['updates:previous',()=>[]],['powerpoint:receiver-boot',()=>null],
  ['storage:snapshot',()=>({totalBytes:0,categories:[]})],
  ['media:online-status',()=>({online:true})],['media:cloud-list',()=>[]],['media:list',()=>[]],
 ]);
 for(const match of fs.readFileSync(path.join(root,'electron/preload.ts'),'utf8').matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g))if(!handlers.has(match[1]))handlers.set(match[1],()=>null);
 for(const [channel,handler]of handlers)ipcMain.handle(channel,handler);
 session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:/^https?:/.test(details.url)&&new URL(details.url).origin!==base}));
 window=new BrowserWindow({show:false,width:1440,height:900,useContentSize:true,webPreferences:{preload:path.join(root,'dist-electron/electron/preload.js'),offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false}});
 window.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)console.error('Operator:',event.message)});
 const js=code=>window.webContents.executeJavaScript(code);
 await window.loadURL(base+'/tests/smoke/full-app-powerpoint.html?demo=1');
 await until(()=>js('!!document.querySelector(".production-app>.main")'),'App');
 const report=[];
 for(const theme of ['light','dark'])for(const width of [1000,1440,1920]){
  window.setContentSize(width,900);
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);window.webContents.invalidate();await sleep(750);
  const metrics=await js(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return{main:rect('.production-app>.main'),toolbar:rect('.production-app>.toolbar'),timeline:rect('.production-app>.production-timeline'),status:rect('.production-app>.status'),children:[...document.querySelector('.production-app').children].map(e=>({className:e.className,position:getComputedStyle(e).position,gridArea:getComputedStyle(e).gridArea}))}})()`);
  assert(metrics.main.height>450,JSON.stringify(metrics));assert(metrics.status.bottom<=901);
  report.push({theme,width,...metrics});
  fs.writeFileSync(path.join(folder,`app-${theme}-${width}.png`),(await window.webContents.capturePage()).toPNG());
 }
 await js(`Array.from(document.querySelectorAll('.menubar>button')).find(b=>b.textContent.trim()==='Einstellungen').click()`);
 await until(()=>js('!!document.querySelector(".settings-modal")'),'settings');
 for(const theme of ['light','dark']){
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);await sleep(350);
  assert(await js('!!document.querySelector(".settings-modal") && !document.querySelector(".fatal-render-error")'),'Settings must remain mounted');
  assert.equal(await js('getComputedStyle(document.querySelector(".settings-modal")).borderRadius'),'12px','Settings must use the shared panel geometry');
  assert.equal(await js('getComputedStyle(document.querySelector(".settings-modal select")).borderRadius'),'7px','Legacy global square controls must not override operator controls');
  fs.writeFileSync(path.join(folder,`settings-${theme}.png`),(await window.webContents.capturePage()).toPNG());
 }
 // Exercise authored regional wording directly in this isolated development
 // profile. This does not change the production availability manifest.
 const {loadLocalDataModule}=require('../../scripts/export-regional-corpus.cjs');
 const {regionalVariants}=loadLocalDataModule(root,'shared/regional/catalog.ts');
 const regionalReport=[];
 window.setContentSize(1000,900);
 for(const {id}of regionalVariants){
  assert(await js(`(async()=>{const resources=await import('/src/regional/resources.ts');const prefs=await import('/src/preferences.ts');if(!await resources.loadRegionalInterfacePack(${JSON.stringify(id)}))return false;prefs.usePreferences.setState({language:'de',germanRegion:${JSON.stringify(id)}});return true})()`),'Regional pack must validate: '+id);
  await sleep(100);
  const metrics=await js(`(()=>{const modal=document.querySelector('.settings-modal'),close=modal?.querySelector('header>button');if(!modal||!close)return null;const box=modal.getBoundingClientRect(),action=close.getBoundingClientRect();return{width:box.width,left:box.left,right:box.right,closeVisible:action.left>=0&&action.right<=innerWidth&&action.top>=0&&action.bottom<=innerHeight,modalOwnsBottomEdge:modal.contains(document.elementFromPoint(box.left+box.width/2,Math.min(innerHeight-1,box.bottom-8))),fatal:!!document.querySelector('.fatal-render-error')}})()`);
  assert(metrics&&!metrics.fatal&&metrics.closeVisible&&metrics.modalOwnsBottomEdge&&metrics.left>=0&&metrics.right<=1001,JSON.stringify({id,metrics}));
  regionalReport.push({id,...metrics});
  if(['aachen','bavarian-upper','bielefeld-ravensberg'].includes(id))fs.writeFileSync(path.join(folder,`settings-${id}-1000.png`),(await window.webContents.capturePage()).toPNG());
 }
 fs.writeFileSync(path.join(folder,'regional-surfaces.json'),JSON.stringify(regionalReport,null,2));
 await js(`(async()=>{const {usePreferences}=await import('/src/preferences.ts');usePreferences.setState({language:'de',germanRegion:null})})()`);
 await js(`document.querySelector('.settings-modal>header>button').click();window.alert=text=>{window.__operatorDiagnosticText=String(text)};void 0`);
 await until(()=>js(`Array.from(document.querySelectorAll('.menubar button')).some(b=>b.textContent.includes('Werkzeuge'))`),'German tools menu');
 await js(`Array.from(document.querySelectorAll('.menubar button')).find(b=>b.textContent.includes('Werkzeuge')).click()`);
 await until(()=>js(`Array.from(document.querySelectorAll('.menu-popup button')).some(b=>b.textContent.includes('Diagnose'))`),'diagnostics action');
 await js(`Array.from(document.querySelectorAll('.menu-popup button')).find(b=>b.textContent.includes('Diagnose')).click()`);
 await until(()=>js(`typeof window.__operatorDiagnosticText==='string'`),'diagnostics text');
 const diagnosticText=await js('window.__operatorDiagnosticText');
 assert(diagnosticText.includes('Version: '+require('../../package.json').version),'Diagnostics must report the installed version: '+diagnosticText);
 fs.writeFileSync(path.join(folder,'diagnostics.txt'),diagnosticText);
 await js(`const base=document.createElement('base');base.href=${JSON.stringify(base+'/')};document.head.prepend(base);window.dispatchEvent(new CustomEvent('gottesdienstregie:open-help',{detail:'Erste Schritte'}))`);
 await until(()=>js('!!document.querySelector(".help-dialog")'),'help');await sleep(350);
 fs.writeFileSync(path.join(folder,'help.png'),(await window.webContents.capturePage()).toPNG());
 await window.loadURL(base+'/tests/smoke/full-app-powerpoint.html?demo=1&surface=media#media');
 await until(()=>js('!!document.querySelector(".cloud-media-browser")'),'media browser');
 for(const theme of ['light','dark']){
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);window.webContents.invalidate();await sleep(500);
  assert(await js('!document.querySelector(".fatal-render-error")'),'Media browser must remain mounted');
  fs.writeFileSync(path.join(folder,`media-${theme}.png`),(await window.webContents.capturePage()).toPNG());
 }
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.length,regionalSurfaces:regionalReport.length,folder}));app.exit(0);
}catch(error){console.error(error);app.exit(1)}finally{window?.destroy()}});
