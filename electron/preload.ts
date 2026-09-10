import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  operator: {
    getPreferences: () => ipcRenderer.invoke("window-preferences:get"),
    setPreferences: (patch: unknown) =>
      ipcRenderer.invoke("window-preferences:set", patch),
    toggleFullscreen: () => ipcRenderer.invoke("window:toggle-fullscreen"),
  },
  displays: () => ipcRenderer.invoke("displays:list"),
  onDisplaysChanged: (callback: (displays: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, displays: unknown) =>
      callback(displays);
    ipcRenderer.on("displays:changed", listener);
    return () => ipcRenderer.removeListener("displays:changed", listener);
  },
  identifyDisplays: (assignments: Record<string, string>) =>
    ipcRenderer.invoke("displays:identify", assignments),
  preflight: (assignments: Record<string, string>, presentation: unknown) =>
    ipcRenderer.invoke("outputs:preflight", assignments, presentation),
  goOnAir: (assignments: Record<string, string>, payload: unknown) =>
    ipcRenderer.invoke("outputs:on-air", assignments, payload),
  goOffAir: () => ipcRenderer.invoke("outputs:off-air"),
  sendLiveSlide: (payload: unknown) =>
    ipcRenderer.invoke("outputs:send-slide", payload),
  sendOutputRole: (role: string, payload: unknown) =>
    ipcRenderer.invoke("outputs:send-role", role, payload),
  sendQuick: (roles: string[], payload: unknown) =>
    ipcRenderer.invoke("outputs:send-quick", roles, payload),
  onLiveSlide: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
      callback(payload);
    ipcRenderer.on("outputs:slide", listener);
    return () => ipcRenderer.removeListener("outputs:slide", listener);
  },
  onQuick: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
      callback(payload);
    ipcRenderer.on("outputs:quick", listener);
    return () => ipcRenderer.removeListener("outputs:quick", listener);
  },
  onOutputStatus: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
      callback(payload);
    ipcRenderer.on("outputs:status", listener);
    return () => ipcRenderer.removeListener("outputs:status", listener);
  },
  notifyMediaEnded: (behavior: string) =>
    ipcRenderer.send("outputs:media-ended", behavior),
  serviceContext: {
    open: (
      position: { x: number; y: number },
      entries: unknown[],
      theme?: "system" | "light" | "dark",
    ) => ipcRenderer.invoke("service-context:open", position, entries, theme),
    onCommand: (callback: (id: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, id: string) =>
        callback(id);
      ipcRenderer.on("service-context:command", listener);
      return () =>
        ipcRenderer.removeListener("service-context:command", listener);
    },
  },
  slideExport: {
    copy: (dataUrl: string) => ipcRenderer.invoke("slide-export:copy", dataUrl),
    save: (
      dataUrl: string,
      suggestedName: string,
      format: "png" | "jpeg" = "png",
    ) =>
      ipcRenderer.invoke("slide-export:save", dataUrl, suggestedName, format),
  },
  onMediaEnded: (callback: (behavior: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, behavior: string) =>
      callback(behavior);
    ipcRenderer.on("outputs:media-ended", listener);
    return () => ipcRenderer.removeListener("outputs:media-ended", listener);
  },
  presentation: {
    list: (options?: { archived?: boolean; trashed?: boolean }) =>
      ipcRenderer.invoke("presentation:list", options),
    create: (input: { title?: string; date?: string; template?: unknown }) =>
      ipcRenderer.invoke("presentation:create", input),
    save: (document: unknown) =>
      ipcRenderer.invoke("presentation:save", document),
    load: (id?: string) => ipcRenderer.invoke("presentation:load", id),
    duplicate: (
      id: string,
      options?: {
        title?: string;
        date?: string;
        keepServiceTime?: boolean;
        keepMediaReferences?: boolean;
        keepTargetStartTimes?: boolean;
      },
    ) => ipcRenderer.invoke("presentation:duplicate", id, options),
    rename: (id: string, title: string) =>
      ipcRenderer.invoke("presentation:rename", id, title),
    archive: (id: string, value: boolean) =>
      ipcRenderer.invoke("presentation:archive", id, value),
    trash: (id: string, value: boolean) =>
      ipcRenderer.invoke("presentation:trash", id, value),
    import: (kind: "office" | "text" | "gottesdienstregie" | "all" = "all") =>
      ipcRenderer.invoke("presentation:import", kind),
    export: (id: string) => ipcRenderer.invoke("presentation:export", id),
    backup: (id: string) => ipcRenderer.invoke("presentation:backup", id),
    recovery: () => ipcRenderer.invoke("presentation:recovery"),
    markClean: () => ipcRenderer.invoke("presentation:mark-clean"),
  },
  openExternal: (url: string) => ipcRenderer.invoke("external:open", url),
  media: {
    list: () => ipcRenderer.invoke("media:list"),
    import: (kind?: "audio" | "video") =>
      ipcRenderer.invoke("media:import", kind),
    update: (id: string, patch: unknown) =>
      ipcRenderer.invoke("media:update", id, patch),
    setRemoteFavorite: (asset: unknown, favorite: boolean) =>
      ipcRenderer.invoke("media:set-remote-favorite", asset, favorite),
    remove: (id: string) => ipcRenderer.invoke("media:remove", id),
    onlineStatus: () => ipcRenderer.invoke("media:online-status"),
    onlineList: () => ipcRenderer.invoke("media:online-list"),
    cloudList: () => ipcRenderer.invoke("media:cloud-list"),
    unsplashSearch: (query: string, accessKey: string, page?: number) =>
      ipcRenderer.invoke("media:unsplash-search", query, accessKey, page),
    legacyList: () => ipcRenderer.invoke("media:legacy-list"),
    sync: (id: string) => ipcRenderer.invoke("media:sync", id),
    cloudRemove: (id: string) => ipcRenderer.invoke("media:cloud-remove", id),
  },
  mediaWindow: {
    open: (
      context: "manage" | "select",
      purpose: "item" | "background" | "foreground" | "audio",
      targetType?: "section" | "serviceItem",
      targetId?: string,
    ) =>
      ipcRenderer.invoke(
        "media-window:open",
        context,
        purpose,
        targetType,
        targetId,
      ),
    close: () => ipcRenderer.invoke("media-window:close"),
    select: (asset: unknown, purpose: string) =>
      ipcRenderer.invoke("media-window:select", asset, purpose),
    selectAudio: (assets: unknown[], targetType: string, targetId: string) =>
      ipcRenderer.invoke(
        "media-window:select-audio",
        assets,
        targetType,
        targetId,
      ),
    onSelected: (callback: (payload: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
        callback(payload);
      ipcRenderer.on("media:selected", listener);
      return () => ipcRenderer.removeListener("media:selected", listener);
    },
    onContext: (callback: (payload: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
        callback(payload);
      ipcRenderer.on("media-window:context", listener);
      return () => ipcRenderer.removeListener("media-window:context", listener);
    },
  },
  historyWindow: {
    open: () => ipcRenderer.invoke("history-window:open"),
    close: () => ipcRenderer.invoke("history-window:close"),
  },
  session: {
    read: () => ipcRenderer.invoke("session:read"),
    write: (token: string) => ipcRenderer.invoke("session:write", token),
    clear: () => ipcRenderer.invoke("session:clear"),
  },
  auth: {
    login: (email: string, password: string, remember: boolean) =>
      ipcRenderer.invoke("auth:login", { email, password, remember }),
    verifyTwoFactor: (challengeId: string, code: string, recovery: boolean) =>
      ipcRenderer.invoke("auth:2fa:verify", { challengeId, code, recovery }),
    cancelTwoFactor: (challengeId: string) =>
      ipcRenderer.invoke("auth:2fa:cancel", challengeId),
    restore: (activeSession = false) =>
      ipcRenderer.invoke("auth:restore", activeSession),
    logout: () => ipcRenderer.invoke("auth:logout"),
    connection: () => ipcRenderer.invoke("auth:connection"),
  },
  device: {
    get: () => ipcRenderer.invoke("device:get"),
    register: (input: unknown) => ipcRenderer.invoke("device:register", input),
  },
  remote: {
    get: () => ipcRenderer.invoke("remote:get"),
    saveMonitor: (monitor: unknown) =>
      ipcRenderer.invoke("remote:save-monitor", monitor),
    removeMonitor: (id: string) =>
      ipcRenderer.invoke("remote:remove-monitor", id),
    createSession: (input: unknown) =>
      ipcRenderer.invoke("remote:create-session", input),
    revokeSession: (id: string) =>
      ipcRenderer.invoke("remote:revoke-session", id),
    updateLive: (state: unknown) =>
      ipcRenderer.invoke("remote:update-live", state),
    onCommand: (callback: (payload: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
        callback(payload);
      ipcRenderer.on("remote:command", listener);
      return () => ipcRenderer.removeListener("remote:command", listener);
    },
  },
  updates: {
    currentVersion: () => ipcRenderer.invoke("updates:current-version"),
    metadata: () => ipcRenderer.invoke("updates:metadata"),
    check: () => ipcRenderer.invoke("updates:check"),
    download: () => ipcRenderer.invoke("updates:download"),
    cancelDownload: () => ipcRenderer.invoke("updates:cancel-download"),
    install: () => ipcRenderer.invoke("updates:install"),
    previous: () => ipcRenderer.invoke("updates:previous"),
    rollback: () => ipcRenderer.invoke("updates:rollback"),
    onStatus: (callback: (status: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: unknown) =>
        callback(status);
      ipcRenderer.on("updates:status", listener);
      return () => ipcRenderer.removeListener("updates:status", listener);
    },
  },
});
