import {applyAudioRoute,type AudioRoute,type AudioRouting} from '../audioRouting';
export async function startRouteProbe(routing:AudioRouting,route:AudioRoute,signal:AbortSignal){
 const context=new AudioContext(),audio=new Audio(),oscillator=context.createOscillator(),gain=context.createGain(),analyser=context.createAnalyser(),destination=context.createMediaStreamDestination();
 let stopped=false,started=false;analyser.fftSize=256;const samples=new Float32Array(analyser.fftSize);
 const stop=()=>{
  if(stopped)return;stopped=true;signal.removeEventListener('abort',stop);
  audio.pause();audio.srcObject=null;if(started)try{oscillator.stop()}catch{}
  oscillator.disconnect();gain.disconnect();analyser.disconnect();destination.stream.getTracks().forEach(track=>track.stop());destination.disconnect();void context.close().catch(()=>{});
 };
 signal.addEventListener('abort',stop,{once:true});
 try{
  if(signal.aborted)throw Error('AUDIO_PROBE_CANCELLED');
  gain.gain.value=.15;oscillator.frequency.value=523.25;oscillator.connect(gain);gain.connect(destination);gain.connect(analyser);audio.srcObject=destination.stream;
  if(context.state==='suspended')await context.resume();
  if(context.state!=='running')throw Error('AUDIO_CONTEXT_NOT_RUNNING');
  const routed=await applyAudioRoute(audio,routing,route);
  if(stopped)throw Error('AUDIO_PROBE_CANCELLED');await audio.play();
  if(stopped)throw Error('AUDIO_PROBE_CANCELLED');oscillator.start();started=true;
  return{routed,stop,sample:()=>{
   if(stopped||audio.muted||context.state!=='running')return 0;
   analyser.getFloatTimeDomainData(samples);return Math.min(1,Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length)*audio.volume);
  }};
 }catch(error){stop();throw error}
}
