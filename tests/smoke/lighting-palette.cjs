// After npm run build: node tests/smoke/lighting-palette.cjs
const http=require('node:http'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {remotePage}=require('../../dist-electron/electron/RemotePage.js');
(async()=>{
 await fs.mkdir('work/lighting-monitor-review',{recursive:true});
 const browser=await chromium.launch({headless:true});let mode='two',futureMode='one',live=true,take='one',revision=1;const errors=[],requests=[];
 const context=await browser.newContext({viewport:{width:1920,height:1080},locale:'de-DE',timezoneId:'Europe/Berlin'});
 const generator=await context.newPage();
 async function image(parts){return Buffer.from(await generator.evaluate(parts=>{const c=document.createElement('canvas');c.width=960;c.height=540;const ctx=c.getContext('2d');let x=0;for(const [fraction,color]of parts){ctx.fillStyle=color;ctx.fillRect(x,0,960*fraction,540);x+=960*fraction}return c.toDataURL('image/png').split(',')[1]},parts),'base64')}
 const images={two:await image([[.6,'#DC782D'],[.4,'#122350']]),one:await image([[.9,'#6EB4F5'],[.1,'#E63C32']]),neutral:await image([[.5,'#000000'],[.5,'#FFFFFF']])};
 const server=http.createServer((req,res)=>{requests.push(req.url);res.setHeader('Cache-Control','no-store');
  if(req.url.startsWith('/api/state')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({onAir:live,title:'Sonntagsgottesdienst',annotationTakeId:take,current:{id:'current',title:'Aktuelle Folie'},order:live?['Ankommen','Lied','Predigt']:undefined,upcoming:Array.from({length:4},(_,index)=>({slide:{id:'next-'+index,title:'Nächste Folie '+(index+1),body:''}})),nextPreviewRevision:revision,monitor:{profile:'lighting',layout:'lighting',showClock:true},permissions:[]}))}
  else if(req.url.startsWith('/api/frame')){res.setHeader('Content-Type','image/png');res.end(images[mode])}
  else if(req.url.startsWith('/api/next-frame')){res.setHeader('Content-Type','image/png');res.end(images[futureMode])}
  else{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(remotePage('monitor','Lichtoperator','de','lighting'))}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(origin+'/lichtoperator');
  await page.waitForFunction(()=>document.querySelector('#lighting-color-1 .color-name').textContent==='Dunkelblau');
  assert.equal(await page.locator('#lighting-color-0 .color-name').textContent(),'Orange');
  assert.match(await page.locator('#clock').textContent(),/^\w{2}\., \d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2} Uhr$/);
  await page.locator('#lighting-color-1 .copy-color').click();
  await page.waitForFunction(()=>document.querySelector('#palette-status').textContent.includes('Farbwert kopiert'));
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'#173B8F');
  const bounds=await page.evaluate(()=>Object.fromEntries(['header','#current-card','#frame','#lighting-palette','#palette-status','#current-caption'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{top:r.top,bottom:r.bottom,height:r.height}]})));
  assert(bounds['#current-card'].bottom<=1080,JSON.stringify(bounds));
  await page.screenshot({path:'work/lighting-monitor-review/lighting-color-copy.png'});
  await page.waitForFunction(()=>document.querySelector('#next-color-0 .color-name').textContent==='Hellblau');
  assert.equal(await page.locator('#next-color-1').isVisible(),false);for(const id of ['#next-mirror','#next-mirror-1','#next-mirror-2','#next-mirror-3'])await page.locator(id).waitFor({state:'visible'});
  await page.locator('#next-color-0 .copy-color').click();
  await page.waitForFunction(()=>document.querySelector('#next-palette-status').textContent.includes('Farbwert kopiert'));
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'#86C5FF');
  assert(await page.locator('#next-card').evaluate(node=>node.getBoundingClientRect().bottom<=innerHeight));
  await page.locator('#monitor-settings').click();await page.locator('#monitor-next-colors').uncheck();await page.locator('#view-close').click();
  assert.equal(await page.locator('#next-palette').isVisible(),false);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#status').dataset.state==='connected');
  assert.equal(await page.locator('#next-palette').isVisible(),false);
  await page.locator('#monitor-settings').click();assert.equal(await page.locator('#monitor-next-colors').isChecked(),false);
  await page.locator('#monitor-next-colors').check();await page.locator('#view-close').click();
  await page.waitForFunction(()=>document.querySelector('#next-color-0 .color-name').textContent==='Hellblau');
  futureMode='two';revision++;
  await page.waitForFunction(()=>document.querySelector('#next-color-1 .color-name').textContent==='Dunkelblau');
  assert.equal(await page.locator('#next-color-0 .color-name').textContent(),'Orange');
  await page.screenshot({path:'work/lighting-monitor-review/lighting-current-and-next-colors.png'});
  mode='one';take='two';await page.waitForFunction(()=>document.querySelector('#lighting-color-0 .color-name').textContent==='Hellblau');
  assert.equal(await page.locator('#lighting-color-1').isVisible(),false);
  await page.locator('#lighting-color-0 .copy-color').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'#86C5FF');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}}));
  await page.waitForTimeout(1700);await page.locator('#lighting-color-0 .copy-color').click();
  await page.waitForFunction(()=>document.querySelector('#palette-status').textContent.includes('Kopieren nicht möglich'));
  await page.locator('#order-card').waitFor({state:'visible'});
  await page.locator('#monitor-settings').click();await page.locator('#monitor-order').uncheck();await page.locator('#view-close').click();assert.equal(await page.locator('#order-card').isVisible(),false);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#status').dataset.state==='connected');assert.equal(new URL(page.url()).pathname,'/lichtoperator');assert.equal(new URL(page.url()).search,'');assert.equal(await page.locator('#order-card').isVisible(),false);
  await page.locator('#monitor-settings').click();assert.equal(await page.locator('#monitor-order').isChecked(),false);await page.locator('#monitor-order').check();await page.locator('#view-close').click();await page.locator('#order-card').waitFor({state:'visible'});
  mode='neutral';futureMode='neutral';take='neutral';revision++;
  await page.waitForFunction(()=>document.querySelector('#palette-status').textContent==='Keine farbige Lichtempfehlung'&&document.querySelector('#next-palette-status').textContent==='Keine farbige Lichtempfehlung');
  assert.equal(await page.locator('#lighting-color-0').isVisible(),false);assert.equal(await page.locator('#next-color-0').isVisible(),false);assert.equal(await page.locator('.copy-color:visible').count(),0);
  mode='one';futureMode='two';take='restored';revision++;await page.waitForFunction(()=>document.querySelector('#lighting-color-0 .color-name').textContent==='Hellblau');
  live=false;take='off';await page.waitForFunction(()=>document.querySelector('#lighting-palette').hidden);
  assert.equal(await page.locator('#lighting-color-0 .copy-color').isDisabled(),true);assert.equal(await page.locator('#next-palette').isVisible(),false);assert.equal(await page.locator('#next-color-0 .copy-color').isDisabled(),true);
  live=true;take='three';await page.waitForFunction(()=>document.querySelector('#lighting-color-0 .color-name').textContent==='Hellblau');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'work/lighting-monitor-review/lighting-color-mobile.png'});
  assert.deepEqual(errors,[]);assert(!requests.some(x=>x.startsWith('/api/command')));
  console.log('PASS: inline date/time, current and next image colors, real clipboards, dominant color, persisted next-color toggle, revised preview, denied clipboard, OFF AIR reset, desktop/mobile layout, no commands/errors');
 }finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
