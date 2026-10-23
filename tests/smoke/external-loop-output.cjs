// Isolated hidden pixel verification; never operates the installed app.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const folder=process.env.EXTERNAL_PROBE_FOLDER,url=process.env.EXTERNAL_PROBE_URL;
assert(folder&&fs.existsSync(path.join(folder,'.probe-owned'))&&url?.startsWith('http://127.0.0.1:'));
app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let win;
const deadline=setTimeout(()=>app.exit(2),60000);
app.whenReady().then(async()=>{try{
 win=new BrowserWindow({show:false,frame:false,width:1920,height:1080,useContentSize:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 await win.loadURL(url);
 for(let i=0;i<100&&!await win.webContents.executeJavaScript('!!window.externalFixture');i++)await sleep(50);
 const results=[];
 for(const mode of ['news','matchday','upcoming','table']){
  await win.webContents.executeJavaScript('window.externalFixture.mode('+JSON.stringify(mode)+')');await sleep(100);
  await win.webContents.executeJavaScript("(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)})()");
  const result=await win.webContents.executeJavaScript(`(()=>{const frame=document.querySelector('.external-loop-frame'),footer=frame.querySelector('footer'),logos=[...frame.querySelectorAll('img')];return {mode:${JSON.stringify(mode)},width:frame.getBoundingClientRect().width,footerBottom:footer.getBoundingClientRect().bottom,bodyBottom:frame.querySelector('.external-loop-body').getBoundingClientRect().bottom,logos:logos.map(img=>img.complete&&img.naturalWidth>0),rows:frame.querySelectorAll('[role=row]').length,watermark:!!document.querySelector('.test-mode-watermark'),font:getComputedStyle(frame).fontFamily}})()`);
  assert.equal(result.width,1920);assert(result.footerBottom<=1080);assert(result.bodyBottom<=1080);assert(result.watermark);assert(result.font.includes('Cera Pro'));assert(result.logos.every(Boolean));if(mode==='table')assert.equal(result.rows,25);
  if(mode==='news'){const bounds=await win.webContents.executeJavaScript("[...document.querySelectorAll('.external-source-logos img')].map(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}))");console.log('LOGO_BOUNDS',JSON.stringify(bounds));assert(bounds.every(box=>box.width>=100&&box.height>=20),'Source logos must occupy readable space');}
  const image=await win.webContents.capturePage();assert.deepEqual(image.getSize(),{width:1920,height:1080});fs.writeFileSync(path.join(folder,mode+'.png'),image.toPNG());results.push(result);
  if(mode==='news')for(const x of [1272,1582]){const pixels=image.crop({x,y:76,width:274,height:64}).toBitmap();let contrast=0;for(let i=0;i<pixels.length;i+=4)if(x===1272?pixels[i]<80&&pixels[i+1]<80&&pixels[i+2]<80:pixels[i]>220&&pixels[i+1]>220&&pixels[i+2]>220)contrast++;assert(contrast>100,'Original source logos must be painted with readable contrast, not only loaded');}
 }
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({electron:process.versions.electron,results,physicalDisplayVerified:false},null,2));
 console.log('EXTERNAL_LOOP_NATIVE_PASS '+folder);win.destroy();clearTimeout(deadline);app.exit(0);
}catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();clearTimeout(deadline);app.exit(1)}});
