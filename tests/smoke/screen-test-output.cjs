// Owned hidden fixture only: no installed app, real display assignments or audio.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const folder=process.env.SCREEN_TEST_PROBE_FOLDER,url=process.env.SCREEN_TEST_PROBE_URL;
assert(folder&&fs.existsSync(path.join(folder,'.probe-owned'))&&url?.startsWith('http://127.0.0.1:'));
app.setPath('userData',path.join(folder,'profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deadline=setTimeout(()=>app.exit(2),150000);let win;
app.whenReady().then(async()=>{try{
 win=new BrowserWindow({show:false,frame:false,width:1920,height:1080,useContentSize:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.webContents.on('console-message',event=>console.log('Fixture renderer:',event.message));
 await win.loadURL(url);
 for(let n=0;n<100&&!await win.webContents.executeJavaScript('!!window.screenTestFixture');n++)await sleep(50);
 await win.webContents.executeJavaScript(`(()=>{window.fixtureFrames={count:0,first:0,last:0};const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>raf(at=>{const f=window.fixtureFrames;f.count++;f.first||=at;f.last=at;callback(at)})})()`);
 const patterns=['bars','grid','grayscale','white','black','red','green','blue'],results=[];
 for(const pattern of patterns){
  const runId='a'.repeat(32);await win.webContents.executeJavaScript(`window.screenTestFixture.pattern(${JSON.stringify(pattern)},${JSON.stringify(runId)})`);
  let result;
  // Hidden native fixture may deliver only one RAF/s. Keep the same >=12
  // renderer-frame criterion and allow the actual check to finish, not 3s.
  for(let n=0;n<300;n++){result=await win.webContents.executeJavaScript(`window.screenTestFixture.reports().find(r=>r.pattern===${JSON.stringify(pattern)})`);if(result)break;await sleep(50)}
  if(!result){const diagnostic=await win.webContents.executeJavaScript(`(()=>{const c=document.querySelector('canvas'),q=document.querySelector('.quick-overlay'),fit=document.querySelector('.output-content-fit');return {frames:window.fixtureFrames,now:performance.now(),visibility:document.visibilityState,canvas:c?.getBoundingClientRect().toJSON(),quick:q?.getBoundingClientRect().toJSON(),fit:fit?.getBoundingClientRect().toJSON(),html:document.body.innerHTML.slice(0,3000)}})()`);console.log('MISSING_RESULT',pattern,JSON.stringify(diagnostic));fs.writeFileSync(path.join(folder,'failure.png'),(await win.webContents.capturePage()).toPNG())}
  assert(result?.ok,JSON.stringify(result));assert(result.frames>=12&&result.elapsedMs>=1000);assert.equal(result.width,1920);assert.equal(result.height,1080);results.push(result);
  console.log('PATTERN_CHECKED',pattern,JSON.stringify(result));
  const image=await win.webContents.capturePage();assert.deepEqual(image.getSize(),{width:1920,height:1080});
  const expected={bars:[255,255,255,255],grid:[0,0,0,255],grayscale:[0,0,0,255],white:[255,255,255,255],black:[0,0,0,255],red:[0,0,255,255],green:[0,255,0,255],blue:[255,0,0,255]}[pattern];
  assert.deepEqual([...image.crop({x:120,y:500,width:1,height:1}).toBitmap()],expected,pattern+' composed BGRA');
  assert(await win.webContents.executeJavaScript("!!document.querySelector('.test-mode-watermark')"));
  fs.writeFileSync(path.join(folder,pattern+'.png'),image.toPNG());
 }
 await win.webContents.executeJavaScript('window.screenTestFixture.technical()');await sleep(100);
 const style=await win.webContents.executeJavaScript(`(()=>{const title=document.querySelector('.technical-issue-message h1'),text=document.querySelector('.technical-issue-message p'),box=text.getBoundingClientRect();return {title:title.textContent,weight:getComputedStyle(title).fontWeight,color:getComputedStyle(text).color,right:box.right,bottom:box.bottom}})()`);
 assert.equal(style.title,'Technische Störung');assert.equal(style.weight,'500');assert.equal(style.color,'rgb(182, 190, 195)');assert(style.right<=1920&&style.bottom<=1080);
 fs.writeFileSync(path.join(folder,'technical.png'),(await win.webContents.capturePage()).toPNG());
 for(const page of [0,1,0]){assert.equal(await win.webContents.executeJavaScript(`window.screenTestFixture.bible(${page})`),0);await sleep(100);const text=await win.webContents.executeJavaScript("document.querySelector('.bible-page').textContent");assert(text.includes(page===0?'Welt geliebt':'Sohn gesandt'));assert(text.includes((page+1)+' / 2'))}
 fs.writeFileSync(path.join(folder,'bible.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify({electron:process.versions.electron,results,technical:style,bibleDialogOpened:0,physicalDisplayVerified:false},null,2));
 console.log('SCREEN_TEST_NATIVE_PASS '+folder);win.destroy();clearTimeout(deadline);app.exit(0);
}catch(error){console.error(error);if(win&&!win.isDestroyed())win.destroy();clearTimeout(deadline);app.exit(1)}});
