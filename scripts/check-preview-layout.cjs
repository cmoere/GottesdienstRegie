const {app,BrowserWindow}=require('electron'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 try{
  await win.loadURL('http://127.0.0.1:5178/scripts/preview-layout-test.html');
  const evaluate=code=>win.webContents.executeJavaScript(code);
  await evaluate(`new Promise((resolve,reject)=>{const timer=setInterval(()=>{if(document.querySelector('.production-single')){clearInterval(timer);resolve()}},30);setTimeout(()=>reject(Error('Preview not mounted')),10000)})`);
  const settled=()=>evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const measure=()=>evaluate(`(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};return {height:innerHeight,main:box('.main'),timeline:box('.production-timeline'),status:box('.status'),rows:getComputedStyle(document.querySelector('.app')).gridTemplateRows}})()`);
  const assertLayout=(layout,label)=>{
   console.log(label,JSON.stringify(layout));
   assert.ok(Math.abs(layout.status.bottom-layout.height)<2,label+': status must be anchored to bottom');
   assert.ok(Math.abs(layout.main.bottom-layout.timeline.top)<2,label+': no gap or overlap between workspace and timeline');
   assert.ok(Math.abs(layout.timeline.bottom-layout.status.top)<2,label+': timeline must sit directly above status');
   assert.ok(layout.main.height>layout.height/2,label+': preview must receive the available working space');
  };
  for(const size of [[1920,1080],[1366,768]]){
   win.setContentSize(...size);
   for(const mode of ['single','grid']){
    await evaluate(`window.previewLayoutState().setPreviewLayout('${mode}')`);await settled();
    assertLayout(await measure(),size.join('x')+' '+mode);
   }
  }
  await evaluate("document.querySelector('.timeline-toggle').click()");await settled();
  assert.equal(await evaluate("document.querySelector('.production-timeline').classList.contains('expanded')"),true);
  assertLayout(await measure(),'expanded timeline');
  await evaluate("window.previewLayoutState().setMode('edit')");await settled();assertLayout(await measure(),'edit mode');
  await evaluate("document.querySelector('.timeline-toggle').click();window.previewLayoutState().setMode('preview');window.previewLayoutState().setPreviewLayout('single')");win.setContentSize(1920,1080);await settled();
  await evaluate('document.fonts.ready');await settled();
  fs.writeFileSync(path.join(app.getPath('temp'),'gottesdienstregie-preview-layout-fixed.png'),(await win.webContents.capturePage()).toPNG());
  console.log('PASS: single/grid preview, responsive height, timeline expansion and edit mode');
  win.destroy();app.exit(0);
 }catch(error){console.error(error);win.destroy();app.exit(1)}
});
