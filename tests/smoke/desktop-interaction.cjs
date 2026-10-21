const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../work/desktop-interaction-native');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
setTimeout(()=>app.exit(1),30000).unref();
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1000,height:800,webPreferences:{offscreen:true,backgroundThrottling:false}});
 await win.loadURL('http://127.0.0.1:5173/tests/smoke/desktop-interaction.html');
 const values=await win.webContents.executeJavaScript(`Object.fromEntries(['label','input','textarea','editor','diagnostic'].map(id=>[id,getComputedStyle(document.getElementById(id)).userSelect]))`);
 assert.equal(values.label,'none','Ordinary desktop labels must not be selectable');
 for(const id of ['input','textarea','editor','diagnostic'])assert.equal(values[id],'text',`${id} must retain text selection`);
 await win.webContents.executeJavaScript(`document.getElementById('input').focus();document.getElementById('input').select()`);
 await win.webContents.insertText('Geänderter Text');
 assert.equal(await win.webContents.executeJavaScript(`document.getElementById('input').value`),'Geänderter Text');
 await win.webContents.executeJavaScript(`const editor=document.getElementById('editor');editor.focus();const range=document.createRange();range.selectNodeContents(editor);getSelection().removeAllRanges();getSelection().addRange(range)`);
 await win.webContents.insertText('Neue Folie');
 assert.equal(await win.webContents.executeJavaScript(`document.getElementById('editor').textContent`),'Neue Folie');
 console.log('DESKTOP_INTERACTION_PASS',JSON.stringify(values));app.exit(0);
}catch(error){console.error(error);app.exit(1)}});
