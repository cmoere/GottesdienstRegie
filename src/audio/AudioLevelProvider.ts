export type AudioLevelMode='analyser'|'fallback'|'idle';
type ContextLike={createAnalyser:()=>AnalyserNode;createMediaElementSource:(media:HTMLMediaElement)=>MediaElementAudioSourceNode;destination:AudioDestinationNode};
export class AudioLevelProvider{
  mode:AudioLevelMode='idle';private analyser?:AnalyserNode;private data?:Uint8Array<ArrayBuffer>;private fallbackTick=0;
  constructor(private readonly createContext:()=>ContextLike=()=>new AudioContext(),private readonly reducedMotion:()=>boolean=()=>matchMedia('(prefers-reduced-motion: reduce)').matches){}
  connect(media:HTMLMediaElement){try{const context=this.createContext(),analyser=context.createAnalyser();analyser.fftSize=32;const source=context.createMediaElementSource(media);source.connect(analyser);analyser.connect(context.destination);this.analyser=analyser;this.data=new Uint8Array(analyser.frequencyBinCount);this.mode='analyser'}catch{this.analyser=undefined;this.data=undefined;this.mode='fallback'}}
  levels():number[]{if(this.mode==='idle')return[0,0,0,0];if(this.mode==='analyser'&&this.analyser&&this.data){this.analyser.getByteFrequencyData(this.data);const bucket=Math.max(1,Math.floor(this.data.length/4));return[0,1,2,3].map(index=>{const part=this.data!.slice(index*bucket,(index+1)*bucket);return Math.round((part.reduce((sum,value)=>sum+value,0)/Math.max(1,part.length)/255)*100)/100})}if(this.reducedMotion())return[.34,.58,.42,.7];this.fallbackTick+=.55;return[0,1,2,3].map(index=>.25+.7*Math.abs(Math.sin(this.fallbackTick+index*1.17)))}
  disconnect(){this.mode='idle';this.analyser=undefined;this.data=undefined}
}
export const audioLevelProvider=new AudioLevelProvider();
