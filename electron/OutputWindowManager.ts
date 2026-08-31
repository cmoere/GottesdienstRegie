import { BrowserWindow, screen } from 'electron';
import type { DisplayAssignments, OutputRole } from './DisplayManager';

type ManagedOutput={displayId:number;role:OutputRole;window:BrowserWindow};
const outputRoles:OutputRole[]=['main','stage','notes','livestream','lobby'];

export class OutputWindowManager{
  private outputs=new Map<OutputRole,ManagedOutput>();
  constructor(private readonly preload:string,private readonly load:(window:BrowserWindow,route:string)=>Promise<void>,private readonly status:(role:OutputRole,state:'ready'|'missing'|'closed')=>void){}
  async start(assignments:DisplayAssignments,payload:unknown){
    await this.stop();
    for(const role of outputRoles){const assigned=Object.entries(assignments).find(([,value])=>value===role);if(!assigned)continue;const display=screen.getAllDisplays().find(item=>item.id===Number(assigned[0]));if(!display){this.status(role,'missing');continue}const window=new BrowserWindow({x:display.bounds.x,y:display.bounds.y,width:display.bounds.width,height:display.bounds.height,frame:false,fullscreen:true,show:false,backgroundColor:'#000000',autoHideMenuBar:true,resizable:false,movable:false,skipTaskbar:true,webPreferences:{preload:this.preload,contextIsolation:true,nodeIntegration:false}});window.setMenu(null);this.outputs.set(role,{displayId:display.id,role,window});window.on('closed',()=>{if(this.outputs.get(role)?.window===window){this.outputs.delete(role);this.status(role,'closed')}});await this.load(window,'#output');window.webContents.send('outputs:slide',payload);window.webContents.insertCSS('html,body,#root,.output{background:#000!important;cursor:none!important;overflow:hidden!important}');window.showInactive();window.setFullScreen(true);this.status(role,'ready')}
    return true;
  }
  send(payload:unknown){for(const {window} of this.outputs.values())if(!window.isDestroyed())window.webContents.send('outputs:slide',payload)}
  async stop(){for(const {window} of this.outputs.values())if(!window.isDestroyed())window.close();this.outputs.clear();return true}
  handleRemoved(displayId:number){for(const [role,entry] of this.outputs)if(entry.displayId===displayId){if(!entry.window.isDestroyed())entry.window.close();this.outputs.delete(role);this.status(role,'missing')}}
  identify(assignments:DisplayAssignments){screen.getAllDisplays().forEach((display,index)=>{const role=(assignments[String(display.id)]??(display.id===screen.getPrimaryDisplay().id?'operator':'unused')).toUpperCase();const window=new BrowserWindow({x:display.bounds.x+Math.max(20,Math.round(display.bounds.width/2-150)),y:display.bounds.y+Math.max(20,Math.round(display.bounds.height/2-110)),width:300,height:220,frame:false,transparent:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,show:false,backgroundColor:'#111820',webPreferences:{contextIsolation:true,nodeIntegration:false}});const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#111820;color:white;font:700 18px Segoe UI,sans-serif}main{text-align:center}.n{font-size:104px;line-height:1;color:#67adb5}.r{margin-top:12px;letter-spacing:.14em}</style><main><div class=n>${index+1}</div><div class=r>${role}</div></main>`;void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).then(()=>window.showInactive());setTimeout(()=>{if(!window.isDestroyed())window.close()},4000)});return true}
}
