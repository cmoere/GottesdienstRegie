import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktop', {
  displays: () => ipcRenderer.invoke('displays:list'),
  goOnAir: (displayId: number) => ipcRenderer.invoke('outputs:on-air', displayId),
  goOffAir: () => ipcRenderer.invoke('outputs:off-air'),
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
    check: () => ipcRenderer.invoke('updates:check'),
    download: () => ipcRenderer.invoke('updates:download'),
    install: () => ipcRenderer.invoke('updates:install'),
    onStatus: (callback: (status: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status);
      ipcRenderer.on('updates:status', listener);
      return () => ipcRenderer.removeListener('updates:status', listener);
    },
  },
});
