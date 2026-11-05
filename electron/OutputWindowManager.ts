import { BrowserWindow, screen } from 'electron';
import type { DisplayAssignments, OutputRole } from './DisplayManager';
import type {AppModeState} from '../src/appMode';
import type {OutputStateSnapshot,BannerOutputState} from '../src/outputState';
import {readScreenTestReceipt} from '../src/screenTest';
import type{WeatherWarningState}from'../shared/weatherWarnings';
import {readOutputPaintReceipt,type OutputTimingSummary,type OutputPaintReceipt} from '../shared/outputTiming';

type ManagedOutput={displayId:number;role:OutputRole;window:BrowserWindow};
const outputRoles:OutputRole[]=['main','stage','notes','livestream','lobby'];

export class OutputWindowManager{
  private outputs=new Map<OutputRole,ManagedOutput>();
  private pendingMain?: ManagedOutput;
  private appMode:AppModeState={mode:'normal',onAir:false};
  private states=new Map<OutputRole,OutputStateSnapshot>();
  private revision=0;
  private timingHistory=new Map<OutputRole,Array<{revision:number;totalMs:number;renderMs:number;paintedAtMs:number}>>();
  private previewReceipt?:OutputPaintReceipt;
  private previewDeliveryRevision?:number;
  acceptPreviewReceipt(value:unknown){
    const receipt=readOutputPaintReceipt(value),main=this.states.get('main'),take=main?.slide as {_outputRevision?:number}|null;
    if(!this.isActive()||!receipt||receipt.revision!==take?._outputRevision||!main?.delivery||(receipt.revision===this.previewReceipt?.revision&&main.delivery.revision===this.previewDeliveryRevision)||receipt.receivedAtMs<main.delivery.sentAtMs||receipt.paintedAtMs>Date.now()+1000||Date.now()-receipt.receivedAtMs>120000)return false;
    this.previewReceipt=receipt;this.previewDeliveryRevision=main.delivery.revision;return true;
  }
  acceptPaintReceipt(senderId:number,value:unknown){
    const entry=[...this.outputs.values()].find(entry=>!entry.window.isDestroyed()&&entry.window.webContents.id===senderId);
    const receipt=readOutputPaintReceipt(value);if(!entry||!receipt)return false;
    const delivery=this.states.get(entry.role)?.delivery,now=Date.now(),history=this.timingHistory.get(entry.role)??[];
    if(!delivery||delivery.revision!==receipt.revision||history.some(sample=>sample.revision===receipt.revision)||receipt.receivedAtMs<delivery.sentAtMs||receipt.paintedAtMs>now+1000||now-delivery.sentAtMs>120000)return false;
    history.push({revision:receipt.revision,totalMs:Math.max(0,now-delivery.sentAtMs),renderMs:receipt.paintedAtMs-receipt.receivedAtMs,paintedAtMs:receipt.paintedAtMs});
    this.timingHistory.set(entry.role,history.slice(-30));return true;
  }
  getTimings():OutputTimingSummary[]{return [...this.outputs.values()].filter(entry=>!entry.window.isDestroyed()).map(entry=>{
    const history=this.timingHistory.get(entry.role)??[],last=history.at(-1),sorted=history.map(sample=>sample.totalMs).sort((a,b)=>a-b);
    const state=this.states.get(entry.role),take=state?.slide as {_outputRevision?:number}|null,confirmed=last?.revision===state?.delivery?.revision;
    const previewDeltaMs=entry.role==='main'&&confirmed&&state?.delivery?.revision===this.previewDeliveryRevision&&take?._outputRevision===this.previewReceipt?.revision&&last&&this.previewReceipt?last.paintedAtMs-this.previewReceipt.paintedAtMs:undefined;
    return{role:entry.role,status:confirmed?'confirmed':'pending',samples:history.length,lastMs:last?.totalMs??null,renderMs:last?.renderMs??null,p95Ms:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,previewDeltaMs};
  })}
  /** Main-process use only; never exposed through preload or output snapshots. */
  getNativeCompositionWindows(){return [...this.outputs.values()].filter(entry=>!entry.window.isDestroyed()).map(({role,window})=>({role,window}))}
  private frames=new Map<OutputRole,{windowId:number;at:number;value:Promise<Buffer|null>}>();
  async captureFrame(role:'main'|'stage'|'livestream'):Promise<Buffer|null>{
    const entry=this.outputs.get(role);if(!entry||entry.window.isDestroyed())return null;
    const old=this.frames.get(role),now=Date.now();if(old&&old.windowId===entry.window.id&&now-old.at<500)return old.value;
    const value=entry.window.webContents.capturePage().then(image=>image.isEmpty()?null:image.resize({width:960}).toJPEG(75)).catch(()=>null);
    this.frames.set(role,{windowId:entry.window.id,at:now,value});return value;
  }
  getStateForSender(id:number){
    const entry=[...this.outputs.values(),this.pendingMain].find(entry=>entry&&!entry.window.isDestroyed()&&entry.window.webContents.id===id);
    return entry?structuredClone(this.states.get(entry.role)??null):null;
  }
  acceptScreenTestResult(senderId:number,value:unknown){
    const main=this.outputs.get('main');if(!main||main.window.isDestroyed()||main.window.webContents.id!==senderId)return null;
    const receipt=readScreenTestReceipt(value),quick=this.states.get('main')?.quick as {type?:string;testRunId?:string;testPattern?:string}|null;
    return receipt&&quick?.type==='screenTest'&&quick.testRunId===receipt.runId&&quick.testPattern===receipt.pattern?receipt:null;
  }
  restoreScreenTest(runId:string,previous:unknown){
    const main=this.outputs.get('main'),quick=this.states.get('main')?.quick as {type?:string;testRunId?:string}|null;
    if(typeof runId!=='string'||!/^[a-f0-9]{32}$/.test(runId)||!main||main.window.isDestroyed()||quick?.type!=='screenTest'||quick.testRunId!==runId)return false;
    this.update('main',{quick:previous});return true;
  }
  private update(role:OutputRole,patch:Partial<OutputStateSnapshot>){const old=this.states.get(role)??{revision:0,slide:null,quick:null,appMode:this.appMode},revision=++this.revision;const state={...old,...structuredClone(patch),revision,delivery:'slide' in patch?{revision,sentAtMs:Date.now()}:old.delivery,slideRevision:'slide' in patch?revision:old.slideRevision??0,quickRevision:'quick' in patch?revision:old.quickRevision??0};this.states.set(role,state);const entry=this.outputs.get(role);if(entry&&!entry.window.isDestroyed())entry.window.webContents.send('outputs:state',state)}
  setBanner(banner:BannerOutputState|null){this.update('main',{banner});return true}
  setWeatherWarnings(weatherWarnings:WeatherWarningState|null){this.update('main',{weatherWarnings});return true}
  setAnnotations(annotations:import('../shared/liveAnnotations').AnnotationState|null){for(const role of outputRoles)this.update(role,{annotations});return true}
  getAppMode(){return {...this.appMode}}
  constructor(private readonly preload:string,private readonly load:(window:BrowserWindow,route:string)=>Promise<void>,private readonly status:(role:OutputRole,state:'ready'|'missing'|'closed')=>void){}
  private createOutput(role:OutputRole,display:Electron.Display):ManagedOutput{
    const window=new BrowserWindow({...display.bounds,frame:false,fullscreen:true,show:false,backgroundColor:'#000000',autoHideMenuBar:true,resizable:false,movable:false,skipTaskbar:true,webPreferences:{preload:this.preload,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
    window.setMenu(null);
    window.on('closed',()=>{
      if(this.outputs.get(role)?.window!==window)return;
      this.outputs.delete(role);
      this.status(role,'closed');
    });
    return {displayId:display.id,role,window};
  }
  private async loadOutput({window,role}:ManagedOutput){
    await this.load(window,`#output?role=${role}`);
    if(!window.isDestroyed())await window.webContents.insertCSS('html,body,#root,.output{background:#000!important;cursor:none!important;overflow:hidden!important}');
  }
  async switchMain(displayId:unknown,stillAllowed:()=>boolean=()=>true){
    if(!this.appMode.onAir||this.pendingMain||typeof displayId!=='number'||!Number.isSafeInteger(displayId))return false;
    const available=()=>screen.getAllDisplays().find(display=>display.id===displayId&&display.id!==screen.getPrimaryDisplay().id&&![...this.outputs.values()].some(entry=>entry.role!=='main'&&entry.displayId===displayId));
    const display=available();
    if(!display||!stillAllowed())return false;
    const previous=this.outputs.get('main');
    if(previous?.displayId===displayId&&!previous.window.isDestroyed())return true;
    const replacement=this.createOutput('main',display);
    this.pendingMain=replacement;
    try{
      await this.loadOutput(replacement);
      if(this.pendingMain!==replacement||!this.appMode.onAir||replacement.window.isDestroyed()||!available()||!stillAllowed())return false;
      this.outputs.set('main',replacement);
      this.frames.delete('main');
      this.timingHistory.delete('main');
      this.previewReceipt=undefined;
      this.previewDeliveryRevision=undefined;
      const state=this.states.get('main');
      if(state)this.update('main',{slide:state.slide});
      replacement.window.showInactive();
      replacement.window.setFullScreen(true);
      if(previous&&!previous.window.isDestroyed())previous.window.close();
      this.status('main','ready');
      return true;
    }catch{
      if(this.outputs.get('main')===replacement){
        if(previous&&!previous.window.isDestroyed())this.outputs.set('main',previous);
        else{this.outputs.delete('main');this.status('main','missing')}
      }
      return false;
    }finally{
      if(this.pendingMain===replacement)this.pendingMain=undefined;
      if(this.outputs.get('main')!==replacement&&!replacement.window.isDestroyed())replacement.window.close();
    }
  }
  async start(assignments:DisplayAssignments,payload:unknown){
    await this.stop();
    for(const role of outputRoles)this.update(role,{slide:payload,quick:null,appMode:this.appMode,annotations:null});
    for(const role of outputRoles){
      const assigned=Object.entries(assignments).find(([,value])=>value===role);
      if(!assigned)continue;
      const display=screen.getAllDisplays().find(item=>item.id===Number(assigned[0]));
      if(!display){this.status(role,'missing');continue}
      const entry=this.createOutput(role,display);
      this.outputs.set(role,entry);
      await this.loadOutput(entry);
      if(entry.window.isDestroyed())continue;
      entry.window.webContents.send('outputs:app-mode',this.appMode);
      entry.window.webContents.send('outputs:slide',payload);
    }
    for(const {window,role} of this.outputs.values())if(!window.isDestroyed()){window.showInactive();window.setFullScreen(true);this.status(role,'ready')}
    return true;
  }
  send(payload:unknown){for(const role of outputRoles)this.update(role,{slide:payload})}
  sendTo(role:OutputRole,payload:unknown){if(!outputRoles.includes(role))return false;this.update(role,{slide:payload});return Boolean(this.outputs.get(role)&&!this.outputs.get(role)!.window.isDestroyed())}
  sendQuick(roles:OutputRole[],payload:unknown){const value=payload as {type?:string;startedAtMs?:number}|null;const quick=value?.type==='countdown'&&!Number.isFinite(value.startedAtMs)?{...value,startedAtMs:Date.now()}:payload;for(const role of roles)if(outputRoles.includes(role))this.update(role,{quick});return true}
  setAppMode(state:AppModeState){this.appMode={...state};for(const role of outputRoles)this.update(role,{appMode:this.appMode});for(const {window} of this.outputs.values())if(!window.isDestroyed())window.webContents.send('outputs:app-mode',this.appMode);return true}
  async stop(){const pending=this.pendingMain;this.pendingMain=undefined;if(pending&&!pending.window.isDestroyed())pending.window.close();for(const {window} of this.outputs.values())if(!window.isDestroyed())window.close();this.outputs.clear();this.timingHistory.clear();this.previewReceipt=undefined;this.previewDeliveryRevision=undefined;return true}
  isActive(){return [...this.outputs.values()].some(entry=>!entry.window.isDestroyed())}
  handleRemoved(displayId:number){for(const [role,entry] of this.outputs)if(entry.displayId===displayId){if(!entry.window.isDestroyed())entry.window.close();this.outputs.delete(role);this.status(role,'missing')}}
  identify(assignments:DisplayAssignments){screen.getAllDisplays().forEach((display,index)=>{const role=(assignments[String(display.id)]??(display.id===screen.getPrimaryDisplay().id?'operator':'unused')).toUpperCase(),label=display.label||`Anzeige ${index+1}`,resolution=`${display.bounds.width} × ${display.bounds.height}`;const window=new BrowserWindow({x:display.bounds.x+Math.max(20,Math.round(display.bounds.width/2-190)),y:display.bounds.y+Math.max(20,Math.round(display.bounds.height/2-145)),width:380,height:290,frame:false,transparent:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,show:false,backgroundColor:'#111820',webPreferences:{contextIsolation:true,nodeIntegration:false}});const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;display:grid;place-items:center;background:#111820;color:white;font:600 17px Segoe UI,sans-serif}main{text-align:center}.n{font-size:118px;line-height:1;color:#67adb5}.r{margin:10px 0 13px;letter-spacing:.14em;color:#ef5c63}.d{font-size:14px;color:#c2cbd1;line-height:1.5}</style><main><div class=n>${index+1}</div><div class=r>${role}</div><div class=d>${label}<br>${resolution}</div></main>`;void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).then(()=>window.showInactive());setTimeout(()=>{if(!window.isDestroyed())window.close()},5000)});return true}
}
