import type {CommunityPreflightSnapshot} from './communityPreflight';

const snapshot:CommunityPreflightSnapshot={mode:'empty',events:[],rooms:[],announcements:[],loaded:{events:false,rooms:false,announcements:false},postProgramPrepared:false};
let started=false;
export function startCommunityRuntime(){
  if(started)return;started=true;
  const bridge=(window as any).desktop?.community;if(!bridge)return;
  bridge.onEvents((events:unknown)=>{snapshot.events=Array.isArray(events)?events:[];snapshot.loaded!.events=true});
  bridge.onRooms?.((rooms:unknown)=>{snapshot.rooms=rooms;snapshot.loaded!.rooms=true});
  bridge.onAnnouncements((announcements:unknown)=>{snapshot.announcements=Array.isArray(announcements)?announcements:[];snapshot.loaded!.announcements=true});
  bridge.onConnection((state:{mode?:CommunityPreflightSnapshot['mode'];updatedAt?:number})=>{snapshot.mode=state.mode??'empty';snapshot.updatedAt=state.updatedAt});
  void bridge.start();
}
export function setPostProgramPrepared(prepared:boolean){snapshot.postProgramPrepared=prepared}
export function getCommunityRuntimeSnapshot():CommunityPreflightSnapshot{return{...snapshot,events:[...snapshot.events],rooms:structuredClone(snapshot.rooms),announcements:[...snapshot.announcements],loaded:{...snapshot.loaded!}}}
