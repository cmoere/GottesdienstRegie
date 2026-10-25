import type {EspeakService} from './EspeakService';
import type {BundledSpeechService} from './BundledSpeechService';
import {bundledAnnouncementVoice,isBundledAnnouncementVoice} from '../../src/announcements/settings';
import type {SpeechReadingSettings} from '../../src/announcements/readingSettings';
/** The native device repository owns the selection; renderer requests contain text only. */
export function deviceSelectedSpeech(engine:Pick<BundledSpeechService,'status'|'cancel'>&{synthesize:(text:unknown,voiceId:string,reading?:SpeechReadingSettings)=>Promise<Uint8Array>},repository:{readAnnouncements:()=>Promise<{voiceId:string;reading?:SpeechReadingSettings}>}){
 return {status:()=>engine.status(),cancel:()=>engine.cancel(),synthesize:async(text:unknown)=>{const settings=await repository.readAnnouncements(),voice=isBundledAnnouncementVoice(settings.voiceId)?settings.voiceId:bundledAnnouncementVoice;return settings.reading?engine.synthesize(text,voice,settings.reading):engine.synthesize(text,voice)}};
}
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
