export type UpdateStatusApi={status:()=>Promise<DesktopUpdateStatus>;onStatus:(callback:(status:DesktopUpdateStatus)=>void)=>(()=>void)|undefined};

export function subscribeToUpdateStatus(updates:UpdateStatusApi,setStatus:(status:DesktopUpdateStatus)=>void){
  let active=true,receivedLiveStatus=false;
  const dispose=updates.onStatus(status=>{receivedLiveStatus=true;if(active)setStatus(status)});
  void updates.status().then(status=>{if(active&&!receivedLiveStatus)setStatus(status)}).catch(()=>{});
  return()=>{active=false;dispose?.()};
}
