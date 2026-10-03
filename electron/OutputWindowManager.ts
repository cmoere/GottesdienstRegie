import { BrowserWindow, screen } from 'electron';
import type { DisplayAssignments, OutputRole } from './DisplayManager';
import type {AppModeState} from '../src/appMode';
import type {OutputStateSnapshot} from '../src/outputState';

type ManagedOutput={displayId:number;role:OutputRole;window:BrowserWindow};
const outputRoles:OutputRole[]=['main','stage','notes','livestream','lobby'];

export class OutputWindowManager{
  private outputs=new Map<OutputRole,ManagedOutput>();
  private appMode:AppModeState={mode:'normal',onAir:false};
  private states=new Map<OutputRole,OutputStateSnapshot>();
  private revision=0;
  getStateForSender(id:number){const entry=[...this.outputs.values()].find(entry=>!entry.window.isDestroyed()&&entry.window.webContents.id===id);return entry?structuredClone(this.states.get(entry.role)??null):null}
  private update(role:OutputRole,patch:Partial<OutputStateSnapshot>){const old=this.states.get(role)??{revision:0,slide:null,quick:null,appMode:this.appMode};const state={...old,...structuredClone(patch),revision:++this.revision};this.states.set(role,state);const entry=this.outputs.get(role);if(entry&&!entry.window.isDestroyed())entry.window.webContents.send('outputs:state',state)}
  getAppMode(){return {...this.appMode}}
  constructor(private readonly preload:string,private readonly load:(window:BrowserWindow,route:string)=>Promise<void>,private readonly status:(role:OutputRole,state:'ready'|'missing'|'closed')=>void){}
  async start(assignments:DisplayAssignments,payload:unknown){
    await this.stop();
    for(const role of outputRoles)this.update(role,{slide:payload,quick:null,appMode:this.appMode});
    for(const role of outputRoles){const assigned=Object.entries(assignments).find(([,value])=>value===role);if(!assigned)continue;const display=screen.getAllDisplays().find(item=>item.id===Number(assigned[0]));if(!display){this.status(role,'missing');continue}const window=new BrowserWindow({x:display.bounds.x,y:display.bounds.y,width:display.bounds.width,height:display.bounds.height,frame:false,fullscreen:true,show:false,backgroundColor:'#000000',autoHideMenuBar:true,resizable:false,movable:false,skipTaskbar:true,webPreferences:{preload:this.preload,contextIsolation:true,nodeIntegration:false}});window.setMenu(null);this.outputs.set(role,{displayId:display.id,role,window});window.on('closed',()=>{if(this.outputs.get(role)?.window===window){this.outputs.delete(role);this.status(role,'closed')}});await this.load(window,`#output?role=${role}`);window.webContents.send('outputs:app-mode',this.appMode);window.webContents.send('outputs:slide',payload);window.webContents.insertCSS('html,body,#root,.output{background:#000!important;cursor:none!important;overflow:hidden!important}');window.showInactive();window.setFullScreen(true);this.status(role,'ready')}
    return true;
  }
  send(payload:unknown){for(const role of outputRoles)this.update(role,{slide:payload})}
  sendTo(role:OutputRole,payload:unknown){if(!outputRoles.includes(role))return false;this.update(role,{slide:payload});return Boolean(this.outputs.get(role)&&!this.outputs.get(role)!.window.isDestroyed())}
  sendQuick(roles:OutputRole[],payload:unknown){for(const role of roles)if(outputRoles.includes(role))this.update(role,{quick:payload});return true}
  setAppMode(state:AppModeState){this.appMode={...state};for(const role of outputRoles)this.update(role,{appMode:this.appMode});for(const {window} of this.outputs.values())if(!window.isDestroyed())window.webContents.send('outputs:app-mode',this.appMode);return true}
  async stop(){for(const {window} of this.outputs.values())if(!window.isDestroyed())window.close();this.outputs.clear();return true}
  isActive(){return [...this.outputs.values()].some(entry=>!entry.window.isDestroyed())}
  handleRemoved(displayId:number){for(const [role,entry] of this.outputs)if(entry.displayId===displayId){if(!entry.window.isDestroyed())entry.window.close();this.outputs.delete(role);this.status(role,'missing')}}
  identify(assignments:DisplayAssignments){screen.getAllDisplays().forEach((display,index)=>{const role=(assignments[String(display.id)]??(display.id===screen.getPrimaryDisplay().id?'operator':'unused')).toUpperCase(),label=display.label||`Anzeige ${index+1}`,resolution=`${display.bounds.width} × ${display.bounds.height}`;const window=new BrowserWindow({x:display.bounds.x+Math.max(20,Math.round(display.bounds.width/2-190)),y:display.bounds.y+Math.max(20,Math.round(display.bounds.height/2-145)),width:380,height:290,frame:false,transparent:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,show:false,backgroundColor:'#111820',webPreferences:{contextIsolation:true,nodeIntegration:false}});const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#111820;color:white;font:600 17px Segoe UI,sans-serif}main{text-align:center}.n{font-size:118px;line-height:1;color:#67adb5}.r{margin:10px 0 13px;letter-spacing:.14em;color:#ef5c63}.d{font-size:14px;color:#c2cbd1;line-height:1.5}</style><main><div class=n>${index+1}</div><div class=r>${role}</div><div class=d>${label}<br>${resolution}</div></main>`;void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).then(()=>window.showInactive());setTimeout(()=>{if(!window.isDestroyed())window.close()},5000)});return true}
}
