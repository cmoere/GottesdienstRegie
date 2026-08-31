import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktop', {
  displays: () => ipcRenderer.invoke('displays:list'),
  onDisplaysChanged: (callback:(displays:unknown)=>void) => {const listener=(_event:Electron.IpcRendererEvent,displays:unknown)=>callback(displays);ipcRenderer.on('displays:changed',listener);return()=>ipcRenderer.removeListener('displays:changed',listener)},
  goOnAir: (displayId: number,payload:unknown) => ipcRenderer.invoke('outputs:on-air', displayId,payload),
  goOffAir: () => ipcRenderer.invoke('outputs:off-air'),
  sendLiveSlide:(payload:unknown)=>ipcRenderer.invoke('outputs:send-slide',payload),
  onLiveSlide:(callback:(payload:unknown)=>void)=>{const listener=(_event:Electron.IpcRendererEvent,payload:unknown)=>callback(payload);ipcRenderer.on('outputs:slide',listener);return()=>ipcRenderer.removeListener('outputs:slide',listener)},
  presentation:{save:(document:unknown)=>ipcRenderer.invoke('presentation:save',document),load:()=>ipcRenderer.invoke('presentation:load')},
  session: {
    read: () => ipcRenderer.invoke('session:read'),
    write: (token: string) => ipcRenderer.invoke('session:write', token),
    clear: () => ipcRenderer.invoke('session:clear'),
  },
  auth: {
    login: (email:string, password:string, remember:boolean) => ipcRenderer.invoke('auth:login', {email,password,remember}),
    verifyTwoFactor: (challengeId:string, code:string, recovery:boolean) => ipcRenderer.invoke('auth:2fa:verify', {challengeId,code,recovery}),
    cancelTwoFactor: (challengeId:string) => ipcRenderer.invoke('auth:2fa:cancel', challengeId),
    restore: () => ipcRenderer.invoke('auth:restore'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    connection: () => ipcRenderer.invoke('auth:connection'),
  },
  updates: {
    currentVersion: () => ipcRenderer.invoke('updates:current-version'),
    metadata:()=>ipcRenderer.invoke('updates:metadata'),
    check: () => ipcRenderer.invoke('updates:check'),
    download: () => ipcRenderer.invoke('updates:download'),
    install: () => ipcRenderer.invoke('updates:install'),
    previous:()=>ipcRenderer.invoke('updates:previous'),
    rollback:()=>ipcRenderer.invoke('updates:rollback'),
    onStatus: (callback: (status: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status);
      ipcRenderer.on('updates:status', listener);
      return () => ipcRenderer.removeListener('updates:status', listener);
    },
  },
});
