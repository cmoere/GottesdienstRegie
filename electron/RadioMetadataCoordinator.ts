import {randomUUID} from 'node:crypto';
import {radioTrackIdentity,type RadioNowPlaying} from '../src/radioNowPlaying';
import type {RadioArtwork} from './RadioArtworkService';
type Channel='background'|'preview';
type Session={id:string;trackKey:string;revision:number;stop:()=>void;artwork:RadioArtwork|null};
/** Each playback owner has its own stream; delayed artwork never owns a later take. */
export class RadioMetadataCoordinator{
 private readonly sessions=new Map<string,Session>();
 constructor(private readonly metadata:{start:(stationId:string,url:string,emit:(value:RadioNowPlaying)=>void)=>()=>void},private readonly artwork:{resolve:(title:string,artist:string)=>Promise<RadioArtwork|null>}){}
 start(senderId:number,stationId:string,url:string,emit:(value:RadioNowPlaying)=>void,sessionId:string=randomUUID(),channel:Channel='background'){
  this.stop(senderId,channel);const key=`${senderId}:${channel}`;
  const session:Session={id:sessionId,trackKey:'',revision:0,stop:()=>{},artwork:null};this.sessions.set(key,session);
  const current=()=>this.sessions.get(key)===session;
  try{session.stop=this.metadata.start(stationId,url,value=>{
   if(!current()||value.stationId!==stationId)return;
   const trackKey=radioTrackIdentity(value.title,value.artist),changed=trackKey!==session.trackKey;
   if(changed){session.trackKey=trackKey;session.revision++;session.artwork=null}
   const revision=session.revision,packet={...value,sessionId,trackKey};
   emit({...packet,...(session.artwork??{})});
   if(!changed||!value.title||!value.artist)return;
   void this.artwork.resolve(value.title,value.artist).then(artwork=>{
    if(artwork&&current()&&revision===session.revision&&trackKey===session.trackKey){session.artwork=artwork;emit({...packet,...artwork})}
   }).catch(()=>{});
  })}catch{this.sessions.delete(key);return false}
  return true;
 }
 stop(senderId:number,channel:Channel='background',sessionId?:string){
  const key=`${senderId}:${channel}`,session=this.sessions.get(key);
  if(!session||(sessionId!==undefined&&sessionId!==session.id))return;
  this.sessions.delete(key);session.stop();
 }
 stopAll(senderId:number){this.stop(senderId,'background');this.stop(senderId,'preview')}
}
