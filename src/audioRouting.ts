export type AudioRoute='video'|'background'|'notification'|'preview'|'soundEffects';
export interface AudioRouteConfig{deviceId:string;volume:number;muted:boolean}
export interface AudioRouting{
  defaultOutputDeviceId:string;
  video:AudioRouteConfig;
  background:AudioRouteConfig;
  notification:AudioRouteConfig;
  preview:AudioRouteConfig;
  soundEffects:AudioRouteConfig;
}

export const defaultAudioRouting:AudioRouting={
  defaultOutputDeviceId:'system-default',
  video:{deviceId:'default-output',volume:100,muted:false},
  background:{deviceId:'default-output',volume:80,muted:false},
  notification:{deviceId:'system-default',volume:40,muted:false},
  preview:{deviceId:'default-output',volume:100,muted:false},
  soundEffects:{deviceId:'default-output',volume:100,muted:false}
};

export function routeDeviceId(routing:AudioRouting,route:AudioRoute){
  const selected=routing[route].deviceId;
  const fallback=routing.defaultOutputDeviceId;
  const value=selected==='default-output'?fallback:selected;
  return value==='system-default'?'':value;
}

export function routeAvailable(routing:AudioRouting,route:AudioRoute,devices:MediaDeviceInfo[]){
  const id=routeDeviceId(routing,route);
  return !id||devices.some(device=>device.kind==='audiooutput'&&device.deviceId===id);
}

export async function applyAudioRoute(element:HTMLMediaElement,routing:AudioRouting,route:AudioRoute){
  const target=element as HTMLMediaElement&{setSinkId?:(id:string)=>Promise<void>};
  const config=routing[route];
  element.volume=Math.max(0,Math.min(1,config.volume/100));
  element.muted=config.muted;
  if(!target.setSinkId)return false;
  try{await target.setSinkId(routeDeviceId(routing,route));return true}catch{await target.setSinkId('').catch(()=>{});return false}
}

export async function playRoutedTone(routing:AudioRouting,route:AudioRoute,frequency=523.25,duration=.55){
  const context=new AudioContext(),oscillator=context.createOscillator(),gain=context.createGain(),destination=context.createMediaStreamDestination(),audio=new Audio();
  gain.gain.value=1;oscillator.frequency.value=frequency;oscillator.connect(gain).connect(destination);audio.srcObject=destination.stream;
  const routed=await applyAudioRoute(audio,routing,route);await audio.play();oscillator.start();oscillator.stop(context.currentTime+duration);
  window.setTimeout(()=>{audio.pause();void context.close()},Math.ceil((duration+.25)*1000));return routed
}

export const playRouteTestTone=(routing:AudioRouting,route:AudioRoute)=>playRoutedTone(routing,route);
