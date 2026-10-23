const{app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const folder=process.env.V88_PROBE_FOLDER,url=process.env.V88_PROBE_URL;assert(folder&&url?.startsWith('http://127.0.0.1:'));app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const windows=[];
const finish=code=>{for(const w of windows)if(!w.isDestroyed()){w.webContents.stopPainting();w.webContents.removeAllListeners('paint')}setTimeout(()=>{for(const w of windows)if(!w.isDestroyed())w.destroy();app.exit(code)},150)};
app.whenReady().then(async()=>{try{
 for(let i=0;i<2;i++){const w=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{backgroundThrottling:false,offscreen:true}});windows.push(w);w.webContents.on('paint',()=>{});w.webContents.setFrameRate(60);await w.loadURL(url);for(let n=0;n<100&&!await w.webContents.executeJavaScript('!!window.transitionProbe');n++)await sleep(30)}
 await sleep(200);const at=Date.now();await windows[0].webContents.executeJavaScript(`window.transitionProbe.take(${at})`);await sleep(1000);await windows[1].webContents.executeJavaScript(`window.transitionProbe.take(${at})`);await sleep(500);
 const details=await Promise.all(windows.map(w=>w.webContents.executeJavaScript(`(()=>{const s=document.querySelector('.transition-stage'),e=s.querySelector('.entering');return{classes:s.className,opacity:getComputedStyle(e).opacity,transition:getComputedStyle(e).transition,animation:s.getAnimations({subtree:true}).map(a=>a.currentTime)}})()`)));
 const opacity=details.map(d=>Number(d.opacity)),phaseSkewMs=Math.abs(opacity[0]-opacity[1])*2000;const report={details,phaseSkewMs,elapsedMs:Date.now()-at};fs.writeFileSync(path.join(folder,'timing.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert(phaseSkewMs<=100&&opacity.every(v=>v>.1&&v<.98),'Late mirror must join current transition phase, not restart a full fade');
 finish(0);
 }catch(e){console.error(e);finish(1)}});
