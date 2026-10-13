// Native Electron renderer with inert peripherals and fictional community data.
// Run Vite at 127.0.0.1:5173 and compile electron/preload.ts first.
const {app,BrowserWindow,ipcMain,session}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/native-v77');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
let operator,main,media,state={revision:0,slide:null,quick:null,appMode:{mode:'normal',onAir:false}};
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
reg('outputs:set-app-mode',(_e,mode)=>{state.appMode=mode;publish();return true});
const take=slide=>{sent.push({at:Date.now(),slide});state.slide=slide;publish();return true};
reg('outputs:on-air',(_e,_assignments,slide)=>take(slide));reg('outputs:send-slide',(_e,slide)=>take(slide));reg('outputs:off-air',()=>{state.slide=null;publish();return true});
reg('presentation:save',(_e,doc)=>({updatedAt:doc.updatedAt}));
reg('media-window:open',async()=>{
 media=new BrowserWindow({show:false,width:1440,height:1000,useContentSize:true,webPreferences:{preload:path.join(runtime,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 await media.loadURL('http://127.0.0.1:5173/#media?context=manage&purpose=item');return true;
});
reg('community:start',event=>{setTimeout(()=>{event.sender.send('community:connection',true);event.sender.send('community:events',[]);event.sender.send('community:rooms',[]);event.sender.send('community:announcements',[
 {messageId:'demo-one',status:'public',messageScreen:true,titel:'Gemeinsam unterwegs',textMeldung:'Am Sonntag treffen wir uns zum Gemeindecafé.',displayDurationMs:4000},
 {messageId:'demo-two',status:'public',messageScreen:true,titel:'Herzlich eingeladen',textMeldung:'Musik und Begegnung im Gemeindesaal.',displayDurationMs:6000},
]);},80);return true});
for(const match of fs.readFileSync(path.join(root,'electron/preload.ts'),'utf8').matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g))if(!handlers.has(match[1]))reg(match[1],()=>null);
for(const [key,fn]of handlers)ipcMain.handle(key,fn);
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>operator.webContents.executeJavaScript(code);
async function until(win,code,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){if(await win.webContents.executeJavaScript(code))return;await sleep(100)}throw Error('Timeout: '+code)}
async function capture(name,win=operator){await sleep(600);fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());}
async function clickText(text){await js(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!button)throw Error('Missing button '+${JSON.stringify(text)});button.click()})()`)}
async function start(scenario){await js("document.querySelector('.test-session-button').click()");await until(operator,"!!document.querySelector('.test-start-dialog[open]')");await capture('test-preparation');await js(`document.querySelector('input[value="${scenario}"]').click();document.querySelector('.test-start-dialog button[type="submit"]').click()`);await until(operator,'window.v77State().onAir')}
setTimeout(()=>{console.error('Native v77 timeout');app.exit(1)},90000).unref();
app.whenReady().then(async()=>{try{
 session.defaultSession.webRequest.onBeforeRequest((details,cb)=>cb({cancel:/^https?:/.test(details.url)&&!details.url.startsWith('http://127.0.0.1:5173')}));
 const opts={show:false,width:1440,height:1000,useContentSize:true,webPreferences:{preload:path.join(runtime,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}};
 main=new BrowserWindow({...opts,width:1920,height:1080});operator=new BrowserWindow(opts);
 operator.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)console.error('Renderer:',e.message)});
 await main.loadFile(path.join(runtime,'dist/index.html'),{hash:'output?role=main'});await operator.loadURL('http://127.0.0.1:5173/tests/smoke/native-v77.html?demo=1');
 await until(operator,"!!document.querySelector('.test-session-button:not(:disabled)')");await capture('operator-workspace');
 await clickText('Einstellungen');await capture('settings-window');await js("document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
 await clickText('Medien');
 await js("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Medienbibliothek'));if(!b)throw Error('Medienbibliothek menu missing');b.click()})()");
 for(let i=0;i<100&&!media;i++)await sleep(100);
 assert(media,'Media browser opens a separate native window');
 await until(media,"!!document.querySelector('.media-window-header')");await capture('media-library',media);media.close();
 await start('next-events');await js("document.querySelector('.preview-nav.next').click()");await until(main,"document.body.innerText.includes('Testveranstaltung')");await capture('postprogram',main);
 await js("window.dispatchEvent(new CustomEvent('gottesdienstregie:open-help',{detail:'Testbetrieb'}))");await capture('test-help');
 await js("document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");await js("document.querySelector('.test-session-button').click()");await until(operator,'!window.v77State().onAir');
 await js('window.seedV77(true)');await sleep(200);sent.length=0;
 const observe=selector=>`(()=>{window.v79Frames=[];new MutationObserver(()=>{const text=document.querySelector(${JSON.stringify(selector)})?.innerText??'';if(text.includes('Gemeinsam unterwegs')&&!window.v79Frames.length)window.v79Frames.push({at:Date.now(),text})}).observe(document.body,{subtree:true,childList:true,characterData:true})})()`;
 await main.webContents.executeJavaScript(observe('.output'));await js(observe('.live-slide-panel'));await start('automatic');
 await until(main,"document.body.innerText.includes('Gemeinsam unterwegs')");
 assert(sent[0]?.slide?.body?.includes('Gemeindecafé'),'First announcement must contain prepared public text');
 await until(operator,"window.v79Frames.length>0");
 const mainFrame=(await main.webContents.executeJavaScript('window.v79Frames'))[0],previewFrame=(await js('window.v79Frames'))[0];
 assert(mainFrame&&Math.abs(mainFrame.at-previewFrame.at)<80,'MAIN and preview must present the shared snapshot within 80 ms');
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
 console.log('PASS native v77 announcement first output, duration, mirror and empty fallback; screenshots:',out);app.exit(0);
}catch(error){console.error(error);if(operator){console.error((await js('document.body.innerText')).slice(-12000));await capture('failure')}app.exit(1)}});
