// Build first; Vite must be running at 127.0.0.1:5173. Never opens real outputs.
const {app,BrowserWindow,ipcMain,session}=require('electron');
const path=require('path'),fs=require('fs'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/full-app-postprogram');
const packaged=process.argv.find(arg=>arg.startsWith('--packaged='));
const runtime=packaged?path.resolve(root,packaged.slice('--packaged='.length)):root;
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const {FirebaseGemeindeService}=require(path.join(runtime,'dist-electron/electron/FirebaseGemeindeService.js'));
const now=new Date(),day=now.toLocaleDateString('sv-SE'),clock=d=>d.toTimeString().slice(0,5);
const rows={current:{titel:'Aktueller Gottesdienst',start_datum:day,start_uhrzeit:clock(new Date(+now-3600000)),ende_datum:day,ende_uhrzeit:clock(now),veranstaltungsort:'raum',raum:'-saal'},next:{titel:'Gemeindeforum',start_datum:day,start_uhrzeit:clock(new Date(+now+1800000)),ende_datum:day,ende_uhrzeit:clock(new Date(+now+3600000)),veranstaltungsort:'raum',raum:'-saal'}};
const community=new FirebaseGemeindeService({
 watchChildren:(key,handlers)=>{const timer=setTimeout(()=>{const data=key==='veranstaltungen'?rows:key==='rooms'?{'-saal':{raumname:'Gemeindesaal',etage:'EG'}}:{};for(const [id,value]of Object.entries(data))handlers.added(id,value);handlers.synced(Object.keys(data))},80);return()=>clearTimeout(timer)},
 watchConnection:listener=>{listener(true);return()=>{}},
});
let main,operator,state={revision:0,slide:null,quick:null,appMode:{mode:'normal',onAir:false}};
const handlers=new Map();
const register=(key,fn)=>handlers.set(key,fn);
register('device:get',()=>({id:'isolated-test',organizationId:'test',organizationName:'Test',name:'Test-PC',type:'personal',platform:'win32',status:'online'}));
register('displays:list',()=>[{id:123,label:'Isolierter MAIN-Test',bounds:{x:0,y:0,width:1920,height:1080}}]);
register('platform:appearance',()=>({}));register('window-preferences:get',()=>({}));
register('outputs:preflight',()=>({ok:true,errors:[],warnings:[]}));
register('outputs:get-state',()=>state);register('outputs:get-app-mode',()=>state.appMode);
const publish=()=>{state.revision++;main.webContents.send('outputs:state',state)};
register('outputs:set-app-mode',(_event,mode)=>{state.appMode=mode;publish();return true});
register('outputs:on-air',(_event,_assignments,slide)=>{state.slide=slide;publish();return true});
register('outputs:send-slide',(_event,slide)=>{state.slide=slide;publish();return true});
register('outputs:off-air',()=>{state.slide=null;publish();return true});
register('community:start',event=>{
 const sender=event.sender;
 sender.testCommunityStops?.forEach(stop=>stop());
 sender.testCommunityStops=[community.subscribeEvents(value=>sender.send('community:events',value)),community.subscribeRooms(value=>sender.send('community:rooms',value)),community.subscribeAnnouncements(value=>sender.send('community:announcements',value)),community.subscribeConnection(value=>sender.send('community:connection',value))];
 return true;
});
register('presentation:save',(_event,document)=>({updatedAt:document.updatedAt}));
// External peripherals are inert; production renderer and preload remain real.
for(const match of fs.readFileSync(path.join(root,'electron/preload.ts'),'utf8').matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g))if(!handlers.has(match[1]))register(match[1],()=>null);
for(const [channel,fn]of handlers)ipcMain.handle(channel,fn);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(window,expression){for(let i=0;i<300;i++){if(await window.webContents.executeJavaScript(expression))return;await sleep(100)}throw Error('Timeout: '+expression)}
const js=code=>operator.webContents.executeJavaScript(code);
async function capture(window,name){await sleep(700);fs.writeFileSync(path.join(out,name+'.png'),(await window.webContents.capturePage()).toPNG())}
async function start(scenario){
 await js("document.querySelector('.test-session-button').click()");
 await until(operator,"!!document.querySelector('.test-start-dialog[open]')");
 if(scenario==='automatic')await capture(operator,'scenario-dialog');
 await js(`document.querySelector('input[value="${scenario}"]').click();document.querySelector('.test-start-dialog button[type="submit"]').click()`);
 await until(operator,'window.postProgramState().onAir');
 await until(operator,"!!document.querySelector('.preview-nav.next:not(:disabled)')");
 await js("document.querySelector('.preview-nav.next').click()");
}
setTimeout(()=>{console.error('Full App smoke timeout');app.exit(1)},120000).unref();
app.whenReady().then(async()=>{
 try{
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:/^https?:/.test(details.url)&&!details.url.startsWith('http://127.0.0.1:5173')&&!details.url.startsWith('http://localhost:5173')}));
  const opts={show:false,width:1920,height:1080,useContentSize:true,webPreferences:{preload:path.join(runtime,'dist-electron/electron/preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}};
  main=new BrowserWindow(opts);operator=new BrowserWindow({...opts,width:1440,height:900});
  operator.webContents.on('console-message',event=>{if(event.level==='error'||event.level===3)console.error('Renderer:',event.message)});
  operator.webContents.on('preload-error',(_event,_path,error)=>console.error('Preload:',error));
  await main.loadFile(path.join(runtime,'dist/index.html'),{hash:'output?role=main'});
  await operator.loadURL('http://127.0.0.1:5173/tests/smoke/full-app-postprogram.html?demo=1');
  await until(operator,"!!document.querySelector('.test-session-button:not(:disabled)')");
  await start('automatic');
  await until(main,"document.body.innerText.includes('Gemeindeforum')");
  const prompts=await js('window.testConfirmations');
  assert(!prompts.join('\n').includes('Gemeindedaten sind derzeit nicht verfügbar'));
  assert(!prompts.join('\n').includes('Ohne verknüpfte Veranstaltung'));
  await capture(main,'automatic-events');
  await js("document.querySelector('.test-session-button').click()");await until(operator,'!window.postProgramState().onAir');
  await js('window.seedPostProgram(false)');await start('leave-room');
  await until(main,"document.body.innerText.includes('Wir bitten alle Besucher, den Raum zu verlassen.')");
  const style=await main.webContents.executeJavaScript("(()=>{const s=getComputedStyle(document.querySelector('.post-program-body>p'));return {weight:s.fontWeight,size:parseFloat(s.fontSize)}})()");
  assert.equal(style.weight,'400');assert(style.size>54);await capture(main,'leave-room');
  await js("document.querySelector('.test-session-button').click()");await until(operator,'!window.postProgramState().onAir');
  await js('window.seedPostProgram(false)');await start('next-events');
  await until(main,"document.body.innerText.includes('Testveranstaltung') && document.body.innerText.includes('(Beispieldaten)')");
  assert((await main.webContents.executeJavaScript('document.body.innerText')).includes('TESTBETRIEB'));
  assert.equal(await js('window.postProgramState().eventKey'),undefined);
  await capture(main,'test-events');
  await js("document.querySelector('.test-session-button').click()");await until(operator,'!window.postProgramState().onAir');
  assert.equal(await js('window.postProgramState().scenario'),undefined);
  await js('window.seedPostProgram(true)');
  await until(operator,"!!document.querySelector('.onair:not(:disabled)')");
  await js("document.querySelector('.onair').click()");await until(operator,'window.postProgramState().onAir');
  await js("document.querySelector('.preview-nav.next').click()");
  await until(main,"document.body.innerText.includes('Gemeindeforum') && !document.body.innerText.includes('TESTBETRIEB')");
  assert(!(await main.webContents.executeJavaScript('document.body.innerText')).includes('Beispieldaten'));
  console.log('PASS full App: link, late community/preflight, actual test dialog, final Next, automatic + both unlinked scenarios, MAIN, 400 weight, watermark, reset');
  app.exit(0);
 }catch(error){console.error(error);if(operator){console.error(await js('document.body.innerText'));await capture(operator,'failure')}app.exit(1)}
});
