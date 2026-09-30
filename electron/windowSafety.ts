type SendableContents={isDestroyed():boolean;send(channel:string,...args:unknown[]):void};
type SendableWindow={isDestroyed():boolean;readonly webContents:SendableContents};

/** Sends only while both Electron wrappers are still alive; shutdown can invalidate either between async callbacks. */
export function sendToLiveWindow(window:SendableWindow|null|undefined,channel:string,...args:unknown[]):boolean{
  try{
    if(!window||window.isDestroyed())return false;
    const contents=window.webContents;
    if(contents.isDestroyed())return false;
    contents.send(channel,...args);
    return true;
  }catch(error){
    if(error instanceof Error&&/object has been destroyed/i.test(error.message))return false;
    throw error;
  }
}
