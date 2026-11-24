// After npm run build: node tests/smoke/remote-live-stream.cjs
const http=require('node:http'),assert=require('node:assert/strict');const {chromium}=require('playwright');
const {remotePage}=require('../../dist-electron/electron/RemotePage.js'),{streamLiveImages}=require('../../dist-electron/electron/LiveImageStream.js');
(async()=>{const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();let heartbeatAge=0,live=true,frames=0,streams=0,snapshots=0,commands=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const colors=[];for(const color of ['#f03020','#2070f0'])colors.push(Buffer.from(await page.evaluate(color=>{const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,320,180);return canvas.toDataURL('image/jpeg').split(',')[1]},color),'base64'));
 const server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');
 if(req.url.startsWith('/api/state')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({onAir:live,liveFrameAgeMs:heartbeatAge,title:'Live-Test',annotationTakeId:'current',current:{id:'one',title:'Folie'},monitor:{profile:'personal',layout:'mirror'},permissions:[]}))}
 else if(req.url.startsWith('/api/live')){streams++;void streamLiveImages(res,async()=>live?colors[frames++%2]:null)}
 else if(req.url.startsWith('/api/frame')){snapshots++;res.setHeader('Content-Type','image/jpeg');res.end(colors[0])}
 else if(req.url.startsWith('/api/command')){commands++;res.end('{}')}
 else{res.setHeader('Content-Type','text/html');res.end(remotePage(req.url.startsWith('/remote/')?'remote':'monitor','Personal Monitor','de','monitor:test'))}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 try{await page.goto(origin+'/monitor/test');await page.locator('#mirror').waitFor({state:'visible'});const samples=[];
 for(let index=0;index<16;index++){await page.waitForTimeout(120);samples.push(await page.evaluate(()=>{const image=document.querySelector('#mirror'),canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3).join(',')}))}
 const changes=samples.filter((value,index)=>index&&value!==samples[index-1]).length;assert(changes>=5,JSON.stringify({changes,samples}));assert(frames>=15);assert.equal(snapshots,0,'Native stream should not fall back to snapshot polling');
 const beforeRecovery=streams;heartbeatAge=5000;await page.waitForTimeout(1100);heartbeatAge=0;assert(streams>beforeRecovery,'A stale live image must reconnect automatically');
 await page.locator('#monitor-settings').click();assert(await page.locator('#reset-live-view').isVisible());const oldStreams=streams;await page.locator('#reset-live-view').click();await page.locator('#view-close').click();await page.waitForFunction(()=>document.querySelector('#mirror').naturalWidth>0);await page.waitForTimeout(400);assert(streams>oldStreams);
 await page.goto(origin+'/remote/test');await page.locator('#mirror').waitFor({state:'visible'});await page.locator('#monitor-settings').click();assert(await page.locator('#reset-live-view').isVisible());await page.locator('#reset-live-view').click();await page.locator('#view-close').click();
 live=false;await page.waitForFunction(()=>document.querySelector('#frame').hidden);assert.equal(commands,0);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,frames,visibleImageChanges:changes,streams,snapshots,commands,resetAvailableOnPersonalMonitor:true,offAirHidden:true}));
 }finally{await context.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
