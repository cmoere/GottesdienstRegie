'use strict';
const {app,BrowserWindow,ipcMain,screen}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),folder=fs.mkdtempSync(path.join(root,'work/v97-native-')),base=process.env.OPERATOR_DESIGN_URL;
app.setPath('userData',path.join(folder,'profile'));
const {OutputWindowManager}=require('../../dist-electron/electron/OutputWindowManager');
const {runSlideWorker}=require('../../dist-electron/electron/localSlides/runSlideWorker');
const {parseSlideDraft}=require('../../dist-electron/shared/localSlideDraft');
const modelResult=JSON.parse(fs.readFileSync(path.join(root,'work/v97-utility-model-q4-result.json'),'utf8'));
const realDrafts=parseSlideDraft(modelResult.message.text,3),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,label){for(let i=0;i<200;i++){if(await check())return;await sleep(75)}throw Error('TIMEOUT '+label)}
app.whenReady().then(async()=>{
 let operator,manager;
 try{
  const preload=path.join(root,'dist-electron/electron/preload.js');
  operator=new BrowserWindow({show:false,width:1280,height:940,useContentSize:true,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});operator.webContents.setAudioMuted(true);
  operator.webContents.on('console-message',e=>{if(e.level==='error')console.error('RENDERER',e.message)});
  manager=new OutputWindowManager(preload,async(window)=>{window.showInactive=()=>{};window.webContents.setAudioMuted(true);await window.loadURL(base+'/tests/smoke/v97-ui.html#output')},()=>{});
  ipcMain.handle('spelling:set-language',()=>true);ipcMain.handle('device:get',()=>null);ipcMain.handle('powerpoint:receiver-boot',()=>null);
  ipcMain.handle('local-slides:status',()=>({state:'ready',downloadedBytes:1,totalBytes:1,busy:false}));
  ipcMain.handle('local-slides:generate',(_event,request)=>{assert.equal(request.count,3);return realDrafts});ipcMain.handle('local-slides:cancel',()=>{});
  ipcMain.handle('outputs:get-state',event=>manager.getStateForSender(event.sender.id));ipcMain.handle('outputs:paint-report',(event,value)=>manager.acceptPaintReceipt(event.sender.id,value));
  ipcMain.handle('outputs:preview-paint-report',(event,value)=>event.sender.id===operator.webContents.id&&manager.acceptPreviewReceipt(value));ipcMain.handle('outputs:timings',()=>manager.getTimings());
  await operator.loadURL(base+'/tests/smoke/v97-ui.html');
  await until(()=>operator.webContents.executeJavaScript('!!document.querySelector(".local-slide-dialog input")'),'dialog');
  const before=await operator.webContents.executeJavaScript('v97.state().items.length');
  await operator.webContents.executeJavaScript(`(()=>{const input=document.querySelector('.local-slide-inputs input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Dankbarkeit im Alltag');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await operator.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Folien erstellen').click()`);
  await until(()=>operator.webContents.executeJavaScript('document.querySelectorAll(".local-slide-preview").length===3'),'three real model previews');
  assert.equal(await operator.webContents.executeJavaScript('v97.state().items.length'),before);
  await operator.webContents.executeJavaScript('document.fonts.ready');
  for(const theme of ['dark','light']){
   const contrast=await operator.webContents.executeJavaScript(`(async()=>{document.documentElement.dataset.theme='${theme}';document.querySelector('.local-slide-dialog').scrollTop=500;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const style=getComputedStyle(document.querySelector('.local-slide-dialog'));const luminance=c=>{const v=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)})()`);
   assert(contrast>=4.5,'operator contrast '+theme+' '+contrast);
   fs.writeFileSync(path.join(folder,'drafts-'+theme+'.png'),(await operator.webContents.capturePage()).toPNG());
  }
  await operator.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='In den Ablauf übernehmen').click()`);
  await until(()=>operator.webContents.executeJavaScript('!document.querySelector(".local-slide-dialog")'),'accepted');
  const inserted=await operator.webContents.executeJavaScript('v97.state()');assert.equal(inserted.items.length,before+1);assert.equal(inserted.history,1);
  const generated=inserted.items.find(item=>item.metadata.aiGenerated);assert.equal(generated.slides.length,3);
  await operator.webContents.executeJavaScript('v97.undo()');assert.equal(await operator.webContents.executeJavaScript('v97.state().items.length'),before);
  assert((await operator.webContents.executeJavaScript('v97.startup()'))<1000);
  const audio=await operator.webContents.executeJavaScript('v97.audio()',true);assert(audio.level>.01);assert.equal(audio.after,0);
  const comparisons=[];
  const area=screen.getPrimaryDisplay().workArea,half=Math.floor(area.width/2);
  operator.setBounds({x:area.x,y:area.y,width:half,height:Math.min(940,area.height)});operator.showInactive();
  for(let index=1;index<=3;index++){
   const slide={...generated.slides[index-1],_outputRevision:index,_presentAtMs:Date.now()+120};
   if(index===1){await manager.start({[screen.getPrimaryDisplay().id]:'main'},slide);const output=manager.getNativeCompositionWindows()[0].window;output.setFullScreen(false);output.setBounds({x:area.x+half,y:area.y,width:half,height:Math.min(540,area.height)});output.show()}else manager.send(slide);
   await operator.webContents.executeJavaScript('v97.preview('+JSON.stringify(slide)+')');
   await until(()=>Number.isFinite(manager.getTimings()[0]?.previewDeltaMs),'matching main/preview acknowledgements');
   const timing=manager.getTimings()[0];assert(Math.abs(timing.previewDeltaMs)<500,JSON.stringify(timing));comparisons.push(timing);
  }
  const controller=new AbortController(),cancelled=runSlideWorker(path.join(root,'work/v97-model-quality'),{topic:'Owned cancellation probe',notes:'',count:1},controller.signal);
  const outcome=cancelled.then(()=>false,()=>true);await sleep(500);controller.abort();assert(await outcome);
  fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({realModelOutputPreviewed:true,draftPages:3,explicitAcceptance:true,singleUndo:true,optionalStartupDoesNotBlock:true,audio,physicalPlayback:false,comparisons,workerCancellation:true},null,2));
  console.log('V97_NATIVE_PASS '+folder);await manager.stop();operator.destroy();app.exit(0);
 }catch(error){console.error(error);await manager?.stop();operator?.destroy();app.exit(1)}
});
