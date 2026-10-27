import type {BrowserWindow} from 'electron';
import type {createPowerPointPlayback} from './PowerPointPlayback';

type Event={sender:{id:number};senderFrame:unknown};
/** A browser-window ID alone is insufficient: navigation and child frames must
 * not inherit permission to obtain original presentation pixels. */
export function createPowerPointOutputAccess(player:ReturnType<typeof createPowerPointPlayback>){
 const entries=new Map<number,{window:BrowserWindow;frame:unknown;url:string;stop():void}>();
 function permitted(event:Event){const own=entries.get(event.sender.id);return Boolean(own&&!own.window.isDestroyed()&&event.senderFrame===own.frame&&own.window.webContents.mainFrame===own.frame&&own.window.webContents.getURL()===own.url)}
 return{
  synchronize(windows:Array<{window:BrowserWindow;required:boolean}>){
   const live=windows.filter(entry=>!entry.window.isDestroyed());
   if(live.length>4||new Set(live.map(entry=>entry.window.webContents.id)).size!==live.length)throw Error('POWERPOINT_RECEIVER_LIMIT');
   for(const[id,entry]of entries)if(!live.some(next=>next.window===entry.window&&next.window.webContents.mainFrame===entry.frame&&next.window.webContents.getURL()===entry.url)){entry.stop();entries.delete(id)}
   for(const{window,required}of live){const{id,mainFrame}=window.webContents;if(entries.has(id))continue;const url=window.webContents.getURL();const stop=player.addReceiver({id,frame:mainFrame,required});entries.set(id,{window,frame:mainFrame,url,stop})}
  },
  boot(event:Event){return permitted(event)?player.binding():null},
  ready(event:Event,value:unknown){return permitted(event)&&player.ready(event.sender.id,value)},
  ack(event:Event,value:any){return permitted(event)&&player.ack(event.sender.id,value?.key)},
  fault(event:Event,value:unknown){if(permitted(event))player.frameFault(event.sender.id,value)},
  clear(){for(const entry of entries.values())entry.stop();entries.clear()},
 };
}
