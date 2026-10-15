import {normalizeRegionalSelection,type RegionalSettingsBridge} from '../../shared/regional/selection';
import type {RegionalSelection} from '../../shared/regional/catalog';

type SelectionStore={getState():RegionalSelection;subscribe(listener:()=>void):()=>void};
const identity=(selection:RegionalSelection)=>`${selection.language}:${selection.germanRegion??''}`;
/** Control-window metadata only. At most one IPC write is in flight; newer choices replace queued ones. */
export function startNativeSelectionSync(store:SelectionStore,bridge:Pick<RegionalSettingsBridge,'write'>,onError:(error:unknown)=>void=()=>{}){
  let stopped=false,running=false;
  let desired=normalizeRegionalSelection(store.getState());
  let observed=identity(desired);
  let queued:RegionalSelection|null=desired;
  async function flush(){
    if(running||stopped)return;
    running=true;
    try{
      while(!stopped&&queued){
        const selection=queued;queued=null;
        try{await bridge.write(selection)}catch(error){if(!stopped)onError(error)}
      }
    }finally{running=false}
  }
  const unsubscribe=store.subscribe(()=>{
    desired=normalizeRegionalSelection(store.getState());
    if(identity(desired)===observed)return;
    observed=identity(desired);queued=desired;void flush();
  });
  void flush();
  return()=>{stopped=true;queued=null;unsubscribe()};
}
