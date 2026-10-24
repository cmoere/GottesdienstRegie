import type {SpokenAnnouncement} from './types';
import type {AnnouncementSettings} from './settings';
export interface AnnouncementRunIO{
 synthesize(text:string):Promise<Uint8Array>;
 cancelSynthesis():void;
 duck(percent:number|null):Promise<void>;
 play(kind:'gong'|'speech',data:Uint8Array,signal:AbortSignal,playing:()=>void):Promise<void>;
 indicator(active:boolean):void;
}
/** One owner for preparation, audio and attenuation; cancellation cannot release a newer run. */
export class AnnouncementRun{
 busy=false;private controller:AbortController|null=null;
 constructor(private io:AnnouncementRunIO){}
 cancel(){this.controller?.abort();this.io.cancelSynthesis()}
 async start(row:SpokenAnnouncement,percent:number,isCurrent:()=>boolean){
  if(this.busy)return;
  this.busy=true;const controller=new AbortController();this.controller=controller;let ducked=false;
  const current=()=>!controller.signal.aborted&&isCurrent();
  try{
   const data=await this.io.synthesize(row.text);
   if(!current())return;
   ducked=true;await this.io.duck(percent);
   if(!current())return;
   const playing=()=>{if(current())this.io.indicator(true);else controller.abort()};
   await this.io.play('gong',data,controller.signal,playing);
   if(!current())return;
   await this.io.play('speech',data,controller.signal,playing);
  }catch(error){if(!controller.signal.aborted)throw error}
  finally{
   try{if(ducked){this.io.indicator(false);await this.io.duck(null)}}
   finally{this.controller=null;this.busy=false}
  }
 }
}
export class AnnouncementScheduler{
 private context:string|null=null;private due=0;private lastId='';
 next({now,context,settings,rows,busy}:{now:number;context:string|null;settings:AnnouncementSettings;rows:SpokenAnnouncement[];busy:boolean}):SpokenAnnouncement|null{
  if(!context||!settings.enabled||settings.voiceId!=='espeak-ng:de'){this.context=null;this.lastId='';return null}
  if(context!==this.context){this.context=context;this.due=now+settings.intervalMinutes*60_000;this.lastId='';return null}
  if(busy||now<this.due)return null;
  this.due=now+settings.intervalMinutes*60_000;
  if(!rows.length)return null;
  const previous=rows.findIndex(row=>row.id===this.lastId),row=rows[(previous+1)%rows.length];this.lastId=row.id;return row;
 }
}
