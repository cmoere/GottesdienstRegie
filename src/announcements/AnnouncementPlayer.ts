import {BackgroundAudioRoute} from '../audio/BackgroundAudioRoute';
import {routeDeviceId,type AudioRouting} from '../audioRouting';

/** Speech and gong share the Background Audio device, never a hidden default sink. */
export async function playAnnouncementAudio(url:string,signal:AbortSignal,playing:()=>void,routing:AudioRouting,media:HTMLAudioElement=new Audio(),devices?:()=>Promise<MediaDeviceInfo[]>){
 const route=new BackgroundAudioRoute(media,devices);
 try{
  if(signal.aborted)throw Error('Durchsage abgebrochen.');
  if(routing.background.muted||routing.background.volume<=0||!await route.apply(routeDeviceId(routing,'background')))throw Error('Durchsage: Audioausgang nicht verfügbar oder stummgeschaltet.');
  if(signal.aborted)throw Error('Durchsage abgebrochen.');
  media.preload='auto';media.volume=Math.max(0,Math.min(1,routing.background.volume/100));media.muted=false;media.src=url;
  await new Promise<void>((resolve,reject)=>{
   const finish=(error?:Error)=>{clearTimeout(timer);signal.removeEventListener('abort',abort);media.removeEventListener('ended',ended);media.removeEventListener('error',failed);media.removeEventListener('playing',playing);error?reject(error):resolve()};
   const abort=()=>finish(Error('Durchsage abgebrochen.')),ended=()=>finish(),failed=()=>finish(Error('Durchsage konnte nicht wiedergegeben werden.'));
   const timer=setTimeout(()=>finish(Error('Durchsage hat zu lange gedauert.')),15*60_000);
   signal.addEventListener('abort',abort,{once:true});media.addEventListener('ended',ended,{once:true});media.addEventListener('error',failed,{once:true});media.addEventListener('playing',playing);
   if(signal.aborted)abort();else void media.play().catch(()=>failed());
  });
 }finally{media.pause();media.removeAttribute('src');media.load()}
}
