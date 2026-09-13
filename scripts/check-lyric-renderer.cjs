const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1920,height:1080,webPreferences:{backgroundThrottling:false,offscreen:true}});
 try{
 await win.loadURL('http://localhost:5178/scripts/lyric-renderer-test.html');
 const evaluate=code=>win.webContents.executeJavaScript(code);
 await evaluate(`new Promise(resolve=>{const timer=setInterval(()=>{if(window.advanceTest&&document.querySelector('.lyric-scroll-viewport')){clearInterval(timer);document.fonts.ready.then(resolve)}},30)})`);
 const wait=()=>evaluate(`new Promise(resolve=>setTimeout(resolve,650))`);
 await wait();
 const offset=()=>evaluate(`getComputedStyle(document.querySelector('.lyric-scroll-viewport>div>div')).transform`);
 const first=await offset();
 await evaluate('window.advanceTest(1)');await wait();const second=await offset();assert.notEqual(first,second);
 require('node:fs').writeFileSync(require('node:path').join(app.getPath('temp'),'gottesdienstregie-lyric-scrolling-test.png'),(await win.webContents.capturePage()).toPNG());
 await evaluate('window.advanceTest(2);setTimeout(()=>window.advanceTest(3),50)');await wait();
 assert.equal(await evaluate(`Array.from(document.querySelector('.lyric-scroll-viewport>div>div').children).findIndex(node=>Number(getComputedStyle(node).opacity)===1)`),3);
 await evaluate('window.advanceTest(1)');await wait();assert.equal(await offset(),second);
 win.setContentSize(3840,2160);await wait();
 assert.equal(await evaluate(`document.querySelector('.lyric-scroll-viewport').scrollWidth<=document.querySelector('.lyric-scroll-viewport').clientWidth`),true);
 await evaluate('window.longTest()');await wait();
 assert.equal(await evaluate(`Math.round(parseFloat(getComputedStyle(document.querySelector('.lyric-scroll-viewport')).fontSize))`),144,'Long lyrics must preserve the configured 72px font at 2x output scale');
 assert.equal(await evaluate('window.persistenceTest()'),true);
 console.log('PASS: rendered NEXT, fast NEXT, jump/previous, 4K layout, long text, Undo/Redo, document reload');win.destroy();app.exit(0);
 }catch(error){console.error(error);win.destroy();app.exit(1)}
});
