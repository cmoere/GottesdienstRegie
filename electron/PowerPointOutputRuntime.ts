import {ipcMain,screen,sharedTexture,type BrowserWindow} from 'electron';
import {PowerPointSourceStore} from './PowerPointSourceStore';
import {startPowerPointHost} from './PowerPointHostClient';
import {loadPowerPointRuntimeAssets} from './PowerPointRuntimeAssets';
import {createPowerPointResourceOpener} from './PowerPointResourceOpener';
import {createPowerPointPlayback} from './PowerPointPlayback';
import {createPowerPointOutputAccess} from './PowerPointOutputAccess';
import {readPowerPointThumbnail} from './PowerPointThumbnailReader';
import {createPowerPointPlaybackIntent} from './PowerPointPlaybackIntent';

type Options={libraryRoot:string;runtimeFolder:string;cwd:string;control():BrowserWindow|null;outputs():Array<{role:string;window:BrowserWindow}>;isControlUrl(url:string):boolean};
/** The production Main composition adapter; also exercised by the full-App
 * integration fixture without replacing this IPC or the owned Office worker. */
export function installPowerPointOutputRuntime(options:Options){
 const sourceStore=new PowerPointSourceStore(options.libraryRoot);
 const windows=()=>[options.control(),...options.outputs().map(entry=>entry.window)].filter((window):window is BrowserWindow=>Boolean(window&&!window.isDestroyed()));
 const sendControl=(channel:string,value:unknown)=>{const window=options.control();if(window&&!window.isDestroyed())window.webContents.send(channel,value)};
 const player=createPowerPointPlayback({
  open:createPowerPointResourceOpener({
   source:hash=>sourceStore.get(hash),assets:()=>loadPowerPointRuntimeAssets(options.runtimeFolder),
   guard:()=>{
    const main=options.outputs().find(entry=>entry.role==='main')?.window;
    if(!main||main.isDestroyed()||!main.isVisible())throw Error('POWERPOINT_MAIN_REQUIRED');
    const previous=main.isAlwaysOnTop();main.setAlwaysOnTop(true,'screen-saver');
    return{handle:main.getNativeWindowHandle().readBigUInt64LE().toString(),restore:()=>{if(!main.isDestroyed())main.setAlwaysOnTop(previous)}};
   },
   startHost:startPowerPointHost,
   startProducer:value=>require('./powerpoint-runtime/producer-client.cjs').startGpuProducer(value),
   createBroker:producer=>require('./powerpoint-runtime/frame-broker.cjs').createGpuFrameBroker({producer,textureApi:require('./powerpoint-runtime/managed-texture.cjs').createManagedTextureApi({sharedTexture})}),
   cwd:options.cwd,bounds:{x:screen.getPrimaryDisplay().bounds.x,y:screen.getPrimaryDisplay().bounds.y,width:64,height:64},
  }),
  sendBinding:(id,binding)=>windows().find(window=>window.webContents.id===id)?.webContents.send('powerpoint:frame-bind',binding),
  onState:value=>sendControl('powerpoint:state',value),onFault:code=>sendControl('powerpoint:fault',code),
 });
 const access=createPowerPointOutputAccess(player);
 const intent=createPowerPointPlaybackIntent();
 const close=async()=>{await player.close();access.clear();intent.reset()};
 const command:typeof player.command=(operation,argument)=>player.command(intent.command(operation),argument);
 const requireControl=(event:Electron.IpcMainInvokeEvent)=>{
  const control=options.control();
  if(!control||control.isDestroyed()||event.sender.id!==control.webContents.id||event.senderFrame!==control.webContents.mainFrame||!options.isControlUrl(event.senderFrame.url))throw Error('POWERPOINT_CONTROL_REQUIRED');
 };
 ipcMain.handle('powerpoint:receiver-boot',event=>access.boot(event));
 ipcMain.on('powerpoint:receiver-ready',(event,value)=>access.ready(event,value));
 ipcMain.on('powerpoint:frame-ack',(event,value)=>access.ack(event,value));
 ipcMain.on('powerpoint:frame-fault',(event,value)=>access.fault(event,value));
 ipcMain.handle('powerpoint:take',async(event,hash:string,slideId:number)=>{
  requireControl(event);
  if(!options.outputs().some(entry=>entry.role==='main'))throw Error('POWERPOINT_MAIN_REQUIRED');
  access.synchronize(windows().map(window=>({window,required:true})));
  return player.take(hash,slideId);
 });
 ipcMain.handle('powerpoint:command',(event,op:'play'|'pause'|'next'|'previous'|'goto',argument?:number)=>{requireControl(event);return command(op,argument)});
 ipcMain.handle('powerpoint:stop',async event=>{requireControl(event);await close();return true});
 ipcMain.handle('powerpoint:thumbnail',async(event,hash:string,slideId:number)=>{requireControl(event);return readPowerPointThumbnail(options.libraryRoot,value=>sourceStore.get(value),hash,slideId)});
 return{close,binding:player.binding,command,async setQuick(active:boolean){const operation=intent.quick(active);if(operation&&player.binding())await player.command(operation)}};
}
