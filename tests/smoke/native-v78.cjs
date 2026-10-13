const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('assert');
const out=path.resolve(__dirname,'../../work/native-v78');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
setTimeout(()=>{console.error('Native v78 timed out');app.exit(1)},60000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',(_event,level,message)=>console.log('Renderer:',level,message));
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/native-v78.html');
 for(let i=0;i<200&&!await win.webContents.executeJavaScript('!!window.v78');i++)await sleep(100);
 assert(await win.webContents.executeJavaScript('!!window.v78'),'Native renderer fixture loaded');
 for(const design of ['classic','light','accent','split']){
  const result=await win.webContents.executeJavaScript(`window.v78.notice('${design}')`);assert(result.count>1);assert.equal(result.body,design==='split'?'Fehlerhafte Abendmahlstermine in der Veranstaltungsauskunft\n\n'+result.expected:result.expected);
  for(const page of [0,result.count-1]){
   await win.webContents.executeJavaScript(`window.v78.notice('${design}',${page})`);await sleep(200);
   const boxes=await win.webContents.executeJavaScript(`(()=>[...document.querySelectorAll('.prepared-unused,.slide-renderer-element.text')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,scrollHeight:e.scrollHeight,height:e.clientHeight,scrollWidth:e.scrollWidth,width:e.clientWidth}}))()`);
   assert(boxes.length>=2);for(const box of boxes){assert(box.top>=0&&box.bottom<=1080&&box.left>=0&&box.right<=1920,JSON.stringify(box));assert(box.scrollHeight<=box.height+1,JSON.stringify(box));assert(box.scrollWidth<=box.width+1,JSON.stringify(box))}
   fs.writeFileSync(path.join(out,`${design}-${page}.png`),(await win.webContents.capturePage()).toPNG());
  }
 }
 const plan=await win.webContents.executeJavaScript('window.v78.events(false)');assert(plan.scrollPlan.distance>0);assert(plan.minDurationMs>60000);await sleep(200);fs.writeFileSync(path.join(out,'events-start.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript('window.v78.events(true)');await sleep(200);
 const last=await win.webContents.executeJavaScript(`(()=>{const e=[...document.querySelectorAll('.post-program-row')].at(-1),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})()`);assert(last.top>=162&&last.bottom<=1081,JSON.stringify(last));
 fs.writeFileSync(path.join(out,'events-end.png'),(await win.webContents.capturePage()).toPNG());
 const normal=await win.webContents.executeJavaScript('window.v78.overview(false)');assert(normal.plan.distance>0);assert(normal.minDurationMs>30000);
 await win.webContents.executeJavaScript('window.v78.overview(true)');await sleep(200);
 const finalRow=await win.webContents.executeJavaScript(`(()=>{const e=[...document.querySelectorAll('.event-loop-list article')].at(-1),r=e.getBoundingClientRect(),p=document.querySelector('.event-scroll-viewport').getBoundingClientRect();return {top:r.top,bottom:r.bottom,limit:p.bottom}})()`);assert(finalRow.bottom<=finalRow.limit+1&&finalRow.top>=0,JSON.stringify(finalRow));
 fs.writeFileSync(path.join(out,'overview-end.png'),(await win.webContents.capturePage()).toPNG());
 win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await win.webContents.executeJavaScript('window.v78.overview(false,true)');await sleep(200);
 const reduced=await win.webContents.executeJavaScript(`(()=>{const rows=[...document.querySelectorAll('.event-loop-list article')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom}});return {rows,limit:document.querySelector('.event-scroll-viewport').getBoundingClientRect().bottom}})()`);
 assert.equal(reduced.rows.length,2);assert(reduced.rows[0].bottom<=reduced.rows[1].top);assert(reduced.rows[1].bottom<=reduced.limit+1);
 fs.writeFileSync(path.join(out,'overview-reduced-motion.png'),(await win.webContents.capturePage()).toPNG());
 console.log('Native v78 passed: four designs, first/last notice pages unclipped, complete scroll and duration.');app.exit(0);
 }catch(error){console.error(error);app.exit(1)}});
