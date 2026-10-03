export type AudioLevelMode='analyser'|'fallback'|'idle';
type ContextLike={state:string;resume:()=>Promise<void>;close:()=>Promise<void>;createAnalyser:()=>AnalyserNode;createMediaStreamSource:(stream:MediaStream)=>MediaStreamAudioSourceNode};
export class AudioLevelProvider{
  mode:AudioLevelMode='idle';private analyser?:AnalyserNode;private data?:Uint8Array<ArrayBuffer>;private context?:ContextLike;private source?:MediaStreamAudioSourceNode;private generation=0;
  constructor(private readonly createContext:()=>ContextLike=()=>new AudioContext(),private readonly reducedMotion:()=>boolean=()=>matchMedia('(prefers-reduced-motion: reduce)').matches){}
  async connect(media:HTMLMediaElement){
    this.disconnect();const generation=this.generation;this.mode='fallback';
    try{
      const stream=(media as HTMLMediaElement&{captureStream?:()=>MediaStream}).captureStream?.();
      if(!stream?.getAudioTracks().length)return;
      const context=this.createContext();this.context=context;
      if(context.state==='suspended')await context.resume();
      if(generation!==this.generation)return;
      if(context.state!=='running')throw Error('Analysis context unavailable');
      const analyser=context.createAnalyser();analyser.fftSize=32;
      const source=context.createMediaStreamSource(stream);source.connect(analyser);
      // Analysis is a tap only. Never connect to an audible destination or take over the media element.
      this.source=source;this.analyser=analyser;this.data=new Uint8Array(analyser.frequencyBinCount);this.mode='analyser';
    }catch{if(generation===this.generation){this.disconnect();this.mode='fallback'}}
  }
  levels():number[]{if(this.mode==='analyser'&&this.context?.state==='running'&&this.analyser&&this.data){this.analyser.getByteFrequencyData(this.data);const bucket=Math.max(1,Math.floor(this.data.length/4));return[0,1,2,3].map(index=>{const part=this.data!.slice(index*bucket,(index+1)*bucket);return Math.round((part.reduce((sum,value)=>sum+value,0)/Math.max(1,part.length)/255)*100)/100})}return[0,0,0,0]}
  getSignalState():'present'|'silent'|'unavailable'|'idle'{return this.mode==='idle'?'idle':this.mode!=='analyser'||this.context?.state!=='running'?'unavailable':this.levels().some(value=>value>.01)?'present':'silent'}
  getContextState(){return this.context?.state??'unavailable'}
  disconnect(){this.generation++;this.source?.disconnect();this.analyser?.disconnect?.();void this.context?.close().catch(()=>{});this.source=undefined;this.context=undefined;this.mode='idle';this.analyser=undefined;this.data=undefined}
}
export const audioLevelProvider=new AudioLevelProvider();
