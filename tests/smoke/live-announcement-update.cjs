const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../../work/live-announcement-native');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
setTimeout(()=>app.exit(1),60000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',(_event,_level,message)=>console.log('Renderer:',message));
 win.webContents.on('render-process-gone',(_event,details)=>console.log('Renderer gone:',details.reason));
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/live-announcement-update.html');
 console.log('Fixture loaded');
 for(let n=0;n<100&&!await win.webContents.executeJavaScript('!!window.liveAnnouncementUpdate');n++)await sleep(100);
 assert(await win.webContents.executeJavaScript('!!window.liveAnnouncementUpdate'));
 for(const design of ['classic','light','split','frame','footer'])for(const atEnd of [false,true]){
  console.log('Checking',design,atEnd);
  const plan=await win.webContents.executeJavaScript(`window.liveAnnouncementUpdate.notice('${design}',${atEnd})`);
  assert(plan.distance>0);assert(plan.duration>60);assert(plan.duration*1000>=plan.minimum);await sleep(150);
  const boxes=await win.webContents.executeJavaScript(`(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return {qr:box('.qr'),viewport:box('.announcement-scroll-viewport'),end:[...document.querySelectorAll('.event-scroll-content span')].find(e=>e.textContent.includes('ENDE DER MELDUNG'))?.getBoundingClientRect().bottom}})()`);
  console.log('Geometry',JSON.stringify(boxes));
  assert.equal(Math.round(boxes.qr.width),360);assert.equal(Math.round(boxes.qr.y),360);assert(boxes.viewport.y>=0&&boxes.viewport.bottom<=1049);
  if(atEnd)assert(boxes.end<=boxes.viewport.bottom+2,JSON.stringify(boxes));
  fs.writeFileSync(path.join(out,`${design}-${atEnd?'end':'start'}.png`),(await win.webContents.capturePage()).toPNG());
 }
 for(const phase of ['return','top']){
  const plan=await win.webContents.executeJavaScript(`window.liveAnnouncementUpdate.notice('classic','${phase}')`);await sleep(150);
  const offset=await win.webContents.executeJavaScript(`-new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.event-scroll-content')).transform).m42`);
  const expected=phase==='return'?plan.distance/2:0;
  assert(Math.abs(offset-expected)<8,`${phase} must use the shared round-trip clock: ${offset} vs ${expected}`);
 }
 for(const elapsed of [0,19399,19401,39000]){
  await win.webContents.executeJavaScript(`window.liveAnnouncementUpdate.banner(${elapsed})`);await sleep(80);
  const result=await win.webContents.executeJavaScript(`(()=>{const units=[...document.querySelectorAll('[data-banner-unit]')].map(e=>e.getBoundingClientRect());return {visible:units.filter(r=>r.right>0&&r.left<1920).length,weight:getComputedStyle(document.querySelector('.announcement-banner')).fontWeight,text:document.querySelector('[data-banner-unit]').textContent}})()`);
  assert(result.visible>=2);assert.equal(result.weight,'700');assert(result.text.includes(' · '));
  const seam=await win.webContents.executeJavaScript(`(()=>{const unit=document.querySelector('[data-banner-unit]'),range=document.createRange();range.selectNodeContents(unit);return unit.getBoundingClientRect().width-range.getBoundingClientRect().width})()`);
  assert(Math.abs(seam)<5,'Short ribbon text must not overlap the next repeated unit');
 }
 fs.writeFileSync(path.join(out,'banner.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript('window.liveAnnouncementUpdate.longBanner()');await sleep(250);
 const longGap=await win.webContents.executeJavaScript(`(()=>{const unit=document.querySelector('[data-banner-unit]'),range=document.createRange();range.selectNodeContents(unit);return unit.getBoundingClientRect().width-range.getBoundingClientRect().width})()`);
 console.log('Long ribbon repeat gap:',longGap);assert(Math.abs(longGap)<5,'Repeat seam must not add an asymmetric gap after the separator');
 await win.webContents.executeJavaScript('window.liveAnnouncementUpdate.reminder()');await sleep(150);
 const reminder=await win.webContents.executeJavaScript(`(()=>{const node=document.querySelector('.service-on-air-reminder');if(!node)return null;const r=node.getBoundingClientRect();return {text:node.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom}})()`);
 assert(reminder?.text.includes('ON AIR nicht vergessen')&&reminder.text.includes('19 Minuten'));
 assert(reminder.x>=0&&reminder.y>=0&&reminder.right<=1920&&reminder.bottom<=1080,'Operator reminder must fit inside the window');
 fs.writeFileSync(path.join(out,'operator-on-air-reminder.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript('window.liveAnnouncementUpdate.reminder(true)');await sleep(100);
 assert(await win.webContents.executeJavaScript("!document.querySelector('.service-on-air-reminder')"),'ON AIR must hide the operator reminder');
 await win.loadURL('http://127.0.0.1:5173/release-notes/index.html?lang=de#version-0.85.0');
 for(let n=0;n<100&&!await win.webContents.executeJavaScript('!!document.getElementById("version-0.85.0")');n++)await sleep(100);
 assert(await win.webContents.executeJavaScript('!!document.getElementById("version-0.85.0")'));
 const rss=await win.webContents.executeJavaScript(`(async()=>{const link=document.querySelector('a[href="feed.xml"]'),xml=await(await fetch(link.href)).text(),doc=new DOMParser().parseFromString(xml,'application/xml');return {link:link.textContent,discovered:!!document.querySelector('link[rel="alternate"][type="application/rss+xml"]'),valid:!doc.querySelector('parsererror'),latest:doc.querySelector('item title').textContent,items:doc.querySelectorAll('item').length}})()`);
 assert.equal(rss.link,'RSS');assert(rss.discovered&&rss.valid);assert.equal(rss.latest,'GottesdienstRegie 0.85.0');assert(rss.items>100);
 assert(await win.webContents.executeJavaScript('getComputedStyle(document.getElementById("empty")).display!=="block"'),'RSS deep links must not show a false empty-history error');
 fs.writeFileSync(path.join(out,'release-notes-rss.png'),(await win.webContents.capturePage()).toPNG());
 console.log('NATIVE_LIVE_ANNOUNCEMENTS_PASS');app.exit(0);
}catch(error){console.error(error);app.exit(1)}});
