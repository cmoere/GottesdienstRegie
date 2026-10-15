// Native Electron renderer with inert peripherals and fictional community data.
// Run Vite at 127.0.0.1:5173 and compile electron/preload.ts first.
const {app,BrowserWindow,ipcMain,session}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/native-v82-app');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
let operator,main,media,state={revision:0,slideRevision:0,quickRevision:0,banner:null,slide:null,quick:null,appMode:{mode:'normal',onAir:false}};
const packaged=process.argv.find(arg=>arg.startsWith('--packaged='));
const runtime=packaged?path.resolve(root,packaged.slice('--packaged='.length)):root;
const sent=[],handlers=new Map(),reg=(key,fn)=>handlers.set(key,fn);
const publish=()=>{state.revision++;main.webContents.send('outputs:state',state)};
reg('device:get',()=>({id:'demo',organizationId:'demo',organizationName:'Demogemeinde',name:'Demo-Regie',type:'personal',platform:'win32',status:'online'}));
reg('displays:list',()=>[{id:123,label:'MAIN · Demo',bounds:{x:0,y:0,width:1920,height:1080}}]);
reg('platform:appearance',()=>({}));reg('window-preferences:get',()=>({}));reg('outputs:preflight',()=>({ok:true,errors:[],warnings:[]}));
reg('updates:status',()=>({state:'development'}));reg('updates:current-version',()=>require(path.join(root,'package.json')).version);reg('updates:metadata',()=>({}));reg('operator:get-preferences',()=>({}));
reg('storage:snapshot',()=>({categories:[],totalBytes:0}));reg('media:list',()=>[]);
reg('media:online-status',()=>({online:true,message:'Demo'}));reg('media:cloud-list',()=>[]);
reg('outputs:get-state',()=>state);reg('outputs:get-app-mode',()=>state.appMode);
reg('device-settings:output-displays-read',()=>({profile:{version:1,assignments:[{role:'main',lastDisplayId:123,identity:{label:'MAIN · Demo',pixelWidth:1920,pixelHeight:1080}}]},assignments:{'123':'main'},unresolved:[]}));
reg('device-settings:output-displays-write',(_event,assignments)=>({profile:{version:1,assignments:[{role:'main',lastDisplayId:123,identity:{label:'MAIN · Demo',pixelWidth:1920,pixelHeight:1080}}]},assignments,unresolved:[]}));
reg('device-settings:banner-position-read',()=>'bottom');reg('device-settings:banner-position-write',(_event,value)=>value);
reg('outputs:send-banner',(_event,banner)=>{state.banner=banner;publish();return true});
reg('outputs:send-quick',(_event,_roles,quick)=>{state.quick=quick;state.quickRevision++;publish();return true});
reg('outputs:set-app-mode',(_e,mode)=>{state.appMode=mode;publish();return true});
const take=slide=>{sent.push({at:Date.now(),slide});state.slide=slide;state.slideRevision++;publish();return true};
reg('outputs:on-air',(_e,_assignments,slide)=>take(slide));reg('outputs:send-slide',(_e,slide)=>take(slide));reg('outputs:off-air',()=>{state.slide=null;publish();return true});
reg('presentation:save',(_e,doc)=>({updatedAt:doc.updatedAt}));
reg('media-window:open',async()=>{
 media=new BrowserWindow({show:false,width:1440,height:1000,useContentSize:true,webPreferences:{preload:path.join(runtime,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 await media.loadURL('http://127.0.0.1:5173/#media?context=manage&purpose=item');return true;
});
reg('media-window:select-countdown',(event,presetId)=>{const {countdownMediaSelection}=require(path.join(runtime,'dist-electron/electron/countdownMediaSelection.js')),value=countdownMediaSelection(presetId,event.sender.id,media?.webContents.id,{});if(!value)return false;operator.webContents.send('media:selected',value);media.close();return true});
reg('community:start',event=>{setTimeout(()=>{event.sender.send('community:connection',{connected:true,mode:'online',updatedAt:Date.parse('2026-10-14T12:34:56Z'),loaded:{events:true,rooms:true,announcements:true}});event.sender.send('community:events',[]);event.sender.send('community:rooms',[]);event.sender.send('community:announcements',[
 {messageId:'demo-one',status:'public',messageScreen:true,showMeldungBanner:true,textBanner:'Herzlich willkommen. Im Anschluss laden wir zum Gemeindecafé ein.',titel:'Gemeinsam unterwegs',textMeldung:'Am Sonntag treffen wir uns zum Gemeindecafé.',displayDurationMs:4000},
 {messageId:'demo-two',status:'public',messageScreen:true,titel:'Herzlich eingeladen',textMeldung:'Musik und Begegnung im Gemeindesaal.',displayDurationMs:6000},
]);},80);return true});
for(const match of fs.readFileSync(path.join(root,'electron/preload.ts'),'utf8').matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g))if(!handlers.has(match[1]))reg(match[1],()=>null);
for(const [key,fn]of handlers)ipcMain.handle(key,fn);
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>operator.webContents.executeJavaScript(code);
async function until(win,code,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){if(await win.webContents.executeJavaScript(code))return;await sleep(100)}throw Error('Timeout: '+code)}
async function capture(name,win=operator){await sleep(600);fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());}
async function clickText(text){await js(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!button)throw Error('Missing button '+${JSON.stringify(text)});button.click()})()`)}
async function start(scenario){await js("document.querySelector('.test-session-button').click()");await until(operator,"!!document.querySelector('.test-start-dialog[open]')");await capture('test-preparation');await js(`document.querySelector('input[value="${scenario}"]').click();document.querySelector('.test-start-dialog button[type="submit"]').click()`);await until(operator,'window.v77State().onAir')}
setTimeout(()=>{console.error('Native v77 timeout');app.exit(1)},180000).unref();
app.whenReady().then(async()=>{try{
 session.defaultSession.webRequest.onBeforeRequest((details,cb)=>cb({cancel:/^https?:/.test(details.url)&&!details.url.startsWith('http://127.0.0.1:5173')}));
 const opts={show:false,width:1440,height:1000,useContentSize:true,webPreferences:{preload:path.join(runtime,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}};
 main=new BrowserWindow({...opts,width:1920,height:1080});operator=new BrowserWindow(opts);
 operator.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)console.error('Renderer:',e.message)});
 await main.loadFile(path.join(runtime,'dist/index.html'),{hash:'output?role=main'});await operator.loadURL('http://127.0.0.1:5173/tests/smoke/native-v82-app.html?demo=1');
 await until(operator,"!!document.querySelector('.test-session-button:not(:disabled)')");await capture('operator-workspace');
 if(process.argv.includes('--v80')){
  await js('window.seedV80()');await sleep(250);
  const edge=await js("(()=>{const r=document.querySelector('.service-sidebar-resize').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+50)}})()");
  operator.webContents.sendInputEvent({type:'mouseDown',button:'left',...edge,clickCount:1});operator.webContents.sendInputEvent({type:'mouseMove',x:450,y:edge.y,buttons:1});operator.webContents.sendInputEvent({type:'mouseUp',button:'left',x:450,y:edge.y,clickCount:1});await sleep(250);
  assert.equal(await js("Math.round(document.querySelector('.service-sidebar-shell').getBoundingClientRect().width)"),216,'Native pointer resize obeys15% of1440');
  assert.equal(await js("localStorage.getItem('gottesdienstregie.ui.serviceSidebarWidth')"),'216');
  const points=await js(`(()=>{const rows=[...document.querySelectorAll('.service-drop-row')];const get=title=>rows.find(row=>row.querySelector('.service-copy b')?.textContent.includes(title));const a=get('Termin A').getBoundingClientRect(),c=get('Termin C').querySelector('.drag').getBoundingClientRect();return {from:{x:Math.round(c.x+c.width/2),y:Math.round(c.y+c.height/2)},to:{x:Math.round(a.x+100),y:Math.round(a.y+5)}}})()`);
  operator.webContents.sendInputEvent({type:'mouseDown',button:'left',...points.from,clickCount:1});operator.webContents.sendInputEvent({type:'mouseMove',x:points.from.x+8,y:points.from.y,buttons:1});await sleep(100);operator.webContents.sendInputEvent({type:'mouseMove',...points.to,buttons:1});await sleep(150);
  assert(await js("!!document.querySelector('.service-drop-target.before.drop-over')"),'Pointer sees explicit before marker');
  operator.webContents.sendInputEvent({type:'mouseUp',button:'left',...points.to,clickCount:1});await sleep(450);
  assert.deepEqual(await js("window.v77State().items.filter(i=>i.sectionId==='service').sort((a,b)=>a.order-b.order).map(i=>i.id)"),['C','A','B'],'Native pointer drag moves C before A');
  await js('window.v77State().undo()');assert.deepEqual(await js("window.v77State().items.filter(i=>i.sectionId==='service').sort((a,b)=>a.order-b.order).map(i=>i.id)"),['A','B','C']);
  await js("window.v77State().setMode('preview')");await sleep(200);
  assert(await js("(()=>{const title=document.querySelector('.single-preview-title'),frame=document.querySelector('.main-preview-surface');return title&&frame&&!frame.contains(title)&&title.getBoundingClientRect().bottom<=frame.getBoundingClientRect().top+1})()"),'Single preview title stays above output');
  await capture('v80-workflow');await js('window.seedV77()');await sleep(100);
  console.log('PASS native v80 workflow:15% pointer resize, persisted width, physical before-row drag, undo and external preview title.');
 }
 await clickText('Einstellungen');await capture('settings-window');
 await js("[...document.querySelectorAll('.settings-nav-group-toggle')].find(b=>b.textContent.includes('AUDIO')).click()");
 await until(operator,"[...document.querySelectorAll('.settings-modal nav button')].some(b=>b.textContent.trim()==='Audioausgänge')");
 await js("[...document.querySelectorAll('.settings-modal nav button')].find(b=>b.textContent.trim()==='Audioausgänge').click()");await capture('audio-settings');
 await js("[...document.querySelectorAll('.settings-modal nav button')].find(b=>b.textContent.trim()==='Präsentation').click()");
 await until(operator,"[...document.querySelectorAll('.settings-group h3')].some(h=>h.textContent==='MELDUNGSSCREEN-BANNER')");
 await js("[...document.querySelectorAll('.settings-group')].find(s=>s.querySelector('h3')?.textContent==='MELDUNGSSCREEN-BANNER').scrollIntoView({block:'start'})");await capture('banner-settings');
 await js("[...document.querySelectorAll('.settings-modal nav button')].find(b=>b.textContent.trim()==='Schnellanzeigen').click()");
 await js("[...document.querySelectorAll('.quick-list button')].find(b=>b.textContent.includes('Bibel einblenden')).click()");await capture('osb-settings');
 await js("[...document.querySelectorAll('.settings-modal nav button')].find(b=>b.textContent.trim()==='Allgemein').click()");
 if(process.argv.includes('--v81')){assert(await js("document.body.innerText.includes('GottesdienstRegie bei der Windows-Anmeldung öffnen')&&document.body.innerText.includes('Bei der Windows-Anmeldung im Hintergrund nach Updates suchen')"),'Both login options appear in settings');}
 await js("document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
 await clickText('Medien');
 await js("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Medienbibliothek'));if(!b)throw Error('Medienbibliothek menu missing');b.click()})()");
 for(let i=0;i<100&&!media;i++)await sleep(100);
 assert(media,'Media browser opens a separate native window');
 await until(media,"!!document.querySelector('.media-window-header')");await capture('media-library',media);
 await media.webContents.executeJavaScript("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='COUNTDOWNS').click()");
 await until(media,"document.querySelectorAll('.countdown-preset-grid>button').length===60");
 const librarySize=await media.webContents.executeJavaScript("document.querySelector('.countdown-library').getBoundingClientRect().height");assert(librarySize>600,'Countdown library must occupy usable window space, actual '+librarySize);
 await media.webContents.executeJavaScript("document.querySelector('[aria-label=\"Vorschau: 01:00 · Kerze\"]').click()");await capture('countdown-library',media);
 assert(await media.webContents.executeJavaScript("(()=>{const box=document.querySelector('.countdown-preset-preview').getBoundingClientRect();return [.25,.5,.75].every(x=>document.elementFromPoint(box.left+box.width*x,box.top+box.height*.5)?.closest('.countdown-preset-preview'))})()"),'Selected countdown preview must paint above neighboring tiles');
 await media.webContents.executeJavaScript("document.querySelector('.countdown-preset-preview>button').click()");
 await until(operator,"window.v77State().items.some(i=>i.metadata.countdownPresetId==='countdown:60:candle')");
 assert(await js("window.v77State().items.find(i=>i.metadata.countdownPresetId==='countdown:60:candle').autoAdvance===false"));
 await js('window.seedV82Countdown()');await start('automatic');
 await until(main,"document.querySelector('.countdown-copy strong')?.textContent==='01:00'");await sleep(2200);
 const seconds=async()=>main.webContents.executeJavaScript("(()=>{const [m,s]=document.querySelector('.countdown-copy strong').textContent.split(':').map(Number);return m*60+s})()");
 const beforeEdit=await seconds();assert(beforeEdit<60,'Native countdown must be advancing');
 await js('window.v82EditNext()');await sleep(350);assert(await seconds()<=beforeEdit,'Editing another item must not restart the live countdown');
 await js("(()=>{const s=window.v77State();s.goLive('demo-countdown',s.items.find(i=>i.id==='demo-countdown').slides[0].id)})()");
 await until(main,"document.querySelector('.countdown-copy strong')?.textContent==='01:00'");
 await js("document.querySelector('.test-session-button').click()");await until(operator,'!window.v77State().onAir');
 await js('window.seedV77()');
 await start('next-events');await js("document.querySelector('.preview-nav.next').click()");await until(main,"document.body.innerText.includes('Testveranstaltung')");await capture('postprogram',main);
 await js("window.dispatchEvent(new CustomEvent('gottesdienstregie:open-help',{detail:'Testbetrieb'}))");await capture('test-help');
 assert(await js("(()=>{const mark=document.querySelector('.test-mode-watermark'),r=mark?.getBoundingClientRect();return !r||!!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.help-dialog')})()"),'Watermark cannot escape the output surface above help');
 await js("window.v82Locale('en');window.dispatchEvent(new CustomEvent('gottesdienstregie:open-help',{detail:'Timer'}))");await sleep(300);
 await js("[...document.querySelectorAll('.help-layout>nav button')].find(b=>b.textContent==='Timers and countdowns'||b.textContent==='Timers'||b.textContent==='Timer')?.click()");
 await until(operator,"document.querySelector('.help-article-view img')?.naturalWidth>0");await capture('help-article');
 await js("window.v82Locale('ar')");
 await until(operator,"!!document.querySelector('.help-article-view[lang=ar][dir=rtl]')");
 assert(await js("document.querySelectorAll('.help-article-section h3').length>=2"),'Arabic help includes the localized practical sections');
 operator.setSize(900,900);await sleep(200);
 assert(await js("(()=>{const article=document.querySelector('.help-layout>article');return article.scrollWidth<=article.clientWidth+2})()"),'Narrow RTL help must not overflow its article horizontally');
 await capture('help-arabic-narrow');operator.setSize(1440,1000);
 await js("window.v82Locale('de')");
 await js("document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");await js("document.querySelector('.test-session-button').click()");await until(operator,'!window.v77State().onAir');
 await js('window.seedV77(true)');await sleep(200);sent.length=0;
 const observe=selector=>`(()=>{window.v79Frames=[];new MutationObserver(()=>{const text=document.querySelector(${JSON.stringify(selector)})?.innerText??'';if(text.includes('Gemeinsam unterwegs')&&!window.v79Frames.length)window.v79Frames.push({at:Date.now(),text})}).observe(document.body,{subtree:true,childList:true,characterData:true})})()`;
 await main.webContents.executeJavaScript(observe('.output'));await js(observe('.live-slide-panel'));await start('automatic');
 await until(main,"document.body.innerText.includes('Gemeinsam unterwegs')");
 assert(sent[0]?.slide?.body?.includes('Gemeindecafé'),'First announcement must contain prepared public text');
 await until(operator,"window.v79Frames.length>0");
 const mainFrame=(await main.webContents.executeJavaScript('window.v79Frames'))[0],previewFrame=(await js('window.v79Frames'))[0];
 assert(mainFrame&&Math.abs(mainFrame.at-previewFrame.at)<80,'MAIN and preview must present the shared snapshot within 80 ms, measured '+Math.abs(mainFrame?.at-previewFrame.at)+' ms');
 assert(mainFrame.at>=sent[0].slide._presentAtMs-5&&previewFrame.at>=sent[0].slide._presentAtMs-5,'Neither output commits before the shared deadline');
 console.log('Native MAIN/preview presentation difference:',Math.abs(mainFrame.at-previewFrame.at),'ms');
 await capture('meldungen',main);await capture('meldungen-operator');
 const first=sent.find(x=>x.slide?.title==='Gemeinsam unterwegs');await until(main,"document.body.innerText.includes('Herzlich eingeladen')",9000);
 const next=sent.find(x=>x.slide?.title==='Herzlich eingeladen');assert(next.at-first.at>=3500&&next.at-first.at<6000,'Announcement rotation must honor 4000ms duration');
 assert(await js("document.querySelector('.live-slide-panel').innerText.includes('Herzlich eingeladen')"),'Live preview mirrors prepared output');
 operator.webContents.send('community:announcements',[]);
 await js("(()=>{const s=window.v77State();s.moveItemToSection('demo-content','post');s.goLive('demo-content',s.items.find(i=>i.id==='demo-content').slides[0].id)})()");
 await until(operator,"!!window.v77State().liveTimerPausedSlideId");
 const revision=await js('window.v77State().liveTransitionRevision');await sleep(700);
 assert.equal(await js('window.v77State().liveTransitionRevision'),revision,'Empty post outputs do not ping-pong');
 console.log('NATIVE_V82_APP_PASS: countdown insertion/layout/stacking, announcement first output/duration, mirror, empty fallback, help stacking; screenshots:',out);app.exit(0);
}catch(error){console.error(error);if(operator){console.error((await js('document.body.innerText')).slice(-12000));await capture('failure')}app.exit(1)}});
