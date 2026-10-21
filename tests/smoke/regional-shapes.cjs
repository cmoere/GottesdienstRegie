const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadLocalDataModule}=require('../../scripts/export-regional-corpus.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/regional-shapes-native');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
setTimeout(()=>app.exit(1),60000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:900,height:1100,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',event=>console.log('REGIONAL_RENDERER '+event.message));
 async function waitForDom(expression,description){
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){if(await win.webContents.executeJavaScript(expression))return;await sleep(20)}
  const observation=await win.webContents.executeJavaScript(`({active:document.activeElement?.outerHTML,inputs:[...document.querySelectorAll('input')].map(node=>({value:node.value,html:node.outerHTML})),view:document.querySelector('main')?.dataset.probeSelection})`);
  fs.writeFileSync(path.join(out,'dom-condition-failure.json'),JSON.stringify({description,observation},null,2));
  fs.writeFileSync(path.join(out,'dom-condition-failure.png'),(await win.webContents.capturePage()).toPNG());
  assert.fail('DOM condition not reached: '+description);
 }
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/regional-shapes.html');
 for(let n=0;n<100&&!await win.webContents.executeJavaScript('!!window.regionalShapeProbe');n++)await sleep(100);
 assert(await win.webContents.executeJavaScript('!!window.regionalShapeProbe'));
 const {releaseRegionalVariants}=loadLocalDataModule(root,'shared/regional/catalog.ts');
 const {shapeControlEnglishTemplates,shapeControlGermanTemplates}=loadLocalDataModule(root,'shared/regional/shapeControlTemplates.ts');
 const {radioControlEnglishTemplates,radioControlGermanTemplates}=loadLocalDataModule(root,'shared/regional/radioControlTemplates.ts');
 const scenarios=[{id:null,language:'en',ui:{...shapeControlEnglishTemplates,...radioControlEnglishTemplates}},{id:null,language:'de',ui:{...shapeControlGermanTemplates,...radioControlGermanTemplates}},...releaseRegionalVariants.map(({id})=>({id,language:'de',ui:JSON.parse(fs.readFileSync(path.join(root,'shared/regional/packs',id+'.json'),'utf8')).ui}))];
 for(const {id,language,ui} of scenarios){
  console.log('REGIONAL_CHECK '+(id??language));
  await win.webContents.executeJavaScript(`window.regionalShapeProbe.setup(${JSON.stringify(language)},${JSON.stringify(id)})`);
  await waitForDom(`document.querySelector('main')?.dataset.probeSelection===${JSON.stringify(`${language}:${id}:shape`)}`,'fresh shape view');
  await win.webContents.executeJavaScript("document.querySelector('.shape-gallery>button').click()");
  await waitForDom("document.querySelectorAll('[role=dialog] svg').length===35",'complete shape gallery');
  const observed=await win.webContents.executeJavaScript(`(()=>{const dialog=document.querySelector('[role=dialog]'),r=dialog.getBoundingClientRect();return {title:dialog.getAttribute('aria-label'),placeholder:dialog.querySelector('input').placeholder,count:dialog.querySelectorAll('svg').length,labels:[...dialog.querySelectorAll('svg')].map(node=>node.getAttribute('aria-label')),fits:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,scrolls:dialog.querySelector(':scope>div').scrollHeight>dialog.querySelector(':scope>div').clientHeight}})()`);
  assert.equal(observed.title,ui.shapeGalleryTitle);assert.equal(observed.placeholder,ui.shapeGallerySearch);
  assert.equal(observed.count,35);assert(!observed.labels.includes(ui.shapeUnknown));assert(observed.fits);assert(observed.scrolls);
  for(const key of ['shapeCross','shapeFish','shapeChurch','shapeBible','shapeCandle','shapeDove'])assert(observed.labels.includes(ui[key]));
  if(language==='en'||id==='bielefeld-ravensberg'||id==='swabian')fs.writeFileSync(path.join(out,(id??language)+'-gallery.png'),(await win.webContents.capturePage()).toPNG());
  // Hidden offscreen fixtures need explicit keyboard focus, as in desktop-interaction.
  // Actual Electron text input still drives React; no assignment to input/component state.
  await win.webContents.executeJavaScript("document.querySelector('.shape-gallery input').focus()");
  assert(await win.webContents.executeJavaScript("document.activeElement===document.querySelector('.shape-gallery input')"));
  await win.webContents.insertText(ui.shapeDove);
  await waitForDom(`document.querySelectorAll('[role=dialog] button').length===1&&document.querySelector('[role=dialog] small')?.textContent===${JSON.stringify(ui.shapeDove)}`,'localized shape search');
  const found=await win.webContents.executeJavaScript(`(()=>{const buttons=[...document.querySelectorAll('[role=dialog] button')];return buttons.map(node=>node.querySelector('small').textContent)})()`);
  assert.deepEqual(found,[ui.shapeDove]);
  await win.webContents.executeJavaScript("document.querySelector('[role=dialog] button').click()");
  await waitForDom("!document.querySelector('[role=dialog]')",'gallery closed after selection');
  assert.deepEqual(await win.webContents.executeJavaScript('window.regionalShapeProbe.selected()'),{kind:'dove',name:'Taube'});
  assert(await win.webContents.executeJavaScript("!document.querySelector('[role=dialog]')"));
  assert.deepEqual(await win.webContents.executeJavaScript('window.regionalShapeProbe.preserved()'),{document:true,audio:true,display:true});
  await win.webContents.executeJavaScript(`window.regionalShapeProbe.setup(${JSON.stringify(language)},${JSON.stringify(id)},'radio')`);
  await waitForDom(`document.querySelector('main')?.dataset.probeSelection===${JSON.stringify(`${language}:${id}:radio`)}`,'fresh radio view');
  const radio=await win.webContents.executeJavaScript(`(()=>{const panel=document.querySelector('.radio-station-browser'),input=panel.querySelector('input'),r=input.getBoundingClientRect();return {heading:panel.querySelector('h4').textContent,placeholder:input.placeholder,button:panel.querySelector('.radio-search>button').textContent,clear:!!panel.querySelector('.radio-query>button'),fits:panel.getBoundingClientRect().right<=innerWidth,x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  assert.equal(radio.heading,ui.radioBrowserHeading);assert.equal(radio.placeholder,ui.radioBrowserQuery);assert.equal(radio.button,ui.radioBrowserSearch);assert(!radio.clear&&radio.fits);
  await win.webContents.executeJavaScript("document.querySelector('.radio-query input').focus()");
  assert(await win.webContents.executeJavaScript("document.activeElement===document.querySelector('.radio-query input')"));
  await win.webContents.insertText('Jazz ÄÖÜ');
  await waitForDom("!!document.querySelector('.radio-query>button')",'clear control after native text input');
  assert.equal(await win.webContents.executeJavaScript("document.querySelector('.radio-query>button').getAttribute('aria-label')"),ui.radioBrowserClear);
  await win.webContents.executeJavaScript("document.querySelector('.radio-query>button').click()");
  await waitForDom("document.querySelector('.radio-query input')?.value===''&&!document.querySelector('.radio-query>button')",'cleared query');
  assert.equal(await win.webContents.executeJavaScript("document.querySelector('.radio-query input').value"),'');
  assert(await win.webContents.executeJavaScript("(()=>{const audio=document.querySelector('audio');return !audio.currentSrc&&audio.paused})()"),'Localization must not start a stream');
  assert.deepEqual(await win.webContents.executeJavaScript('window.regionalShapeProbe.preserved()'),{document:true,audio:true,display:true});
  if(id==='bielefeld-ravensberg')fs.writeFileSync(path.join(out,id+'-radio.png'),(await win.webContents.capturePage()).toPNG());
  console.log('REGIONAL_UI_PASS '+(id??language));
 }
 console.log('NATIVE_REGIONAL_UI_PASS '+scenarios.length);win.destroy();app.exit(0);
}catch(error){console.error(error);app.exit(1)}});
