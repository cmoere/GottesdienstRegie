const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');

app.whenReady().then(async()=>{
  ipcMain.handle('media:online-status',()=>({online:true,message:'Cloud erreichbar'}));
  ipcMain.handle('media:cloud-list',()=>[]);
  ipcMain.handle('media:unsplash-search',async(_event,query,_key,page=1)=>{
    const url=new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query',query?.trim()||'natur');
    url.searchParams.set('page',String(page));
    url.searchParams.set('per_page','30');
    url.searchParams.set('content_filter','high');
    const response=await fetch(url,{headers:{authorization:'Client-ID RHfoQj6tMXFaNTUL4AjWNJBcegsRvMqySRd-kp1hrTg','accept-version':'v1'}});
    const data=await response.json();
    return (data.results??[]).map(photo=>({id:`unsplash-${photo.id}`,name:photo.alt_description||photo.description||`Foto von ${photo.user?.name??'Unsplash'}`,path:photo.links?.html??'',kind:'image',size:0,checksum:photo.id,downloadUrl:photo.urls?.regular??photo.urls?.small,updatedAt:photo.updated_at,tags:[`Foto: ${photo.user?.name??'Unsplash'}`],visibility:'community'}));
  });
  const window=new BrowserWindow({width:1200,height:760,show:false,backgroundColor:'#17171d',webPreferences:{preload:path.join(__dirname,'..','dist-electron','preload.js'),contextIsolation:true,nodeIntegration:false}});
  await window.loadFile(path.join(__dirname,'..','dist','index.html'));
  const now=new Date(),presentationId='release-preview',entries=[
    ['Servicezeit geändert','SERVICEZEIT','BEARBEITET','Servicezeit','10:30','10:38'],
    ['Element „Predigt – Hoffnung, die trägt“ umbenannt','SERVICEITEMS','BEARBEITET','Predigt – Hoffnung, die trägt','Predigt','Predigt – Hoffnung, die trägt'],
    ['Folie „Begrüßung“ hinzugefügt','FOLIEN','ERSTELLT','Begrüßung',null,'Neue Folie'],
    ['Veranstaltung verknüpft','VERANSTALTUNG','VERKNÜPFT','Sonntagsgottesdienst',null,'Sonntagsgottesdienst']
  ].map((entry,index)=>({id:`demo-${index}`,presentationId,revisionId:`rev-${148-index}`,timestamp:new Date(now.getTime()-index*240000).toISOString(),actor:index===3?'Josias':'Corbin',userId:index===3?'josias':'corbin',userDisplayName:index===3?'Josias':'Corbin',deviceId:'technik-regie-01',deviceNameSnapshot:'Regie-PC Saal',action:entry[0],actionType:entry[2],category:entry[1],entityType:entry[1]==='SERVICEZEIT'?'serviceTime':'serviceItem',entityId:`entity-${index}`,entityTitle:entry[3],before:entry[4],after:entry[5],source:'desktop',transactionId:`tx-${index}`,syncStatus:index===0?'PENDING':'SYNCED'}));
  const state={presentationId,title:'Sonntagsgottesdienst',date:now.toISOString().slice(0,10),createdAt:now.toISOString(),updatedAt:now.toISOString(),createdBy:'Corbin',historyUserId:'corbin',historyDisplayName:'Corbin',editHistory:entries,restorePoints:[],sections:[],items:[],selectedItemId:'',selectedServiceItemIds:[],selectedSlideId:'',previewItemId:'',previewSlideId:'',liveItemId:'',liveSlideId:'',mode:'edit',previewLayout:'single',activeVirtualScreen:'main',gridSize:200,smartGuides:true,marginGuides:false,ruleOfThirds:false,onAir:false,displayRoles:{},saveState:'saved',history:[],future:[],selectedElementIds:[],title:'Sonntagsgottesdienst',date:now.toISOString().slice(0,10),eventId:'',templateId:'',serviceTime:'10:38',archived:false,trashed:false,transitionDefault:{type:'fade',durationMs:500,direction:'left',easing:'standard',reverseOnPrevious:true}};
  await window.webContents.executeJavaScript(`localStorage.setItem('gottesdienstregie2.presentation',${JSON.stringify(JSON.stringify({state,version:14}))});location.hash='#media?context=manage';location.reload()`);
  await new Promise(resolve=>setTimeout(resolve,1800));
  await window.webContents.executeJavaScript(`document.querySelectorAll('.media-tabs button')[2]?.click()`);
  await new Promise(resolve=>setTimeout(resolve,1200));
  await window.webContents.executeJavaScript(`{const input=document.querySelector('.media-search input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'natur');input.dispatchEvent(new Event('input',{bubbles:true}));}`);
  await new Promise(resolve=>setTimeout(resolve,100));
  await window.webContents.executeJavaScript(`Array.from(document.querySelectorAll('.media-commandbar button')).find(button=>button.textContent?.includes('SUCHEN'))?.click()`);
  await new Promise(resolve=>setTimeout(resolve,4500));
  await window.webContents.executeJavaScript(`{const card=document.querySelector('.cloud-media-grid > button');if(card)card.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));}`);
  await new Promise(resolve=>setTimeout(resolve,1000));
  const image=await window.webContents.capturePage();
  await fs.writeFile(path.join(__dirname,'..','public','help','release-0.36.7.png'),image.toPNG());
  app.quit();
});
