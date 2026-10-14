const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../../work/native-v82');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deadline=setTimeout(()=>{console.error('Native v82 timeout');app.exit(1)},180000);deadline.unref();
app.whenReady().then(async()=>{try{
  const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}}),js=code=>win.webContents.executeJavaScript(code);
  win.webContents.on('console-message',event=>{if(event.level==='error')console.error(event.message)});
  await win.loadURL('http://127.0.0.1:5173/tests/smoke/native-v82.html');
  for(let i=0;i<200&&!await js('!!window.v82');i++)await sleep(100);
  assert(await js('!!window.v82'),'native fixture initialized');
  assert.deepEqual(await js('window.v82.flow()'),{sameAnchor:true,service:false,black:false,countdown:true});
  for(const design of ['clear','nature','light','cross','candle','geometric']){
    await js(`window.v82.show('${design}')`);
    const layout=await js(`(()=>{const fit=document.querySelector('.output-content-fit').getBoundingClientRect(),band=document.querySelector('.output-banner-layer').getBoundingClientRect(),text=document.querySelector('.announcement-banner');return {width:fit.width,height:fit.height,bottom:fit.bottom,bandTop:band.top,bandHeight:band.height,color:getComputedStyle(text).color,timer:document.querySelector('.countdown-copy strong').textContent,watermark:!!document.querySelector('.test-mode-watermark')}})()`);
    assert(Math.abs(layout.width/layout.height-16/9)<.001,JSON.stringify(layout));assert(layout.bottom<=layout.bandTop+.1,JSON.stringify(layout));assert(Math.abs(layout.bandHeight-84)<1,JSON.stringify(layout));assert.equal(layout.color,'rgb(166, 83, 83)');assert.equal(layout.timer,'04:35');assert(layout.watermark);
    fs.writeFileSync(path.join(out,`countdown-${design}.png`),(await win.webContents.capturePage()).toPNG());
  }
  await js(`window.v82.show('clear','top',false)`);assert.equal(await js('!!document.querySelector(".test-mode-watermark")'),false);
  const top=await js(`(()=>{const fit=document.querySelector('.output-content-fit').getBoundingClientRect(),band=document.querySelector('.output-banner-layer').getBoundingClientRect();return {fit:fit.top,band:band.bottom}})()`);assert(top.fit>=top.band-.1);
  await js(`window.v82.show('clear','bottom',true,true)`);assert.equal(await js('window.v82.update()'),true,'banner update preserved website iframe');
  fs.writeFileSync(path.join(out,'website-top.png'),(await win.webContents.capturePage()).toPNG());
  clearTimeout(deadline);console.log('NATIVE_V82_COMPOSITION_PASS: six countdown designs, shared clock, proportional top/bottom banner, overlay over website, unchanged iframe identity, test/normal watermark.');app.exit(0);
}catch(error){console.error(error);app.exit(1)}});
