// Isolated hidden pixel verification; never operates the installed app.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const folder=process.env.EXTERNAL_PROBE_FOLDER,url=process.env.EXTERNAL_PROBE_URL;
assert(folder&&fs.existsSync(path.join(folder,'.probe-owned'))&&url?.startsWith('http://127.0.0.1:'));
app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let win;
const deadline=setTimeout(()=>app.exit(2),150000);
app.whenReady().then(async()=>{try{
 win=new BrowserWindow({show:false,frame:false,width:1920,height:1080,useContentSize:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 await win.loadURL(url);
 for(let i=0;i<100&&!await win.webContents.executeJavaScript('!!window.externalFixture');i++)await sleep(50);
 const results=[];
 for(const mode of ['news','news-second','news-long','news-reduced','weather','matchday','upcoming','table']){
  await win.webContents.executeJavaScript('window.externalFixture.mode('+JSON.stringify(mode)+')');await sleep(100);
  await win.webContents.executeJavaScript("(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)})()");
  const result=await win.webContents.executeJavaScript(`(()=>{const frame=document.querySelector('.external-loop-frame'),footer=frame.querySelector('footer'),logos=[...frame.querySelectorAll('img')];return {mode:${JSON.stringify(mode)},width:frame.getBoundingClientRect().width,footerBottom:footer.getBoundingClientRect().bottom,bodyBottom:frame.querySelector('.external-loop-body,.weather-forecast').getBoundingClientRect().bottom,logos:logos.map(img=>img.complete&&img.naturalWidth>0),rows:frame.querySelectorAll('[role=row]').length,watermark:!!document.querySelector('.test-mode-watermark'),font:getComputedStyle(frame).fontFamily}})()`);
  assert.equal(result.width,1920);assert(result.footerBottom<=1080);assert(result.bodyBottom<=1080);assert(result.watermark);assert(result.font.includes('Cera Pro'));assert(result.logos.every(Boolean));if(mode==='table')assert.equal(result.rows,25);
  if(mode.startsWith('news')){
   assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('article').length"),1);
   const bounds=await win.webContents.executeJavaScript("[...document.querySelectorAll('.external-source-logos img')].map(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}))");assert.equal(bounds.length,1);assert(bounds.every(box=>box.width>=100&&box.height>=20),'Current source logo must occupy readable space');
   if(mode==='news-second'){assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('.news-story figure').length"),0);assert.equal(await win.webContents.executeJavaScript("document.querySelector('.news-story')?.getAttribute('aria-label')"),'Weitere Nachrichten aus OWL')}
   if(mode==='news')assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('.news-story figure img').length"),1);
   assert(await win.webContents.executeJavaScript("[...document.querySelectorAll('.news-story-title,.news-story-body')].every(node=>node.scrollWidth<=node.clientWidth+2)"),'Prepared story lines must not clip horizontally');
  }
  if(mode==='weather'){assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('.weather-hours article').length"),6);assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('.weather-tomorrow').length"),1);assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('iframe').length"),0)}
  if(['matchday','upcoming','table'].includes(mode))assert(await win.webContents.executeJavaScript("document.querySelectorAll('.football-club-logo').length>0"),'Prepared club logos must render');
  const image=await win.webContents.capturePage();assert.deepEqual(image.getSize(),{width:1920,height:1080});fs.writeFileSync(path.join(folder,mode+'.png'),image.toPNG());results.push(result);
  if(mode==='news'||mode==='news-second'){
   const box=await win.webContents.executeJavaScript("(()=>{const r=document.querySelector('.external-source-logos img').getBoundingClientRect();return {x:Math.ceil(r.x),y:Math.ceil(r.y),width:Math.floor(r.width),height:Math.floor(r.height)}})()");
   const pixels=image.crop(box).toBitmap();let contrast=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<80&&pixels[i+1]<80&&pixels[i+2]<80)contrast++;assert(contrast>100,'Current source logo must be painted with readable contrast');
  }
 }
 for(const design of ['classic','light','accent','split','green','silver','frame','footer']){
  await win.webContents.executeJavaScript('window.externalFixture.mode('+JSON.stringify('announcement-'+design)+')');await sleep(100);
  await win.webContents.executeJavaScript("(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)})()");
  assert(await win.webContents.executeJavaScript("document.body.textContent.includes('Aktuelle Infos')&&document.body.textContent.replace(/\\s/g,'').includes('WichtigeInformationfürunsereGemeinde')"));
  const image=await win.webContents.capturePage();fs.writeFileSync(path.join(folder,'announcement-'+design+'.png'),image.toPNG());
  const pixels=image.crop({x:112,y:42,width:550,height:80}).toBitmap();let white=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>220&&pixels[i+1]>220&&pixels[i+2]>220)white++;assert(white>100,'Info label must paint above its green badge');
 }
 for(const mode of ['warning','warning-black']){
  await win.webContents.executeJavaScript('window.externalFixture.mode('+JSON.stringify(mode)+')');await sleep(300);
  const state=await win.webContents.executeJavaScript("(()=>{const node=document.querySelector('#warning-content'),r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,warning:!!document.querySelector('.weather-warning-banner'),source:document.querySelector('.weather-warning-banner footer')?.textContent,watermark:!!document.querySelector('.test-mode-watermark')}})()");
  assert.equal(state.warning,mode==='warning');assert(state.watermark);assert(state.bottom<=1080);
  if(mode==='warning'){assert(state.top>=280);assert.equal(state.source,'Quelle: Deutscher Wetterdienst')}else assert.equal(state.top,0);
  fs.writeFileSync(path.join(folder,mode+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 await win.webContents.executeJavaScript("window.externalFixture.mode('screen-report')");await sleep(300);
 assert(await win.webContents.executeJavaScript("document.querySelector('iframe').contentDocument.body.textContent.includes('keine physische Bild-')"));
 fs.writeFileSync(path.join(folder,'screen-report.png'),(await win.webContents.capturePage()).toPNG());
 // Hidden ordinary windows stop continuous RAF. An isolated offscreen surface
 // supplies real compositor frames without exposing test images on a monitor.
 const canvasWin=new BrowserWindow({show:false,frame:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 let screenTest;const screenTestStart=Date.now();
 try{
  canvasWin.webContents.on('paint',()=>{});canvasWin.webContents.setFrameRate(60);await canvasWin.loadURL(url);
  for(let i=0;i<100&&!await canvasWin.webContents.executeJavaScript('!!window.externalFixture');i++)await sleep(50);
  await canvasWin.webContents.executeJavaScript("window.externalFixture.mode('screen-test-live')");
  while(Date.now()-screenTestStart<65000){screenTest=await canvasWin.webContents.executeJavaScript('window.screenTestProbe');if(screenTest)break;await sleep(300)}
  assert(screenTest,'Eight actual five-second canvas receipts must complete: '+JSON.stringify(await canvasWin.webContents.executeJavaScript('window.screenTestProgress')));
 }finally{canvasWin.webContents.stopPainting();canvasWin.webContents.removeAllListeners('paint');await canvasWin.loadURL('about:blank');await sleep(300);canvasWin.close()}
 assert.equal(screenTest.receipts.length,8);assert(Date.now()-screenTestStart>=40000);
 assert(screenTest.receipts.every(row=>row.ok&&row.elapsedMs>=5000&&row.width===1920&&row.height===1080));
 for(const [name,text]of Object.entries(screenTest.reports))fs.writeFileSync(path.join(folder,'screen-test-'+name+(name==='json'?'.json':'.html')),text);
 assert(screenTest.reports.error.includes('&lt;script&gt;'));assert(!screenTest.reports.error.includes('<script>'));
 for(const design of ['digital-classic','digital-compact','digital-seconds','analog-light','analog-dark','analog-digital']){
  await win.webContents.executeJavaScript('window.externalFixture.mode('+JSON.stringify(design)+')');await sleep(100);
  assert.equal(await win.webContents.executeJavaScript("document.querySelector('[data-clock-design]')?.getAttribute('data-clock-design')"),design);
  await win.webContents.executeJavaScript("(async()=>{await document.fonts.ready;for(let i=0;i<2;i++)await new Promise(requestAnimationFrame)})()");
  fs.writeFileSync(path.join(folder,design+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 await win.webContents.executeJavaScript("window.externalFixture.mode('technical')");await sleep(100);
 assert.equal(await win.webContents.executeJavaScript("document.querySelector('h1')?.textContent"),'Technical difficulties');
 assert(await win.webContents.executeJavaScript("!!document.querySelector('.technical-issue-mark svg')&&!!document.querySelector('.test-mode-watermark')"));
 fs.writeFileSync(path.join(folder,'technical-en.png'),(await win.webContents.capturePage()).toPNG());
 const mirror=new BrowserWindow({show:false,frame:false,width:1920,height:1080,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 try{await mirror.loadURL(url+'#technical');for(let i=0;i<100&&!await mirror.webContents.executeJavaScript('!!window.externalFixture');i++)await sleep(50);assert.equal(await mirror.webContents.executeJavaScript("document.querySelector('h1')?.textContent"),'Technical difficulties')}finally{mirror.destroy()}
 await win.webContents.executeJavaScript("window.externalFixture.mode('boundary')");await sleep(200);
 assert(await win.webContents.executeJavaScript("!!window.externalBoundary"),'Actual controller/renderer boundary fixture must be prepared');
 await win.webContents.executeJavaScript("(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)})()");
 const first=await win.webContents.executeJavaScript("window.externalBoundary.frame()");
 assert.equal(await win.webContents.executeJavaScript("document.querySelector('.external-loop-frame').getBoundingClientRect().height"),1080);
 fs.writeFileSync(path.join(folder,'frozen-first.png'),(await win.webContents.capturePage()).toPNG());
 const firstPixels=(await win.webContents.capturePage()).crop({x:60,y:210,width:1500,height:100}).toPNG();
 await win.webContents.executeJavaScript("window.externalBoundary.pending()");await sleep(100);
 assert.deepEqual(await win.webContents.executeJavaScript("window.externalBoundary.frame()"),first,'Pending refresh must not mutate visible pixels/envelope');
 assert.deepEqual((await win.webContents.capturePage()).crop({x:60,y:210,width:1500,height:100}).toPNG(),firstPixels,'Visible title pixels must remain stable during pending refresh');
 await win.webContents.executeJavaScript("window.externalBoundary.take()");await sleep(100);
 await win.webContents.executeJavaScript("(async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)})()");
 const next=await win.webContents.executeJavaScript("window.externalBoundary.frame()");
 assert.notEqual(next.revision,first.revision);assert.equal(next.epoch,first.epoch+1000);
 assert.equal(next.revision,'Nächste Revision');
 fs.writeFileSync(path.join(folder,'frozen-next.png'),(await win.webContents.capturePage()).toPNG());
 assert.notDeepEqual((await win.webContents.capturePage()).crop({x:60,y:210,width:1500,height:100}).toPNG(),firstPixels,'New take must repaint the changed title');
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({electron:process.versions.electron,results,clockDesigns:6,technicalLateMirror:'en',frozenTake:{first,next},physicalDisplayVerified:false},null,2));
 console.log('EXTERNAL_LOOP_NATIVE_PASS '+folder);win.destroy();clearTimeout(deadline);app.exit(0);
}catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();clearTimeout(deadline);app.exit(1)}});
