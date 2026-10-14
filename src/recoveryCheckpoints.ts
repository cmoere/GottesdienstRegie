type CheckpointState={presentationId:string;updatedAt:string;saveState:string};
export function startRecoveryCheckpoints<T extends CheckpointState>(subscribe:(listener:()=>void)=>()=>void,read:()=>T,save:(state:T)=>Promise<unknown>,onError:()=>void=()=>{}){
 let quiet:ReturnType<typeof setTimeout>|undefined,deadline:ReturnType<typeof setTimeout>|undefined,last='',stopped=false;
 const flush=()=>{
  clearTimeout(quiet);clearTimeout(deadline);quiet=deadline=undefined;
  const state=read(),key=state.presentationId+':'+state.updatedAt;
  if(stopped||!state.presentationId||state.saveState!=='dirty'||key===last)return;
  last=key;void save(state).catch(()=>{if(last===key)last='';onError()});
 };
 const changed=()=>{
  const state=read();if(stopped||!state.presentationId||state.saveState!=='dirty'||state.presentationId+':'+state.updatedAt===last)return;
  clearTimeout(quiet);quiet=setTimeout(flush,750);deadline??=setTimeout(flush,5000);
 };
 const stop=subscribe(changed);changed();
 return()=>{stopped=true;stop();clearTimeout(quiet);clearTimeout(deadline)};
}
