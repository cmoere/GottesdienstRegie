const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1366,height:768,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 try{
  await win.loadURL('http://127.0.0.1:5178/scripts/loop-menu-test.html');
  const evaluate=code=>win.webContents.executeJavaScript(code);
  await evaluate(`new Promise((resolve,reject)=>{const timer=setInterval(()=>{if(document.querySelector('.section-add-button')){clearInterval(timer);resolve()}},30);setTimeout(()=>reject(Error('Sidebar not mounted')),15000)})`);
  const settle=()=>evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  for(const width of [1920,1366,1000]){
   win.setContentSize(width,768);await settle();
   const overlap=await evaluate(`(()=>{const errors=[];for(const row of document.querySelectorAll('.section-label')){const nodes=[...row.querySelectorAll('.section-collapse,.section-title,.section-actions>*')];const boxes=nodes.map(n=>({name:n.className,r:n.getBoundingClientRect()}));for(let i=1;i<boxes.length;i++)if(boxes[i].r.left<boxes[i-1].r.right-.5)errors.push(boxes[i-1].name+' overlaps '+boxes[i].name);if(boxes.at(-1).r.right>row.getBoundingClientRect().right+.5)errors.push('actions overflow')}return errors})()`);
   assert.deepEqual(overlap,[],`Header at ${width}px`);
  }
  for(const [section,type,label] of [['pre','weather','Wetter'],['post','clock','Uhrzeit']]){
   await evaluate(`document.querySelectorAll('.section-add-button')[${section==='pre'?0:1}].click()`);await settle();
   assert.equal(await evaluate(`document.querySelector('.add-content-popover').children[1].classList.contains('add-popover-loop-group')`),true,'Loop choices come first');
   await evaluate(`[...document.querySelectorAll('.add-popover-loop-group button')].find(b=>b.textContent.includes('${label}')).click()`);await settle();
   const item=await evaluate(`window.loopTestState().items.find(i=>i.type==='${type}')`);
   assert.equal(item?.sectionId,section,'Empty section is an explicit add target');
   assert.ok(item.slides.some(s=>s.elements.some(e=>e.type==='loop')),'Created item has loop renderer');
   assert.equal(await evaluate(`!!document.querySelector('.add-content-popover')`),false,'Menu closes after add');
  }
  assert.equal(await evaluate(`window.loopTestState().sections.find(s=>s.id==='pre').supportsLoopItems`),true);
  assert.equal(await evaluate(`window.loopTestState().items.filter(i=>i.sectionId==='service').length`),0,'Never add into service by accident');
  console.log('PASS: empty pre/post additions, correct target and renderer, loop choices first, non-overlapping headers at three widths');
  win.destroy();app.exit(0);
 }catch(error){console.error(error);win.destroy();app.exit(1)}
});
