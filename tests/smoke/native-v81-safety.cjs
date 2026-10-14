const {app,BrowserWindow}=require('electron'),assert=require('assert'),path=require('path');
app.setPath('userData',path.resolve(__dirname,'../../work/native-v81-safety/profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
setTimeout(()=>app.exit(1),45000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1920,height:1080,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',e=>{if(e.level==='error')console.error(e.message)});
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/native-v78.html');
 for(let i=0;i<150&&!await win.webContents.executeJavaScript('!!window.v78');i++)await sleep(100);
 const result=await win.webContents.executeJavaScript('window.v78.safetyChecks()');
 assert.deepEqual(result.fonts,{bundled:true,missing:false});assert(result.media.ready>=1);assert.equal(result.media.paused,true);assert.equal(result.media.time,0);assert.equal(result.media.muted,true);assert.equal(result.media.volume,0);assert.equal(result.media.autoplay,false);assert.equal(result.released,true);
 console.log('PASS native v81 safety: real bundled/missing font detection, actual WAV metadata ready without playback, muted/zero volume and resource release.');app.exit(0);
 }catch(error){console.error(error);app.exit(1)}});
