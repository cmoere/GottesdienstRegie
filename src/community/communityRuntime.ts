import type {CommunityPreflightSnapshot} from './communityPreflight';

const snapshot:CommunityPreflightSnapshot={mode:'empty',events:[],announcements:[]};
let started=false;
export function startCommunityRuntime(){
  if(started)return;started=true;
  const bridge=(window as any).desktop?.community;if(!bridge)return;
  bridge.onEvents((events:unknown)=>{snapshot.events=Array.isArray(events)?events:[]});
  bridge.onAnnouncements((announcements:unknown)=>{snapshot.announcements=Array.isArray(announcements)?announcements:[]});
  bridge.onConnection((state:{mode?:CommunityPreflightSnapshot['mode'];updatedAt?:number})=>{snapshot.mode=state.mode??'empty';snapshot.updatedAt=state.updatedAt});
  void bridge.start();
}
export function getCommunityRuntimeSnapshot():CommunityPreflightSnapshot{return{...snapshot,events:[...snapshot.events],announcements:[...snapshot.announcements]}}
