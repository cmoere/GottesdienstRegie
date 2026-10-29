'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),base=process.env.OPERATOR_DESIGN_URL;
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(base));
const folder=fs.mkdtempSync(path.join(root,'work/v95-operator-design-'));
app.setPath('userData',path.join(folder,'profile'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
app.whenReady().then(async()=>{let window;try{
 window=new BrowserWindow({show:false,width:1440,height:900,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false}});
 await window.loadURL(base);
 const css=[...fs.readFileSync(path.join(root,'src/main.tsx'),'utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map(match=>match[1]);
 await window.webContents.executeJavaScript(`document.body.innerHTML='';Promise.all(${JSON.stringify(css)}.map(name=>new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/src/'+name;link.onload=resolve;link.onerror=reject;document.head.append(link)})))`);
 const reports=[];
 for(const theme of ['light','dark'])for(const width of [1000,1440,1920])for(const mode of ['edit','original','system','preview'])for(const audio of [false,true]){
  window.setContentSize(width,900);
  const result=await window.webContents.executeJavaScript(`(()=>{
   document.documentElement.dataset.theme=${JSON.stringify(theme)};
   const mode=${JSON.stringify(mode)};
   document.body.innerHTML='<div class="app production-app mode-'+(mode==='preview'?'preview':'edit')+(mode==='original'?' has-original-powerpoint':'')+'"><div class="menubar"><button>Datei</button></div><div class="toolbar"><b>Sonntagsgottesdienst</b><div class="live-session-controls"><button>Testbetrieb starten</button><button class="onair">ON AIR</button></div></div>'+(mode!=='preview'?'<div class="output-tabs">MAIN (Inhalt)</div>':'')+(mode==='edit'?'<div class="format-toolbar"><button>Textformat</button></div>':'')+'<div class="main"><aside class="service-order">Ablauf</aside><section class="workspace-quick-host"><div class="context-editor"><input value="Veranstaltung"><button>Hinzufügen</button></div><div class="slide" style="font-size:47px;color:rgb(211,31,61);border-radius:0">Unveränderte Besucherfolie</div></section></div><div class="production-timeline"><button>Timeline</button></div><div class="status">Bereit</div></div>';
   if(${audio})document.querySelector('.main').insertAdjacentHTML('afterend','<div class="background-audio-controller">Radio · Hintergrundmusik</div>');
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
   const slide=getComputedStyle(document.querySelector('.slide'));
   return {theme:${JSON.stringify(theme)},width:${width},mode,main:rect('.main'),timeline:rect('.production-timeline'),status:rect('.status'),slide:{color:slide.color,fontSize:slide.fontSize,borderRadius:slide.borderRadius}};
  })()`);
  reports.push(result);
  assert(result.main.height>=500,`Workspace collapsed: ${JSON.stringify(result)}`);
  assert(result.main.bottom<=result.timeline.y+1,'Timeline must follow workspace');
  assert(result.status.bottom<=901,'Status must remain inside window');
  assert.deepEqual(result.slide,{color:'rgb(211, 31, 61)',fontSize:'47px',borderRadius:'0px'},'Operator design must preserve slide styling');
 }
 await sleep(400);
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(reports,null,2));
 fs.writeFileSync(path.join(folder,'shell.png'),(await window.webContents.capturePage()).toPNG());
 console.log(JSON.stringify({passed:reports.length,folder}));app.exit(0);
}catch(error){console.error(error);app.exit(1)}finally{window?.destroy()}});
