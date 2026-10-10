import type {CommunityPreflightSnapshot} from './communityPreflight';

const snapshot:CommunityPreflightSnapshot={mode:'empty',events:[],rooms:[],announcements:[],loaded:{events:false,rooms:false,announcements:false},postProgramPrepared:false};
let started=false;
let synchronized:CommunityPreflightSnapshot['loaded'];
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(listener=>listener());
export function startCommunityRuntime(){
  if(started)return;
  const bridge=(window as any).desktop?.community;if(!bridge)return;
  started=true;
  bridge.onEvents((events:unknown)=>{snapshot.events=Array.isArray(events)?events:[];snapshot.loaded!.events=true;notify()});
  bridge.onRooms?.((rooms:unknown)=>{snapshot.rooms=rooms;snapshot.loaded!.rooms=true;notify()});
  bridge.onAnnouncements((announcements:unknown)=>{snapshot.announcements=Array.isArray(announcements)?announcements:[];snapshot.loaded!.announcements=true;notify()});
  bridge.onConnection((state:{mode?:CommunityPreflightSnapshot['mode'];updatedAt?:number;loaded?:CommunityPreflightSnapshot['loaded']})=>{snapshot.mode=state.mode??'empty';snapshot.updatedAt=state.updatedAt;synchronized=state.loaded;notify()});
  Promise.resolve(bridge.start()).catch(()=>{snapshot.mode='error';notify()});
}
// Wait for initial IPC replay/synchronization, not an arbitrary startup delay.
// An unavailable backend must never prevent a deliberate offline rehearsal.
export async function waitForCommunityRuntime(timeoutMs=4000):Promise<CommunityPreflightSnapshot>{
  startCommunityRuntime();
  if(!started)return getCommunityRuntimeSnapshot();
  const ready=()=>snapshot.mode==='error'||snapshot.mode==='offline-cache'||(snapshot.mode==='online'&&Object.values(synchronized??snapshot.loaded!).every(Boolean));
  if(!ready())await new Promise<void>(resolve=>{
    const finish=()=>{clearTimeout(timer);listeners.delete(check);resolve()};
    const check=()=>{if(ready())finish()};
    const timer=setTimeout(finish,timeoutMs);listeners.add(check);check();
  });
  return getCommunityRuntimeSnapshot();
}
export function setPostProgramPrepared(prepared:boolean){snapshot.postProgramPrepared=prepared}
export function getCommunityRuntimeSnapshot():CommunityPreflightSnapshot{return{...snapshot,events:[...snapshot.events],rooms:structuredClone(snapshot.rooms),announcements:[...snapshot.announcements],loaded:{...snapshot.loaded!}}}
