const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({cacheDir:'node_modules/.vite-shapes-review',optimizeDeps:{entries:['tests/smoke/additional-shapes.html'],noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','lucide','zustand','zustand/middleware','qrcode','jszip']},server:{host:'127.0.0.1',port:0,watch:null},logLevel:'error'});
 await server.listen();const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/tests/smoke/additional-shapes.html',{waitUntil:'domcontentloaded',timeout:60000});await page.locator('.shape-review-card').last().waitFor();await page.evaluate(()=>document.fonts.ready);
  const folder=path.resolve('work/additional-shapes-review');await fs.mkdir(folder,{recursive:true});
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   await page.screenshot({path:path.join(folder,theme+'.png'),fullPage:true});
  }
  const geometry=await page.locator('.shape-review-card').evaluateAll(cards=>cards.map(card=>{
   const preview=card.querySelector('header path'),path=card.querySelector('.slide-renderer path'),box=path.getBBox(),svg=path.ownerSVGElement,point=svg.createSVGPoint();point.x=50;point.y=50;
   const rendered=path.getBoundingClientRect();
   return{kind:card.dataset.kind,same:preview.getAttribute('d')===path.getAttribute('d'),centerFilled:path.isPointInFill(point),rendered:{width:rendered.width,height:rendered.height},bounds:{x:box.x,y:box.y,width:box.width,height:box.height}};
  }));
  assert.equal(geometry.length,32);
  for(const item of geometry){assert(item.same,'Gallery and output geometry match');assert(item.rendered.width>1&&item.rendered.height>1,'Output must occupy visible pixels');assert(item.bounds.width>0&&item.bounds.height>0);assert(item.bounds.x>=0&&item.bounds.y>=0&&item.bounds.x+item.bounds.width<=100&&item.bounds.y+item.bounds.height<=100);if(item.kind.startsWith('frame-')||item.kind==='ring')assert.equal(item.centerFilled,false,'Frame center must remain transparent: '+item.kind)}
  const adjustable=await page.locator('.shape-review-card[data-kind^=frame-]').evaluateAll(cards=>cards.map(card=>{
   const path=card.querySelector('.slide-renderer path'),original=path.getAttribute('d'),point=path.ownerSVGElement.createSVGPoint();point.x=50;point.y=50;
   const samples=[1,12,24].map(width=>{path.setAttribute('d',window.shapeReview.path(card.dataset.kind,width));const box=path.getBBox();return{width,centerFilled:path.isPointInFill(point),finite:[box.x,box.y,box.width,box.height].every(Number.isFinite)}});
   path.setAttribute('d',original);return{kind:card.dataset.kind,samples};
  }));
  for(const item of adjustable)for(const sample of item.samples){assert.equal(sample.centerFilled,false,item.kind+' must keep its transparent center at width '+sample.width);assert(sample.finite)}
  const widthChangesFill=await page.locator('[data-kind=frame-rectangle] .slide-renderer path').evaluate(path=>{
   const point=path.ownerSVGElement.createSVGPoint();point.x=12;point.y=50;const original=path.getAttribute('d');
   path.setAttribute('d',window.shapeReview.path('frame-rectangle',1));const thin=path.isPointInFill(point);
   path.setAttribute('d',window.shapeReview.path('frame-rectangle',24));const thick=path.isPointInFill(point);path.setAttribute('d',original);return{thin,thick};
  });assert.deepEqual(widthChangesFill,{thin:false,thick:true});
  assert(await page.locator('[data-kind=banner-ribbon] .slide-renderer path').evaluate(path=>{const p=path.ownerSVGElement.createSVGPoint();p.x=25;p.y=40;return path.isPointInFill(p)}),'Ribbon joins must not become cutouts');
  await page.getByRole('button',{name:'Objekte',exact:true}).click();
  await page.getByPlaceholder('Objekte suchen').fill('Rahmen');
  assert.equal(await page.locator('.shape-gallery-choice').count(),40);
  await page.screenshot({path:path.join(folder,'gallery.png')});
  await page.locator('[role=dialog] button').filter({hasText:'Offener Eckrahmen'}).click();
  assert.equal(await page.locator('body').getAttribute('data-selected'),'frame-corners');
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(folder,'report.json'),JSON.stringify({geometry,adjustable,widthChangesFill,errors},null,2));console.log(JSON.stringify({passed:geometry.length,adjustableFrames:adjustable.length,folder}));
 }finally{await browser.close();await server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
