import type {EspeakService} from './EspeakService';
export class SpeechAccess<Event>{
 constructor(private engine:Pick<EspeakService,'status'|'synthesize'|'cancel'>,private isControl:(event:Event)=>boolean){}
 authorize(event:Event){if(!this.isControl(event))throw Error('Sprachausgabe ist nur im Steuerfenster verfügbar.')}
 async status(event:Event){this.authorize(event);return this.engine.status()}
 async synthesize(event:Event,text:unknown){this.authorize(event);return this.engine.synthesize(text)}
 cancel(event:Event){this.authorize(event);this.engine.cancel()}
}
export class SpeechIndicator{
 private state={revision:0,active:false};private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private publish:(state:{revision:number;active:boolean})=>void){}
 snapshot(){return{...this.state}}
 set(value:unknown){
  if(typeof value!=='boolean')throw Error('Ungültiger Durchsagestatus.');
  clearTimeout(this.timer);
  if(value)this.timer=setTimeout(()=>this.set(false),4000);
  if(value!==this.state.active){this.state={revision:this.state.revision+1,active:value};this.publish(this.snapshot())}
 }
 dispose(){clearTimeout(this.timer);this.set(false)}
}
