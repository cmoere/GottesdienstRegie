const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('assert');
const out=path.resolve(__dirname,'../../work/native-v80');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
setTimeout(()=>app.exit(1),90000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)console.error(event.message)});
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/native-v78.html');
 const js=code=>win.webContents.executeJavaScript(code);
 for(let i=0;i<200&&!await js('!!window.v78');i++)await sleep(100);
 assert(await js('!!window.v78'));
 for(const design of ['classic','light','accent','split','green','silver','frame','footer']){
  const result=await js(`window.v78.notice('${design}')`);assert(result.count>1);assert(result.body===result.expected||result.body.endsWith(result.expected));
  for(const page of [0,result.count-1]){
   await js(`window.v78.notice('${design}',${page})`);await sleep(150);
   const boxes=await js(`(()=>[...document.querySelectorAll('.slide-renderer-element.text')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,scrollHeight:e.scrollHeight,height:e.clientHeight,scrollWidth:e.scrollWidth,width:e.clientWidth}}))()`);
   assert(boxes.length>=2);for(const b of boxes){assert(b.top>=0&&b.bottom<=1080&&b.left>=0&&b.right<=1920,JSON.stringify(b));assert(b.scrollHeight<=b.height+1&&b.scrollWidth<=b.width+1,JSON.stringify(b))}
   fs.writeFileSync(path.join(out,`${design}-${page}.png`),(await win.webContents.capturePage()).toPNG());
  }
 }
 await js("window.v78.notice('classic',0,false)");await sleep(150);assert.equal(await js("document.querySelectorAll('.slide-renderer-element.qr').length"),0);
 const table=await js('window.v78.table()');await sleep(200);assert(table.plan.distance>0);
 const geometry=await js(`(()=>{const row=document.querySelectorAll('.event-table-row')[1],text=row.querySelector('.event-table-title'),viewport=document.querySelector('.event-table-viewport'),a=text.getAnimations()[0];return {title:text.textContent,whiteSpace:getComputedStyle(text).whiteSpace,images:document.querySelectorAll('img').length,readingMs:a.effect.getTiming().duration,planStart:${table.plan.startPauseMs},date:row.children[0].textContent,room:row.children[3].textContent}})()`);
 assert.equal(geometry.title,table.title);assert.equal(geometry.whiteSpace,'nowrap');assert.equal(geometry.images,0);assert.equal(geometry.date,'Di., 13.10.2026');assert.equal(geometry.room,'Gemeindesaal');assert(geometry.readingMs<=table.plan.startPauseMs+1,JSON.stringify(geometry));
 await js(`document.querySelector('.event-table-title').getAnimations()[0].currentTime=${geometry.readingMs}`);await sleep(100);
 const end=await js(`(()=>{const v=document.querySelector('.event-table-title-viewport').getBoundingClientRect(),t=document.querySelector('.event-table-title').getBoundingClientRect();return {right:t.right,limit:v.right}})()`);assert(end.right<=end.limit+1,JSON.stringify(end));
 fs.writeFileSync(path.join(out,'table-first-title.png'),(await win.webContents.capturePage()).toPNG());
 await js('window.v78.table(true)');await sleep(150);
 const last=await js(`(()=>{const rows=document.querySelectorAll('.event-table-row'),r=rows[rows.length-1].getBoundingClientRect(),v=document.querySelector('.event-table-viewport').getBoundingClientRect();return {top:r.top,bottom:r.bottom,limit:v.bottom}})()`);assert(last.bottom<=last.limit+1&&last.top>=0,JSON.stringify(last));
 fs.writeFileSync(path.join(out,'table-end.png'),(await win.webContents.capturePage()).toPNG());
 await js("window.v78.transition('A','Start')");await sleep(100);await js("window.v78.transition('B','Vorher')");await sleep(100);await js("window.v78.transition('B','Aktualisiert')");await sleep(100);
 assert(await js("document.querySelector('.transition-layer.entering').innerText.includes('Aktualisiert')"));
 console.log('PASS native v80: eight designs, complete unclipped notice pages, QR suppression, full table title reading before vertical exit, final rows, same-id update inside 2-second crossfade.');app.exit(0);
 }catch(error){console.error(error);app.exit(1)}});
