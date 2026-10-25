const {app,BrowserWindow,ipcMain,session}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),folder=process.env.V90_PROBE_FOLDER;assert(folder&&path.resolve(folder).startsWith(path.join(root,'work')+path.sep));
app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('mute-audio');
const windows=[];let shown=0,manager;
function localSource(name){const filename=path.join(root,name),m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);return m.exports}
const {startLiveSession}=localSource('src/liveSession.ts'),{captureLiveStartGuard}=localSource('src/liveStartGuard.ts');
const display={id:2,label:'Isolated virtual MAIN',bounds:{x:0,y:0,width:1280,height:720}};
class HiddenOutput extends BrowserWindow{
 constructor(){super({width:1280,height:720,show:false,frame:false,webPreferences:{preload:path.join(root,'dist-electron/electron/preload.js'),offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false}});windows.push(this);this.webContents.on('paint',()=>{});this.webContents.setFrameRate(15)}
 showInactive(){shown++}setFullScreen(){}
}
const filename=path.join(root,'dist-electron/electron/OutputWindowManager.js'),m=new Module(filename,module);m.filename=filename;m.paths=module.paths;
const realRequire=Module.createRequire(filename);m.require=name=>name==='electron'?{BrowserWindow:HiddenOutput,screen:{getAllDisplays:()=>[display]}}:realRequire(name);m._compile(fs.readFileSync(filename,'utf8'),filename);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(window,expression){const until=Date.now()+30000;while(!await window.webContents.executeJavaScript(expression)){assert(Date.now()<until,expression);await sleep(80)}}
app.whenReady().then(async()=>{try{
 session.defaultSession.webRequest.onBeforeRequest((request,done)=>done({cancel:/^https?:/.test(request.url)}));
 for(const match of fs.readFileSync(path.join(root,'electron/preload.ts'),'utf8').matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g)){try{ipcMain.handle(match[1],event=>match[1]==='outputs:get-state'?manager.getStateForSender(event.sender.id):null)}catch{}}
 manager=new m.exports.OutputWindowManager('',(window,route)=>window.loadFile(path.join(root,'dist/index.html'),{hash:route.replace(/^#/,'')}),()=>{});
 const slide={id:'native-slide',itemId:'native-item',title:'v90 native output',body:'v90 native output',order:0,enabled:true,background:'#000000',elements:[{id:'text',type:'text',name:'Text',x:100,y:100,width:1700,height:700,rotation:0,opacity:1,locked:false,visible:true,zIndex:0,properties:{text:'v90 native output',fontSize:72,color:'#ffffff',fontFamily:'Cera Pro'}}],transition:'none',transitionDuration:0,notes:''};
 const baseline={presentationId:'isolated',items:[{id:'native-item',slides:[slide]}],sections:[{id:'service',order:0}],eventLink:{eventKey:'isolated-event'},displayRoles:{'2':'main'},onAir:false,date:'2026-10-24',serviceTime:'10:30'};
 const results=[];let bannerGeometry=null;
 for(const mode of ['test','live']){
  let current=structuredClone(baseline),confirmations=0;const guard=captureLiveStartGuard(current);manager.setAppMode({mode:mode==='test'?'test':'normal',onAir:true});
  const result=await startLiveSession({mode,permitted:true,desktopAvailable:true,eventKey:baseline.eventLink.eventKey,assignments:baseline.displayRoles},{preflight:async()=>{current=structuredClone(current);return{ok:true,errors:[],warnings:['Isolated output test']}},displays:async()=>[display],confirm:()=>{confirmations++;return true},isCurrent:()=>guard(current,true),start:assignments=>manager.start(assignments,slide)});
  assert.equal(result.started,true);assert.equal(confirmations,1);const window=windows.at(-1);await wait(window,"document.querySelector('.output')?.textContent.includes('v90 native output')");
  assert.equal(await window.webContents.executeJavaScript("document.querySelector('[data-output-mode]')?.dataset.outputMode"),mode==='test'?'test':'normal');assert.equal(window.isVisible(),false);
  await window.webContents.executeJavaScript('document.fonts.ready');window.webContents.invalidate();await sleep(500);
  fs.writeFileSync(path.join(folder,mode+'.png'),(await window.webContents.capturePage()).toPNG());results.push({mode,started:true,confirmation:true,outputRendered:true,physicallyVisible:false});
  if(mode==='test'){
   const items=[{id:'one',text:'PGB: Gottesdienst - Keine Audio- und Videoübertragung am 25.10. in den Eltern-Kind-Raum',priority:'normal'},{id:'two',text:'Konzertveranstaltung · Herzliche Einladung',priority:'normal'}],ribbon=items.map(item=>item.text).join('                ·                ')+'                ·                ';
   await window.webContents.executeJavaScript('document.fonts.load(\'700 44px "Cera Pro"\')');
   const rawWidth=await window.webContents.executeJavaScript(`(()=>{const ctx=document.createElement('canvas').getContext('2d');ctx.font='700 44px "Cera Pro", system-ui';ctx.letterSpacing='-0.44px';return ctx.measureText(${JSON.stringify(ribbon)}).width})()`);
   manager.setBanner({revision:99,position:'top',items,cycleStartedAtMs:Date.now(),reserved:true,textWidth:rawWidth});await wait(window,"document.querySelector('.announcement-banner')?.dataset.condensed==='true'");await sleep(200);
   bannerGeometry=await window.webContents.executeJavaScript("(()=>{const unit=document.querySelector('[data-banner-unit]'),text=document.querySelector('[data-banner-text]'),style=getComputedStyle(text);return{unitWidth:unit.getBoundingClientRect().width,textWidth:text.getBoundingClientRect().width,height:text.getBoundingClientRect().height,fontSize:parseFloat(style.fontSize),weight:style.fontWeight,transform:style.transform,color:style.color}})()");
   assert(Math.abs(bannerGeometry.unitWidth-rawWidth*.72*1280/1920)<2);assert(Math.abs(bannerGeometry.unitWidth-bannerGeometry.textWidth)<3,JSON.stringify({rawWidth,...bannerGeometry}));assert.equal(bannerGeometry.weight,'700');assert(bannerGeometry.transform.startsWith('matrix(0.72, 0, 0, 1,'));
   fs.writeFileSync(path.join(folder,'condensed-banner.png'),(await window.webContents.capturePage()).toPNG());
  }
  window.webContents.stopPainting();window.webContents.removeAllListeners('paint');await window.loadURL('about:blank');await manager.stop();
 }
 const guard=captureLiveStartGuard(baseline),changed=structuredClone(baseline);changed.items[0].slides[0].body='Actual edit';assert.equal(guard(changed,true),false);
 const report={results,bannerGeometry,shownRequests:shown,actualEditBlocked:true,physicalAudioMuted:true,networkBlocked:true};fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.quit();
 }catch(error){console.error(error);for(const window of windows)if(!window.isDestroyed())window.destroy();app.exit(1)}});
