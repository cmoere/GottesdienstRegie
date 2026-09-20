const {app,BrowserWindow}=require('electron'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('public/releases.json','utf8')),builds=data.versions.flatMap(line=>line.builds);
assert.equal(builds.length,70);assert.deepEqual(builds.filter(build=>build.current).map(build=>build.version),[require('../package.json').version]);assert.equal(builds.filter(build=>build.version!=='0.36.13').every(build=>!!build.overview?.text?.de),true);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,webPreferences:{offscreen:true}});try{
 await win.loadURL('http://127.0.0.1:5178/public/release-notes/index.html?lang=de');
 const result=await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const timer=setInterval(()=>{const releases=[...document.querySelectorAll('.release')];if(releases.length!==69)return;clearInterval(timer);resolve({current:releases[0].textContent,previous:releases[1].textContent,old:document.getElementById('version-0.36.12')?.textContent})},30);setTimeout(()=>reject(Error('Release notes did not render')),5000)})`);
 assert.ok(result.current.includes('0.42.0'));assert.ok(result.current.includes('Vektor'));assert.ok(result.previous.includes('0.41.0'));assert.ok(result.old.includes('Einordnung dieser Version'));
 console.log('PASS: release manifest and 70 rendered releases including version 0.42.0');win.destroy();app.exit(0);
}catch(error){console.error(error);win.destroy();app.exit(1)}});
