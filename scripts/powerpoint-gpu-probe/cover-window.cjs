function readCoverBounds(rect,monitor){
 const valid=value=>value&&typeof value==='object'&&Object.keys(value).length===4&&['left','top','width','height'].every(key=>Number.isSafeInteger(value[key]))&&Math.abs(value.left)<=100000&&Math.abs(value.top)<=100000&&value.width>0&&value.width<=4096&&value.height>0&&value.height<=2160;
 if(!valid(rect)||!valid(monitor)||rect.left<monitor.left||rect.top<monitor.top||rect.left+rect.width>monitor.left+monitor.width||rect.top+rect.height>monitor.top+monitor.height)throw Error('GPU_COVER_BOUNDS');
 return{x:rect.left,y:rect.top,width:rect.width,height:rect.height};
}
async function createCoverWindow(rect,monitor){
 const bounds=readCoverBounds(rect,monitor),{BrowserWindow}=require('electron');
 if(typeof BrowserWindow!=='function')throw Error('GPU_COVER_REQUIRES_ELECTRON_PARENT');
 const win=new BrowserWindow({...bounds,show:false,frame:false,alwaysOnTop:true,focusable:false,skipTaskbar:true,resizable:false,movable:false,backgroundColor:'#000000',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
  win.setMenu(null);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());
  await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><style>html,body{margin:0;width:100%;height:100%;background:#000;color:#fff;font:24px system-ui}p{position:fixed;bottom:24px;right:24px;opacity:.6}</style><p>PowerPoint-Ausgabeprüfung · TESTBETRIEB</p>'));
  win.showInactive();win.setAlwaysOnTop(true,'screen-saver');if(!win.isVisible()||!win.isAlwaysOnTop())throw Error('GPU_COVER_NOT_VISIBLE_'+Number(win.isVisible())+'_'+Number(win.isAlwaysOnTop()));return win;
 }catch(error){if(!win.isDestroyed())win.destroy();throw error}
}
module.exports={readCoverBounds,createCoverWindow};
