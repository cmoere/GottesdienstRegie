// Uses Chromium's actual layout/paint stack and the production stylesheets.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 let window;
 try{
  window=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
  const css=['styles.css','v010.css','preview-workspace.css','version57.css','version75.css'].map(file=>fs.readFileSync(path.join(__dirname,'../../src',file),'utf8')).join('\n');
  await window.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(`<style>${css}</style><div class="main-preview-surface" style="width:640px;height:360px"><div class="test-mode-watermark">TESTBETRIEB</div></div><section class="live-slide-panel" style="width:260px"><div><div class="test-mode-watermark">TESTBETRIEB</div></div></section><div id="help" style="position:fixed;inset:0;z-index:1000;background:white">Help</div>`));
  const result=await window.webContents.executeJavaScript(`(()=>{
   const surfaces=[document.querySelector('.main-preview-surface'),document.querySelector('.live-slide-panel>div')];
   return surfaces.map(surface=>{
    const watermark=surface.querySelector('.test-mode-watermark');watermark.style.pointerEvents='auto';
    const rect=watermark.getBoundingClientRect(),box=surface.getBoundingClientRect(),style=getComputedStyle(surface);
    return {top:document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)?.id,font:parseFloat(getComputedStyle(watermark).fontSize),ratio:box.width/box.height,border:parseFloat(style.borderTopWidth),clipped:['hidden','clip'].includes(style.overflow)};
   });
  })()`);
  for(const surface of result){assert.equal(surface.top,'help','Preview watermark must stay beneath Help');assert(surface.clipped,'Preview must clip its output');assert(Math.abs(surface.ratio-16/9)<.01,'Preview must remain 16:9');}
  assert.equal(result[1].border,0,'MAIN preview must have no red border');
  assert(result[1].font<result[0].font*.6,'Watermark must scale with preview size');
  console.log('PASS native preview layering, clipping, proportional watermark, 16:9 and border');
  app.exit(0);
 }catch(error){console.error(error);app.exit(1)}
});
