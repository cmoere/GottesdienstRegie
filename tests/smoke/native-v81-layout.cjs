const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('assert');
const out=path.resolve(__dirname,'../../work/native-v81-layout');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
setTimeout(()=>app.exit(1),90000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)console.error(event.message)});
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/native-v78.html');
 const js=code=>win.webContents.executeJavaScript(code);
 for(let i=0;i<200&&!await js('!!window.v78');i++)await sleep(100);
 assert(await js('!!window.v78'),'native fixture did not initialize');
 await js('window.v78.overview()');await sleep(200);
 const timeline=await js(`(()=>{const list=document.querySelector('.event-loop-list'),v=document.querySelector('.event-scroll-viewport').getBoundingClientRect(),l=list.getBoundingClientRect();return {viewport:{left:v.left,right:v.right},rail:l.left+parseFloat(getComputedStyle(list).borderLeftWidth)/2,rows:[...list.querySelectorAll('article')].map(row=>{const r=row.getBoundingClientRect(),b=row.querySelector('b').getBoundingClientRect();return {rowY:r.y,rowBottom:r.bottom,dotX:b.x+b.width/2,dotY:b.y+b.height/2}})}})()`);
 console.log('timeline geometry',JSON.stringify(timeline));
 fs.writeFileSync(path.join(out,'timeline-start.png'),(await win.webContents.capturePage()).toPNG());
 for(const row of timeline.rows){assert(Math.abs(row.dotX-timeline.rail)<1,'timeline marker must be centered on rail: '+JSON.stringify({rail:timeline.rail,row}));assert(row.dotX-10.56>=timeline.viewport.left-0.1,'complete timeline marker must remain inside the viewport');}
 assert(Math.abs(timeline.viewport.left-32)<1&&Math.abs(timeline.viewport.right-1888)<1,'timeline uses full available width');
 for(const row of timeline.rows)assert(Math.abs(row.dotY-(row.rowY+row.rowBottom)/2)<1,'marker follows its own row');
 await js('window.v78.overview(true)');await sleep(200);
 const end=await js(`(()=>{const rows=[...document.querySelectorAll('.event-loop-list article')],r=rows.at(-1).getBoundingClientRect(),b=rows.at(-1).querySelector('b').getBoundingClientRect(),v=document.querySelector('.event-scroll-viewport').getBoundingClientRect();return {bottom:r.bottom,limit:v.bottom,dot:b.y+b.height/2,row:r.y+r.height/2}})()`);
 assert(end.bottom<=end.limit+1&&Math.abs(end.dot-end.row)<1,JSON.stringify(end));
 fs.writeFileSync(path.join(out,'timeline-end.png'),(await win.webContents.capturePage()).toPNG());
 for(const qr of [true,false]){await js(`window.v78.notice('classic',0,${qr})`);await sleep(150);const boxes=await js(`(()=>[...document.querySelectorAll('.slide-renderer-element.text')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right}}))()`);assert(Math.abs(boxes[0].left-32)<1&&Math.abs(boxes[0].right-1888)<1,JSON.stringify(boxes));assert(Math.abs(boxes[1].left-32)<1,JSON.stringify(boxes));if(!qr)assert(Math.abs(boxes[1].right-1888)<1,JSON.stringify(boxes));}
 await js('window.v78.table()');await sleep(200);
 const table=await js(`(()=>{const r=document.querySelector('.event-overview-table').getBoundingClientRect(),v=document.querySelector('.event-table-title-viewport').getBoundingClientRect();return {left:r.left,right:r.right,titleWidth:v.width}})()`);
 assert(Math.abs(table.left-32)<1&&Math.abs(table.right-1888)<1,JSON.stringify(table));assert(Math.abs(table.titleWidth-759.52)<1,JSON.stringify(table));
 await js('document.fonts.load(\'800 45.12px "Cera Pro"\')');
 for(const design of ['timeline','minimal','cards','poster']){
  const prepared=await js(`window.v78.overview(false,true,'${design}')`);await sleep(200);
  const titles=await js(`(()=>[...document.querySelectorAll('.event-title-text')].map(e=>{const a=e.getAnimations()[0],t=a?.effect.getTiming(),v=e.parentElement.getBoundingClientRect();return {title:e.textContent,width:v.width,font:getComputedStyle(e).fontSize,duration:t?.duration,delay:t?.delay}}))()`);
  console.log(design,'title reading',JSON.stringify({first:titles[0],last:titles.at(-1),pause:prepared.plan.startPauseMs,total:prepared.minDurationMs}));
  assert(titles.length===8&&titles.every(t=>t.title.endsWith('Titel')&&t.duration>10000),'all full titles have native reading animation');
  assert(Math.abs(titles[0].width-prepared.titleWidth)<2,JSON.stringify({design,actual:titles[0].width,planned:prepared.titleWidth}));
  assert(titles[0].duration<=prepared.plan.startPauseMs+1,'first title completes before row leaves');
  for(const title of titles)assert(title.delay+title.duration<=prepared.minDurationMs+1,'every title finishes before slide ends');
 }
 console.log('PASS native v81 layout: fullwidth notices/table, timeline markers centered on moving rail and own rows at start/end.');app.exit(0);
 }catch(error){console.error(error);app.exit(1)}});
