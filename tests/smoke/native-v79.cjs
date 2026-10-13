const {app,BrowserWindow}=require('electron');
const assert=require('assert'),path=require('path'),fs=require('fs');
const out=path.resolve(__dirname,'../../work/native-v79');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(()=>{console.error('Native v79 timeout');app.exit(1)},90000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/native-v78.html');
 const js=code=>win.webContents.executeJavaScript(code);
 for(let i=0;i<200&&!await js('!!window.v78');i++)await sleep(100);
 const rich=await js('window.v78.richNotice()');assert(rich.body.includes('Neuer Absatz mit ÄÖÜ.'));await sleep(200);
 const styles=await js(`(()=>[...document.querySelectorAll('.slide-renderer-element.text span')].map(e=>({text:e.textContent,font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight,decoration:getComputedStyle(e).textDecorationLine,style:getComputedStyle(e).fontStyle})))()`);
 assert(styles.every(s=>s.font.includes('Cera Pro')));assert(styles.some(s=>s.text==='Fettdruck'&&s.weight==='700'));assert(styles.some(s=>s.text==='Unterstrichen'&&s.decoration.includes('underline')));assert(styles.some(s=>s.text==='Kursiv'&&s.style==='italic'));
 fs.writeFileSync(path.join(out,'rich-notice.png'),(await win.webContents.capturePage()).toPNG());
 await js('window.v78.overview(false)');await sleep(200);
 const motion=await js(`(()=>{const e=document.querySelector('.event-scroll-content'),a=e.getAnimations()[0];if(!a)return null;a.currentTime=8000;return {state:a.playState,time:a.currentTime}})()`);assert(motion&&motion.state==='running');
 await sleep(250);const moved=await js(`(()=>{const e=document.querySelector('.event-scroll-content'),a=e.getAnimations()[0];return {time:a.currentTime,transform:getComputedStyle(e).transform}})()`);assert(moved.time>motion.time+100);assert(!['none','matrix(1, 0, 0, 1, 0, 0)'].includes(moved.transform));
 console.log('PASS native v79: actual Cera Pro, rich-text styles, paragraphs and compositor scrolling.');app.exit(0);
 }catch(error){console.error(error);app.exit(1)}});
