import {playRoutedTone,type AudioRoute,type AudioRouting} from './audioRouting';

type TonePlayer=(routing:AudioRouting,route:AudioRoute,frequency?:number,duration?:number)=>Promise<boolean>;
export async function playOperatorTone(enabled:boolean,routing:AudioRouting,route:Extract<AudioRoute,'notification'|'soundEffects'>,player:TonePlayer=playRoutedTone,frequency?:number,duration?:number){
  if(!enabled)return false;
  return player(routing,route,frequency,duration);
}
