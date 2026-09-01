import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktop', {
  operator:{getPreferences:()=>ipcRenderer.invoke('window-preferences:get'),setPreferences:(patch:unknown)=>ipcRenderer.invoke('window-preferences:set',patch),toggleFullscreen:()=>ipcRenderer.invoke('window:toggle-fullscreen')},
  displays: () => ipcRenderer.invoke('displays:list'),
  onDisplaysChanged: (callback:(displays:unknown)=>void) => {const listener=(_event:Electron.IpcRendererEvent,displays:unknown)=>callback(displays);ipcRenderer.on('displays:changed',listener);return()=>ipcRenderer.removeListener('displays:changed',listener)},
  identifyDisplays:(assignments:Record<string,string>)=>ipcRenderer.invoke('displays:identify',assignments),
  preflight:(assignments:Record<string,string>,presentation:unknown)=>ipcRenderer.invoke('outputs:preflight',assignments,presentation),
  goOnAir: (assignments:Record<string,string>,payload:unknown) => ipcRenderer.invoke('outputs:on-air',assignments,payload),
  goOffAir: () => ipcRenderer.invoke('outputs:off-air'),
  sendLiveSlide:(payload:unknown)=>ipcRenderer.invoke('outputs:send-slide',payload),
  sendOutputRole:(role:string,payload:unknown)=>ipcRenderer.invoke('outputs:send-role',role,payload),
  sendQuick:(roles:string[],payload:unknown)=>ipcRenderer.invoke('outputs:send-quick',roles,payload),
  onLiveSlide:(callback:(payload:unknown)=>void)=>{const listener=(_event:Electron.IpcRendererEvent,payload:unknown)=>callback(payload);ipcRenderer.on('outputs:slide',listener);return()=>ipcRenderer.removeListener('outputs:slide',listener)},
  onQuick:(callback:(payload:unknown)=>void)=>{const listener=(_event:Electron.IpcRendererEvent,payload:unknown)=>callback(payload);ipcRenderer.on('outputs:quick',listener);return()=>ipcRenderer.removeListener('outputs:quick',listener)},
  onOutputStatus:(callback:(payload:unknown)=>void)=>{const listener=(_event:Electron.IpcRendererEvent,payload:unknown)=>callback(payload);ipcRenderer.on('outputs:status',listener);return()=>ipcRenderer.removeListener('outputs:status',listener)},
  notifyMediaEnded:(behavior:string)=>ipcRenderer.send('outputs:media-ended',behavior),
  onMediaEnded:(callback:(behavior:string)=>void)=>{const listener=(_event:Electron.IpcRendererEvent,behavior:string)=>callback(behavior);ipcRenderer.on('outputs:media-ended',listener);return()=>ipcRenderer.removeListener('outputs:media-ended',listener)},
  presentation:{
    list:(options?:{archived?:boolean;trashed?:boolean})=>ipcRenderer.invoke('presentation:list',options),
    create:(input:{title?:string;date?:string;template?:unknown})=>ipcRenderer.invoke('presentation:create',input),
    save:(document:unknown)=>ipcRenderer.invoke('presentation:save',document),
    load:(id?:string)=>ipcRenderer.invoke('presentation:load',id),
    duplicate:(id:string)=>ipcRenderer.invoke('presentation:duplicate',id),rename:(id:string,title:string)=>ipcRenderer.invoke('presentation:rename',id,title),
    archive:(id:string,value:boolean)=>ipcRenderer.invoke('presentation:archive',id,value),trash:(id:string,value:boolean)=>ipcRenderer.invoke('presentation:trash',id,value),
    import:()=>ipcRenderer.invoke('presentation:import'),export:(id:string)=>ipcRenderer.invoke('presentation:export',id),backup:(id:string)=>ipcRenderer.invoke('presentation:backup',id),
    recovery:()=>ipcRenderer.invoke('presentation:recovery'),markClean:()=>ipcRenderer.invoke('presentation:mark-clean')
  },
  openExternal:(url:string)=>ipcRenderer.invoke('external:open',url),
  media:{list:()=>ipcRenderer.invoke('media:list'),import:()=>ipcRenderer.invoke('media:import'),update:(id:string,patch:unknown)=>ipcRenderer.invoke('media:update',id,patch),remove:(id:string)=>ipcRenderer.invoke('media:remove',id),onlineStatus:()=>ipcRenderer.invoke('media:online-status'),onlineList:()=>ipcRenderer.invoke('media:online-list'),sync:(id:string)=>ipcRenderer.invoke('media:sync',id)},
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
