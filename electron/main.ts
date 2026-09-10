import { app, BrowserWindow, ipcMain, screen, safeStorage, Menu, shell, dialog, protocol, net, clipboard, nativeImage, nativeTheme, type MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { createHash, createHmac, pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { compare as bcryptCompare } from 'bcryptjs';
import { autoUpdater, type UpdateInfo } from 'electron-updater';
import { CancellationToken } from 'builder-util-runtime';
import { DisplayManager, type DisplayAssignments, type OutputRole } from './DisplayManager';
import { OutputWindowManager } from './OutputWindowManager';
import { PresentationRepository, type DuplicatePresentationOptions } from './PresentationRepository';
import { MediaRepository } from './MediaRepository';
import { GitHubStorageProvider } from './storage/GitHubStorageProvider';
import { AppPreferences, type AppPreferencesData } from './AppPreferences';
import { RemoteServer } from './RemoteServer';

let controlWindow: BrowserWindow | null = null;
let mediaWindow: BrowserWindow | null = null;
let historyWindow: BrowserWindow | null = null;
let appPreferences:AppPreferences;
let controlCloseInProgress=false;
let stopPresentationOutputs:()=>Promise<boolean>=async()=>true;
protocol.registerSchemesAsPrivileged([{scheme:'gottesdienst-media',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}},{scheme:'gottesdienst-cloud',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
const rendererUrl = process.env.VITE_DEV_SERVER_URL;

type UpdateStatus={state:'idle'|'checking'|'available'|'not-available'|'downloading'|'cancelled'|'downloaded'|'rollback-downloading'|'rollback-ready'|'error'|'development';version?:string;percent?:number;releaseNotes?:string;message?:string;transferred?:number;total?:number;bytesPerSecond?:number;etaSeconds?:number};
let lastUpdateStatus:UpdateStatus={state:'idle'};
let updateCancellationToken:CancellationToken|null=null;
let pendingUpdateVersion='';
function releaseNotes(info:UpdateInfo){
  if(typeof info.releaseNotes==='string')return info.releaseNotes;
  if(Array.isArray(info.releaseNotes))return info.releaseNotes.map(note=>typeof note==='string'?note:note.note).filter(Boolean).join('\n\n');
  return '';
}
function publishUpdateStatus(status:UpdateStatus){
  lastUpdateStatus=status;
  if(controlWindow&&!controlWindow.isDestroyed())controlWindow.webContents.send('updates:status',status);
  return status;
}

autoUpdater.autoDownload=false;
autoUpdater.autoInstallOnAppQuit=true;
autoUpdater.on('checking-for-update',()=>publishUpdateStatus({state:'checking'}));
autoUpdater.on('update-available',info=>{pendingUpdateVersion=info.version;publishUpdateStatus({state:'available',version:info.version,releaseNotes:releaseNotes(info)})});
autoUpdater.on('update-not-available',info=>{pendingUpdateVersion='';publishUpdateStatus({state:'not-available',version:info.version})});
let smoothedDownloadSpeed=0;
autoUpdater.on('download-progress',progress=>{const speed=Math.max(0,progress.bytesPerSecond||0);smoothedDownloadSpeed=smoothedDownloadSpeed?smoothedDownloadSpeed*.72+speed*.28:speed;const remaining=Math.max(0,progress.total-progress.transferred),etaSeconds=smoothedDownloadSpeed>0&&progress.percent>=3?Math.round(remaining/smoothedDownloadSpeed):undefined;publishUpdateStatus({state:'downloading',version:pendingUpdateVersion,percent:Math.round(progress.percent),transferred:progress.transferred,total:progress.total,bytesPerSecond:Math.round(smoothedDownloadSpeed),etaSeconds})});
autoUpdater.on('update-downloaded',info=>{updateCancellationToken=null;publishUpdateStatus({state:'downloaded',version:info.version,releaseNotes:releaseNotes(info)})});
autoUpdater.on('error',error=>{if(updateCancellationToken?.cancelled)return;publishUpdateStatus({state:'error',message:error.message})});

async function checkForUpdates(){
  if(!app.isPackaged)return publishUpdateStatus({state:'development',version:app.getVersion()});
  try{autoUpdater.allowPrerelease=appPreferences.get().betaUpdates;await autoUpdater.checkForUpdates();return lastUpdateStatus}catch(error){return publishUpdateStatus({state:'error',message:error instanceof Error?error.message:String(error)})}
}

function load(win: BrowserWindow, route = '') {
  if (rendererUrl) return win.loadURL(`${rendererUrl}${route}`);
  return win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: route.replace(/^#/, '') });
}

function createControlWindow(preferences:AppPreferencesData) {
  const displays=screen.getAllDisplays(),primary=screen.getPrimaryDisplay();
  const remembered=preferences.operatorDisplayTarget==='last'?displays.find(display=>display.id===preferences.lastDisplayId):undefined;
  const target=remembered??primary,stored=preferences.bounds;
  const visible=stored&&displays.some(display=>stored.x<display.bounds.x+display.bounds.width&&stored.x+stored.width>display.bounds.x&&stored.y<display.bounds.y+display.bounds.height&&stored.y+stored.height>display.bounds.y);
  const bounds=visible?stored!:{x:target.workArea.x+Math.round(target.workArea.width*.05),y:target.workArea.y+Math.round(target.workArea.height*.05),width:Math.max(960,Math.round(target.workArea.width*.9)),height:Math.max(620,Math.round(target.workArea.height*.9))};
  controlWindow = new BrowserWindow({
    ...bounds,show:false,minWidth: 960, minHeight: 620,
    backgroundColor: '#282832', icon: app.isPackaged ? path.join(process.resourcesPath, 'icon.png') : path.join(app.getAppPath(), 'build/icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  controlWindow.setMenu(null);
  const configured=preferences.windowStartMode==='restore'?(preferences.lastWindowState??'fullscreen'):preferences.windowStartMode;
  if(configured==='fullscreen')controlWindow.setFullScreen(true);else if(configured==='maximized')controlWindow.maximize();
  controlWindow.once('ready-to-show',()=>controlWindow?.show());
  let saveTimer:NodeJS.Timeout|undefined;
  const saveWindowState=()=>{if(!controlWindow||controlWindow.isDestroyed())return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(!controlWindow||controlWindow.isDestroyed())return;const state=controlWindow.isFullScreen()?'fullscreen':controlWindow.isMaximized()?'maximized':'window',display=screen.getDisplayMatching(controlWindow.getBounds()),patch:Partial<AppPreferencesData>={lastWindowState:state,lastDisplayId:display.id};if(state==='window')patch.bounds=controlWindow.getBounds();void appPreferences.update(patch)},250)};
  controlWindow.on('move',saveWindowState);controlWindow.on('resize',saveWindowState);controlWindow.on('maximize',saveWindowState);controlWindow.on('unmaximize',saveWindowState);controlWindow.on('enter-full-screen',saveWindowState);controlWindow.on('leave-full-screen',saveWindowState);
  controlWindow.webContents.on('before-input-event',(event,input)=>{if((input.control||input.meta)&&['+','=','-','0'].includes(input.key)){event.preventDefault();controlWindow?.webContents.setZoomFactor(1)}});
  controlWindow.on('close',event=>{
    if(controlCloseInProgress)return;
    event.preventDefault();
    controlCloseInProgress=true;
    const closingWindow=controlWindow;
    void stopPresentationOutputs().finally(()=>{
      controlWindow=null;
      if(closingWindow&&!closingWindow.isDestroyed())closingWindow.destroy();
      app.quit();
    });
  });
  void load(controlWindow);
  controlWindow.webContents.once('did-finish-load',()=>{controlWindow?.webContents.setZoomFactor(1);void controlWindow?.webContents.setVisualZoomLevelLimits(1,1);if(appPreferences.get().automaticUpdates)setTimeout(()=>void checkForUpdates(),5000)});
}

function openMediaWindow(context:'manage'|'select'='manage',purpose:'item'|'background'|'audio'='item',targetType?:'section'|'serviceItem',targetId?:string){
  if(mediaWindow&&!mediaWindow.isDestroyed()){mediaWindow.setTitle(purpose==='audio'?'GottesdienstRegie - Audiobrowser':'GottesdienstRegie - Medienbibliothek');mediaWindow.focus();mediaWindow.webContents.send('media-window:context',{context,purpose,targetType,targetId});return true}
  const saved=appPreferences.get(),fallback={width:1400,height:850},bounds=saved.mediaBounds??fallback;
  mediaWindow=new BrowserWindow({...bounds,show:false,minWidth:900,minHeight:600,resizable:true,minimizable:true,maximizable:true,closable:true,skipTaskbar:false,alwaysOnTop:false,backgroundColor:'#f4f7f8',title:purpose==='audio'?'GottesdienstRegie - Audiobrowser':'GottesdienstRegie - Medienbibliothek',icon:app.isPackaged?path.join(process.resourcesPath,'icon.png'):path.join(app.getAppPath(),'build/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
  mediaWindow.setMenu(null);if(saved.mediaMaximized)mediaWindow.maximize();
  const save=()=>{if(!mediaWindow||mediaWindow.isDestroyed())return;const patch:Partial<AppPreferencesData>={mediaMaximized:mediaWindow.isMaximized()};if(!mediaWindow.isMaximized())patch.mediaBounds=mediaWindow.getBounds();void appPreferences.update(patch)};
  mediaWindow.on('move',save);mediaWindow.on('resize',save);mediaWindow.on('maximize',save);mediaWindow.on('unmaximize',save);mediaWindow.on('closed',()=>{mediaWindow=null});
  mediaWindow.once('ready-to-show',()=>mediaWindow?.show());void load(mediaWindow,`#media?context=${context}&purpose=${purpose}&targetType=${targetType??''}&targetId=${encodeURIComponent(targetId??'')}`);return true
}

function openHistoryWindow(){
  if(historyWindow&&!historyWindow.isDestroyed()){historyWindow.focus();return true}
  historyWindow=new BrowserWindow({width:1200,height:760,minWidth:900,minHeight:600,show:false,resizable:true,minimizable:true,maximizable:true,closable:true,skipTaskbar:false,backgroundColor:'#eef3f4',title:'GottesdienstRegie - Änderungshistorie',icon:app.isPackaged?path.join(process.resourcesPath,'icon.png'):path.join(app.getAppPath(),'build/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
  historyWindow.setMenu(null);historyWindow.on('closed',()=>{historyWindow=null});historyWindow.once('ready-to-show',()=>historyWindow?.show());void load(historyWindow,'#history');return true
}

function versionParts(value:string){return value.replace(/^v/,'').split('.').map(part=>Number(part)||0)}
function olderThan(candidate:string,current:string){const a=versionParts(candidate),b=versionParts(current);for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]??0)<(b[i]??0))return true;if((a[i]??0)>(b[i]??0))return false}return false}

app.whenReady().then(async() => {
  Menu.setApplicationMenu(null);
  appPreferences=new AppPreferences(path.join(app.getPath('userData'),'app-preferences.json'));
  const initialPreferences=await appPreferences.load();
  autoUpdater.autoDownload=initialPreferences.autoDownloadUpdates;
  autoUpdater.allowPrerelease=initialPreferences.betaUpdates;
  const displayManager=new DisplayManager();
  const publishOutputStatus=(role:OutputRole,state:'ready'|'missing'|'closed')=>{if(controlWindow&&!controlWindow.isDestroyed())controlWindow.webContents.send('outputs:status',{role,state})};
  const outputManager=new OutputWindowManager(path.join(__dirname,'preload.js'),load,publishOutputStatus);
  stopPresentationOutputs=()=>outputManager.stop();
  const sessionFile = path.join(app.getPath('userData'), 'community-session.bin');
  const legacyPresentationFile=path.join(app.getPath('userData'),'presentations','default-presentation.json');
  const presentationRepository=new PresentationRepository(path.join(app.getPath('userData'),'library'));
  const mediaRepository=new MediaRepository(path.join(app.getPath('userData'),'media-library'));
  const remoteServer=new RemoteServer(path.join(app.getPath('userData'),'remote-devices.json'),payload=>controlWindow?.webContents.send('remote:command',payload));
  await remoteServer.start().catch(()=>null);
  const onlineMedia=new GitHubStorageProvider('cmoere','GottesdienstRegie','media-library');
  void presentationRepository.initialize();
  void mediaRepository.initialize();
  protocol.handle('gottesdienst-media',request=>{const url=new URL(request.url),fileName=path.basename(decodeURIComponent(url.pathname));return net.fetch(pathToFileURL(path.join(mediaRepository.directory,fileName)).toString())});
  protocol.handle('gottesdienst-cloud',async request=>{const url=new URL(request.url),remotePath=decodeURIComponent(url.pathname.replace(/^\//,'')),extension=path.extname(remotePath).toLowerCase(),mime:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4','.aac':'audio/aac','.flac':'audio/flac','.ogg':'audio/ogg','.pdf':'application/pdf'};try{return new Response(await onlineMedia.download(remotePath),{status:200,headers:{'content-type':mime[extension]??'application/octet-stream','cache-control':'private, max-age=3600'}})}catch{return new Response('Medium nicht verfügbar.',{status:404,headers:{'content-type':'text/plain; charset=utf-8'}})}});
  const databaseUrl = 'https://philippusgemeindebie-default-rtdb.europe-west1.firebasedatabase.app';
  const gasUrl = 'https://script.google.com/macros/s/AKfycbxU-k7Ch6bHRnOWUp8SxM7bCQ7GBZe_OyDnnegBB2DxwX928--9caHi3Elwc38XABxz/exec';
  const servicePermissionKeys=['presentationView','presentationCreate','presentationEdit','presentationDelete','presentationLive','previewUse','quickScreensUse','stageMessagesUse','bibleUse','songsEdit','mediaUpload','mediaDelete','recordingManage','outputSettings','appSettings'];
  const rolePermissions:Record<string,string[]>={viewer:['presentationView','previewUse'],presenter:['presentationView','presentationLive','previewUse','quickScreensUse','stageMessagesUse','bibleUse'],editor:['presentationView','presentationLive','previewUse','quickScreensUse','stageMessagesUse','bibleUse','presentationCreate','presentationEdit','songsEdit','mediaUpload'],admin:servicePermissionKeys};
  const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
  const decoded=(value:string)=>/^[0-9a-f]+$/i.test(value)&&value.length%2===0?Buffer.from(value,'hex'):Buffer.from(value,'base64');
  async function verifyPassword(password:string,user:any){
    const security=user?.security??{};
    if(security.passwordSalt&&security.passwordHash){const actual=pbkdf2Sync(password,Buffer.from(String(security.passwordSalt),'base64'),150000,32,'sha256').toString('hex');return same(actual,String(security.passwordHash))}
    const algo=String(user.passwordAlgo??'').toLowerCase().replace(/[-_\s]/g,''),hash=String(user.passwordHash??''),salt=String(user.passwordSalt??'');
    if(!hash) return typeof user.password==='string'&&same(password,user.password);
    if(algo.includes('bcrypt')||hash.startsWith('$2'))return bcryptCompare(password,hash);
    if(algo.includes('pbkdf2')){const digest=algo.includes('sha512')?'sha512':'sha256',iterations=Number(user.passwordIterations??user.iterations??100000),expected=decoded(hash);return timingSafeEqual(pbkdf2Sync(password,salt,iterations,expected.length,digest),expected)}
    if(algo.includes('scrypt')){const expected=decoded(hash);return timingSafeEqual(scryptSync(password,salt,expected.length),expected)}
    if(algo==='sha256'||algo==='sha512'){const withPrefix=createHash(algo).update(`${salt}${password}`).digest('hex'),withSuffix=createHash(algo).update(`${password}${salt}`).digest('hex');return same(withPrefix,hash)||same(withSuffix,hash)}
    if(algo==='hmacsha256')return same(createHmac('sha256',salt).update(password).digest('hex'),hash);
    throw new Error('UNSUPPORTED_PASSWORD_ALGORITHM');
  }
  async function gasRequest(params:Record<string,string>){const callback=`desktop_${Date.now()}_${randomBytes(4).toString('hex')}`,url=new URL(gasUrl);Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value));url.searchParams.set('callback',callback);let response:Response;try{response=await fetch(url,{signal:AbortSignal.timeout(15000)})}catch{throw new Error('GAS_NETWORK')}if(!response.ok)throw new Error('GAS_NETWORK');const text=await response.text(),prefix=`${callback}(`;if(!text.startsWith(prefix))throw new Error('GAS_RESPONSE_INVALID');const json=text.slice(prefix.length).replace(/\);?\s*$/,'');try{return JSON.parse(json)}catch{throw new Error('GAS_RESPONSE_INVALID')}}
  function serviceAccessFrom(value:any){
    const candidates=[
      value?.appAccess?.gottesdienstRegie,
      value?.userData?.appAccess?.gottesdienstRegie,
      value?.gottesdienstRegie
    ];
    return candidates.find(candidate=>candidate&&typeof candidate==='object')??null;
  }
  function normalizedAccess(user:any){const raw=serviceAccessFrom(user)??{},role=['viewer','presenter','editor','admin'].includes(raw.role)?raw.role:'viewer',defaults=rolePermissions[role]??rolePermissions.viewer,source=raw.permissions??{},aliases:Record<string,string[]>={quickScreensUse:['quickScreensUse','quickScreens'],stageMessagesUse:['stageMessagesUse','stageMessages'],outputSettings:['outputSettings','outputsEdit'],appSettings:['appSettings','settingsEdit']};const permissions=Object.fromEntries(servicePermissionKeys.map(key=>{const candidates=aliases[key]??[key],stored=candidates.map(name=>source[name]).find(value=>typeof value==='boolean');return [key,typeof stored==='boolean'?stored:defaults.includes(key)]}));return {enabled:raw.enabled===true,authMode:raw.authMode==='sso'?'sso':'sso',role,teamId:typeof raw.teamId==='string'?raw.teamId:'',permissions}}
  async function userWithCurrentServiceAccess(uid:string,user:any){
    const loginServiceHasAccess=serviceAccessFrom(user)!==null;
    try{
      const response=await fetch(`${databaseUrl}/users/${encodeURIComponent(uid)}/appAccess/gottesdienstRegie.json`,{signal:AbortSignal.timeout(8000),cache:'no-store'});
      if(response.ok){
        const currentAccess=await response.json();
        const appAccess=user?.appAccess&&typeof user.appAccess==='object'?user.appAccess:{};
        return {user:{...user,appAccess:{...appAccess,gottesdienstRegie:currentAccess??{enabled:false}}},accessResolved:true};
      }
    }catch{}
    return {user,accessResolved:loginServiceHasAccess};
  }
  const safeUser=(uid:string,user:any)=>{const profile=user.profile??{},settings=user.settings??{};return {uid,email:profile.email??user.email??'',firstname:profile.firstName??user.firstname??'',lastName:profile.lastName??user.lastName??'',phone:profile.phone??user.phone??'',role:user.role??'user',profile:{firstName:profile.firstName??'',lastName:profile.lastName??'',photoUrl:profile.photoUrl??'',emailVerified:profile.emailVerified===true},settings,darkmode:settings.darkmode??user.darkmode,verification:user.verification,appAccess:{gottesdienstRegie:normalizedAccess(user)}}};
  async function readStored(){try{if(!safeStorage.isEncryptionAvailable())return null;return JSON.parse(safeStorage.decryptString(await fs.readFile(sessionFile)))}catch{return null}}
  async function saveStored(value:unknown){if(!safeStorage.isEncryptionAvailable())throw new Error('SECURE_STORAGE_UNAVAILABLE');await fs.writeFile(sessionFile,safeStorage.encryptString(JSON.stringify(value)))}
  type PendingLogin={uid:string;user:any;access:ReturnType<typeof normalizedAccess>;passwordHashProof:string;remember:boolean;expiresAt:number};
  const pendingLogins=new Map<string,PendingLogin>();
  function prunePendingLogins(){const now=Date.now();for(const [id,pending] of pendingLogins){if(pending.expiresAt<=now)pendingLogins.delete(id)}}
  async function createAuthenticatedSession(pending:PendingLogin,challengeId:string){
    const sessionResult=await gasRequest({action:'user_login_session_create',userId:pending.uid,passwordHashProof:pending.passwordHashProof,challengeId,rememberMe:pending.remember?'yes':'no',deviceName:'Windows-PC',browser:'GottesdienstRegie',platform:process.platform,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,userAgent:`GottesdienstRegie/${app.getVersion()}`,signature:`Windows-PC|GottesdienstRegie|${process.platform}`});
    if(sessionResult?.ok!==true||!sessionResult.sessionId)throw new Error(`SESSION_CREATE_FAILED:${String(sessionResult?.error??'unbekannt')}`);
    const now=Date.now(),expiresAt=Number(sessionResult?.sessionData?.expiresAt??(now+(pending.remember?30*86400_000:12*3600_000))),sessionId=String(sessionResult.sessionId),profile=safeUser(pending.uid,pending.user),session={user:profile,permissions:Object.entries(pending.access.permissions).filter(([,enabled])=>enabled).map(([key])=>key),expiresAt,sessionId,serverSession:true};
    await saveStored(session);
    return {user:session.user,permissions:session.permissions,expiresAt};
  }
  ipcMain.handle('window-preferences:get',()=>appPreferences.get());
  ipcMain.handle('window-preferences:set',async(_event,patch:Partial<AppPreferencesData>)=>{const allowed:Partial<AppPreferencesData>={};if(['fullscreen','maximized','window','restore'].includes(String(patch.windowStartMode)))allowed.windowStartMode=patch.windowStartMode;if(['primary','last'].includes(String(patch.operatorDisplayTarget)))allowed.operatorDisplayTarget=patch.operatorDisplayTarget;if(typeof patch.automaticUpdates==='boolean')allowed.automaticUpdates=patch.automaticUpdates;if(typeof patch.autoDownloadUpdates==='boolean'){allowed.autoDownloadUpdates=patch.autoDownloadUpdates;autoUpdater.autoDownload=patch.autoDownloadUpdates}if(typeof patch.betaUpdates==='boolean'){allowed.betaUpdates=patch.betaUpdates;autoUpdater.allowPrerelease=patch.betaUpdates}if(typeof patch.betaWarningAccepted==='boolean')allowed.betaWarningAccepted=patch.betaWarningAccepted;return appPreferences.update(allowed)});
  ipcMain.handle('window:toggle-fullscreen',()=>{if(!controlWindow)return false;controlWindow.setFullScreen(!controlWindow.isFullScreen());return controlWindow.isFullScreen()});
  ipcMain.handle('device:get',()=>appPreferences.get().registeredDevice??null);
  ipcMain.handle('device:register',async(_event,input:{organizationName:string;name:string;type:'shared'|'personal'})=>{const now=new Date().toISOString(),device={id:`church_${randomBytes(9).toString('hex')}`,organizationId:'philippusgemeindebie',organizationName:String(input.organizationName??'').trim().slice(0,120),name:String(input.name??'').trim().slice(0,80),type:input.type==='personal'?'personal' as const:'shared' as const,platform:`${process.platform} ${process.getSystemVersion()}`,registeredAt:now,lastSeenAt:now,status:'online' as const};if(!device.organizationName||!device.name)throw new Error('Organisation und Gerätename sind erforderlich.');await appPreferences.update({registeredDevice:device});return device});
  ipcMain.handle('session:read', async () => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return null;
      return safeStorage.decryptString(await fs.readFile(sessionFile));
    } catch { return null; }
  });
  ipcMain.handle('session:write', async (_event, token: string) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Sichere Tokenspeicherung ist auf diesem System nicht verfügbar.');
    await fs.writeFile(sessionFile, safeStorage.encryptString(token)); return true;
  });
  ipcMain.handle('session:clear', async () => { try { await fs.unlink(sessionFile); } catch {} return true; });
  ipcMain.handle('auth:login',async(_event,input:{email:string;password:string;remember:boolean})=>{
    prunePendingLogins();
    const email=String(input.email??'').trim().toLowerCase(),password=String(input.password??'');if(!email||!password)throw new Error('INVALID_CREDENTIALS');
    const resolved=await gasRequest({action:'user_login_resolve',login:email});if(resolved?.code==='LOGIN_DISABLED')throw new Error('DISABLED');if(resolved?.ok!==true||!resolved.userId||!resolved.userData)throw new Error('INVALID_CREDENTIALS');const uid=String(resolved.userId),resolvedUser=resolved.userData,profileData=resolvedUser.profile??{},security=resolvedUser.security??{};if(profileData.emailVerified!==true)throw new Error('EMAIL_NOT_VERIFIED');if(Number(security.lockUntil??0)>Date.now())throw new Error('ACCOUNT_LOCKED');if(!await verifyPassword(password,resolvedUser)){await gasRequest({action:'user_login_failed',userId:uid}).catch(()=>{});throw new Error('INVALID_CREDENTIALS')}if(security.mustChangePassword===true)throw new Error('INITIAL_PASSWORD_CHANGE_REQUIRED');const current=await userWithCurrentServiceAccess(uid,resolvedUser),user=current.user;if(!current.accessResolved)throw new Error('SERVICE_ACCESS_UNAVAILABLE');const access=normalizedAccess(user);if(!access.enabled)throw new Error('NO_SERVICE_ACCESS');
    const passwordHashProof=String(security.passwordHash??''),pending:PendingLogin={uid,user,access,passwordHashProof,remember:input.remember,expiresAt:Date.now()+5*60_000};
    const twoFactor=await gasRequest({action:'user_login_2fa_start',userId:uid,passwordHashProof});
    if(twoFactor?.ok!==true)throw new Error(`TWO_FACTOR_ERROR:${String(twoFactor?.error??'unbekannt')}`);
    if(twoFactor.required===true){
      const challengeId=String(twoFactor.challengeId??'');
      if(!challengeId)throw new Error('TWO_FACTOR_COOLDOWN');
      pendingLogins.set(challengeId,pending);
      return {twoFactorRequired:true,challengeId,method:String(twoFactor.method??'email'),destination:String(twoFactor.destination??''),expiresAt:pending.expiresAt};
    }
    return createAuthenticatedSession(pending,'');
  });
  ipcMain.handle('auth:2fa:verify',async(_event,input:{challengeId:string;code:string;recovery:boolean})=>{
    prunePendingLogins();
    const challengeId=String(input.challengeId??''),pending=pendingLogins.get(challengeId);
    if(!pending)throw new Error('TWO_FACTOR_EXPIRED');
    const raw=String(input.code??'').trim();
    const result=input.recovery
      ?await gasRequest({action:'user_login_recovery_verify',userId:pending.uid,challengeId,recoveryCode:raw})
      :await gasRequest({action:'user_login_2fa_verify',userId:pending.uid,challengeId,code:raw.replace(/\D/g,'')});
    if(result?.ok!==true){
      const detail=String(result?.error??'Der Code ist nicht korrekt.');
      if(/abgelaufen|fehlversuche/i.test(detail))pendingLogins.delete(challengeId);
      throw new Error(`TWO_FACTOR_INVALID:${detail}`);
    }
    try{return await createAuthenticatedSession(pending,challengeId)}finally{pendingLogins.delete(challengeId)}
  });
  ipcMain.handle('auth:2fa:cancel',async(_event,challengeId:string)=>{pendingLogins.delete(String(challengeId??''));return true});
  ipcMain.handle('auth:restore',async(_event,activeSession=false)=>{if(appPreferences.get().registeredDevice?.type==='shared'&&!activeSession){try{await fs.unlink(sessionFile)}catch{}return null}const stored=await readStored();if(!stored||Number(stored.expiresAt??0)<Date.now()){try{await fs.unlink(sessionFile)}catch{}return null}try{const [sessionResponse,userResponse]=await Promise.all([fetch(`${databaseUrl}/users/${encodeURIComponent(stored.user.uid)}/sessions/${encodeURIComponent(stored.sessionId)}.json`,{signal:AbortSignal.timeout(8000),cache:'no-store'}),fetch(`${databaseUrl}/users/${encodeURIComponent(stored.user.uid)}.json`,{signal:AbortSignal.timeout(8000),cache:'no-store'})]);if(!sessionResponse.ok||!userResponse.ok)throw new Error('SESSION_CHECK_NETWORK');const remoteSession=await sessionResponse.json(),user=await userResponse.json(),access=normalizedAccess(user);const tokenValid=stored.serverSession===true?true:(typeof stored.secret==='string'&&same(createHash('sha256').update(stored.secret).digest('hex'),String(remoteSession?.tokenHash??'')));const accountDisabled=String(user?.status??'active').toLowerCase()==='disabled'||user?.anmeldungErlaubt===false||user?.forceLogout===true||user?.deletion?.pending===true;if(!remoteSession||remoteSession.revoked===true||Number(remoteSession.expiresAt??stored.expiresAt)<=Date.now()||!tokenValid||accountDisabled||!access.enabled){await fs.unlink(sessionFile).catch(()=>{});return null}const expiresAt=Number(remoteSession.expiresAt??stored.expiresAt);return {user:safeUser(stored.user.uid,user),permissions:Object.entries(access.permissions).filter(([,enabled])=>enabled).map(([key])=>key),expiresAt}}catch{return {user:stored.user,permissions:stored.permissions,expiresAt:stored.expiresAt,offline:true}}});
  ipcMain.handle('auth:logout',async()=>{const stored=await readStored();if(stored?.sessionId&&stored?.user?.uid)await fetch(`${databaseUrl}/users/${encodeURIComponent(stored.user.uid)}/sessions/${encodeURIComponent(stored.sessionId)}.json`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({revoked:true,revokedAt:Date.now()})}).catch(()=>{});try{await fs.unlink(sessionFile)}catch{}return true});
  ipcMain.handle('auth:connection',async()=>{try{const response=await fetch(`${databaseUrl}/.json?shallow=true`,{signal:AbortSignal.timeout(6000)});return response.ok}catch{return false}});
  ipcMain.handle('presentation:list',(_event,options?:{archived?:boolean;trashed?:boolean})=>presentationRepository.list(options?.archived===true,options?.trashed===true));
  ipcMain.handle('presentation:create',(_event,input:{title?:string;date?:string;template?:unknown})=>presentationRepository.create(input??{}));
  ipcMain.handle('presentation:save',(_event,document:unknown)=>presentationRepository.save(document));
  ipcMain.handle('presentation:load',async(_event,id?:string)=>{
    if(id)return presentationRepository.read(id);
    const state=await presentationRepository.getState();
    if(state.lastPresentationId){const current=await presentationRepository.read(state.lastPresentationId);if(current)return current}
    try{return JSON.parse(await fs.readFile(legacyPresentationFile,'utf8'))}catch{return null}
  });
  ipcMain.handle('presentation:duplicate',(_event,id:string,options?:DuplicatePresentationOptions)=>presentationRepository.duplicate(id,options));
  ipcMain.handle('presentation:rename',(_event,id:string,title:string)=>presentationRepository.rename(id,title));
  ipcMain.handle('presentation:archive',(_event,id:string,value:boolean)=>presentationRepository.setFlag(id,'archived',value));
  ipcMain.handle('presentation:trash',(_event,id:string,value:boolean)=>presentationRepository.setFlag(id,'trashed',value));
  ipcMain.handle('presentation:recovery',()=>presentationRepository.recoveryInfo());
  ipcMain.handle('presentation:mark-clean',()=>presentationRepository.setState({cleanShutdown:true}));
  ipcMain.handle('service-context:open',(event,position:{x:number;y:number},entries:Array<{id?:string;label?:string;type?:'normal'|'separator';enabled?:boolean;accelerator?:string;submenu?:any[]}>,theme?:'system'|'light'|'dark')=>{const owner=BrowserWindow.fromWebContents(event.sender);if(!owner)return false;const build=(items:typeof entries):MenuItemConstructorOptions[]=>items.map(entry=>entry.type==='separator'?{type:'separator'}:{label:String(entry.label??''),enabled:entry.enabled!==false,accelerator:entry.accelerator,submenu:entry.submenu?build(entry.submenu):undefined,click:()=>event.sender.send('service-context:command',entry.id)});const previous=nativeTheme.themeSource;if(theme)nativeTheme.themeSource=theme;Menu.buildFromTemplate(build(entries)).popup({window:owner,x:Math.round(position.x),y:Math.round(position.y),callback:()=>{nativeTheme.themeSource=previous}});return true});
  ipcMain.handle('slide-export:copy',(_event,dataUrl:string)=>{const image=nativeImage.createFromDataURL(dataUrl);if(image.isEmpty())throw new Error('SLIDE_RENDER_FAILED');clipboard.writeImage(image);return true});
  ipcMain.handle('slide-export:save',async(event,dataUrl:string,suggestedName:string,format:'png'|'jpeg'='png')=>{const owner=BrowserWindow.fromWebContents(event.sender)??controlWindow!,extension=format==='jpeg'?'jpg':'png',picked=await dialog.showSaveDialog(owner,{title:'Folie als Bild speichern',defaultPath:`${suggestedName.replace(/[<>:"/\\|?*]/g,'-')}.${extension}`,filters:[{name:format==='jpeg'?'JPEG-Bild':'PNG-Bild',extensions:[extension]}]});if(picked.canceled||!picked.filePath)return null;const image=nativeImage.createFromDataURL(dataUrl);if(image.isEmpty())throw new Error('SLIDE_RENDER_FAILED');await fs.writeFile(picked.filePath,format==='jpeg'?image.toJPEG(94):image.toPNG());return picked.filePath});
  ipcMain.handle('presentation:import',async(_event,kind:'office'|'text'|'gottesdienstregie'|'all'='all')=>{const groups={office:{name:'PowerPoint, Keynote und OpenDocument',extensions:['pptx','key','odp']},text:{name:'Text und Markdown',extensions:['txt','md']},gottesdienstregie:{name:'GottesdienstRegie',extensions:['json','grpresentation','grbackup']}},selected=kind==='all'?{name:'Unterstützte Präsentationen',extensions:['pptx','key','odp','txt','md','json','grpresentation','grbackup']}:groups[kind];const picked=await dialog.showOpenDialog(controlWindow!,{title:'Präsentation importieren',properties:['openFile'],filters:[selected,{name:'Alle unterstützten Formate',extensions:['pptx','key','odp','txt','md','json','grpresentation','grbackup']}]});if(picked.canceled||!picked.filePaths[0])return null;try{return await presentationRepository.importDocument(picked.filePaths[0])}catch(error){void dialog.showMessageBox(controlWindow!,{type:'error',title:'Präsentation konnte nicht importiert werden',message:'Die ausgewählte Präsentation konnte nicht importiert werden.',detail:error instanceof Error&&error.message==='KEYNOTE_PREVIEW_NOT_FOUND'?'Diese Keynote-Datei enthält keine verwendbare Vorschau. Exportiere sie in Keynote als PowerPoint-Datei (.pptx) und versuche es erneut.':'Prüfe, ob die Datei vollständig ist und in einem unterstützten Format gespeichert wurde.'});return null}});
  ipcMain.handle('presentation:export',async(_event,id:string)=>{const doc=await presentationRepository.read(id);if(!doc)return null;const picked=await dialog.showSaveDialog(controlWindow!,{title:'Präsentation exportieren',defaultPath:`${String(doc.title||'Praesentation').replace(/[<>:"/\\|?*]/g,'-')}.grpresentation`,filters:[{name:'GottesdienstRegie Präsentation',extensions:['grpresentation']}]});if(picked.canceled||!picked.filePath)return null;return presentationRepository.exportDocument(id,picked.filePath)});
  ipcMain.handle('presentation:backup',(_event,id:string)=>presentationRepository.backup(id));
  ipcMain.handle('external:open',async(_event,url:string)=>{const allowed=/^https:\/\/(github\.com\/cmoere\/GottesdienstRegie|cmoere\.github\.io\/GottesdienstRegie)/i.test(url)||new RegExp(`^http:\\/\\/(localhost|127\\.0\\.0\\.1|${remoteServer.get().address.replace(/\./g,'\\.')})(?::\\d+)?\\/`,'i').test(url);if(!allowed)throw new Error('EXTERNAL_URL_NOT_ALLOWED');await shell.openExternal(url);return true});
  ipcMain.handle('media:list',()=>mediaRepository.list());
  ipcMain.handle('media:import',async(event,kind?:'audio')=>{const owner=BrowserWindow.fromWebContents(event.sender)??controlWindow!,audio=kind==='audio';const picked=await dialog.showOpenDialog(owner,{title:audio?'Audio zum Hochladen auswählen':'Medien zum Hochladen auswählen',properties:['openFile','multiSelections'],filters:[audio?{name:'Unterstütztes Audio',extensions:['mp3','m4a','aac','wav','flac','ogg']}:{name:'Medien',extensions:['png','jpg','jpeg','webp','gif','svg','mp4','mov','webm','m4v','mp3','wav','m4a','aac','ogg','flac','pdf']}]});if(picked.canceled)return[];return mediaRepository.import(picked.filePaths)});
  ipcMain.handle('media:update',(_event,id:string,patch:any)=>mediaRepository.update(id,patch));
  ipcMain.handle('media:remove',(_event,id:string)=>mediaRepository.remove(id));
  ipcMain.handle('media:online-status',()=>onlineMedia.status());
  ipcMain.handle('media:online-list',()=>onlineMedia.list());
  ipcMain.handle('media:sync',async(_event,id:string)=>{const{asset,data}=await mediaRepository.data(id);await mediaRepository.update(id,{syncState:'uploading'});try{const uploaded=await onlineMedia.upload({name:`${asset.name}.${asset.extension.toLowerCase()}`,kind:asset.kind,checksum:asset.checksum,data});return await mediaRepository.update(id,{syncState:'synced',github:{repository:'cmoere/GottesdienstRegie',path:uploaded.path,sha:uploaded.id,downloadUrl:uploaded.downloadUrl}})}catch(error){await mediaRepository.update(id,{syncState:'error'});throw error}});
  ipcMain.handle('media:cloud-list',async()=>{const [remote,local]=await Promise.all([onlineMedia.list(),mediaRepository.list()]);return remote.map(item=>{const match=local.find(asset=>asset.github?.path===item.path||asset.checksum===item.checksum);return{...item,id:match?.id??item.id,name:match?.name??item.name.replace(/^[a-f0-9]{40,64}-/i,'').replace(/\.[^.]+$/,''),favorite:match?.favorite??false,tags:match?.tags??[],createdAt:match?.createdAt,updatedAt:match?.updatedAt??item.updatedAt,extension:item.path.split('.').at(-1)?.toUpperCase()??'',visibility:'team'}})});
  ipcMain.handle('media:unsplash-search',async(_event,query:string,accessKey:string)=>{const resolvedKey=accessKey?.trim()||process.env.UNSPLASH_ACCESS_KEY?.trim();if(!resolvedKey)throw new Error('UNSPLASH_ACCESS_KEY_REQUIRED');const url=new URL('https://api.unsplash.com/search/photos');url.searchParams.set('per_page','30');url.searchParams.set('content_filter','high');url.searchParams.set('query',query?.trim()||'church worship');const response=await fetch(url,{headers:{authorization:`Client-ID ${resolvedKey}`,'accept-version':'v1','user-agent':'PGB-Present/GottesdienstRegie'},signal:AbortSignal.timeout(15000)});if(!response.ok){const detail=await response.text().catch(()=>'');throw new Error(`UNSPLASH_HTTP_${response.status}:${detail.slice(0,120)}`)}const data=await response.json() as {results?:Array<any>};return(data.results??[]).map(photo=>({id:`unsplash-${photo.id}`,name:photo.alt_description||photo.description||`Foto von ${photo.user?.name??'Unsplash'}`,path:photo.links?.html??'',kind:'image',size:0,checksum:photo.id,downloadUrl:photo.urls?.regular??photo.urls?.small,updatedAt:photo.updated_at,tags:[`Foto: ${photo.user?.name??'Unsplash'}`],visibility:'community'}))});
  ipcMain.handle('media:legacy-list',async()=>(await mediaRepository.list()).filter(asset=>asset.syncState!=='synced'));
  ipcMain.handle('media:cloud-remove',async(_event,id:string)=>{if(outputManager.isActive())throw new Error('MEDIA_IN_LIVE_USE');const local=(await mediaRepository.list()).find(asset=>asset.id===id);const remote=(await onlineMedia.list()).find(item=>item.path===local?.github?.path||item.id===id);if(!remote)throw new Error('MEDIA_NOT_FOUND');const references:any[]=[];for(const summary of await presentationRepository.list(true,true)){const doc=await presentationRepository.read(summary.id),raw=JSON.stringify(doc);if(raw.includes(id)||raw.includes(remote.path)||raw.includes(remote.downloadUrl))references.push(summary)}if(references.length)throw new Error(`MEDIA_IN_PRESENTATIONS:${references.map(entry=>entry.title).join('|')}`);await onlineMedia.remove(remote.path,remote.id);if(local)await mediaRepository.remove(local.id);return true});
  ipcMain.handle('media-window:open',(_event,context:'manage'|'select',purpose:'item'|'background'|'audio',targetType?:'section'|'serviceItem',targetId?:string)=>openMediaWindow(context,purpose,targetType,targetId));
  ipcMain.handle('media-window:close',()=>{mediaWindow?.close();return true});
  ipcMain.handle('media-window:select',(_event,asset:unknown,purpose:string)=>{if(controlWindow&&!controlWindow.isDestroyed()){controlWindow.webContents.send('media:selected',{asset,purpose});controlWindow.focus()}mediaWindow?.close();return true});
  ipcMain.handle('media-window:select-audio',(_event,assets:unknown[],targetType:string,targetId:string)=>{if(controlWindow&&!controlWindow.isDestroyed()){controlWindow.webContents.send('media:selected',{assets,purpose:'audio',targetType,targetId});controlWindow.focus()}mediaWindow?.close();return true});
  ipcMain.handle('history-window:open',()=>openHistoryWindow());
  ipcMain.handle('history-window:close',()=>{historyWindow?.close();return true});
  ipcMain.handle('remote:get',()=>remoteServer.get());
  ipcMain.handle('remote:save-monitor',(_event,monitor:any)=>remoteServer.saveMonitor(monitor));
  ipcMain.handle('remote:remove-monitor',(_event,id:string)=>remoteServer.removeMonitor(id));
  ipcMain.handle('remote:create-session',(_event,input:any)=>remoteServer.createSession(input));
  ipcMain.handle('remote:revoke-session',(_event,id:string)=>remoteServer.revokeSession(id));
  ipcMain.handle('remote:update-live',(_event,state:any)=>{remoteServer.updateLive(state);return true});
  ipcMain.handle('updates:current-version',()=>app.getVersion());
  ipcMain.handle('updates:metadata',async()=>{const stat=await fs.stat(process.execPath);return{version:app.getVersion(),installedAt:stat.birthtime.toISOString(),modifiedAt:stat.mtime.toISOString(),fileSize:stat.size,executable:path.basename(process.execPath)}});
  ipcMain.handle('updates:check',()=>checkForUpdates());
  ipcMain.handle('updates:download',async()=>{if(lastUpdateStatus.state!=='available'&&lastUpdateStatus.state!=='cancelled')return false;updateCancellationToken=new CancellationToken();smoothedDownloadSpeed=0;try{await autoUpdater.downloadUpdate(updateCancellationToken);updateCancellationToken=null;return true}catch(error){if(updateCancellationToken?.cancelled){updateCancellationToken=null;publishUpdateStatus({state:'cancelled',version:pendingUpdateVersion,message:'Der Update-Download wurde abgebrochen.'});return true}updateCancellationToken=null;publishUpdateStatus({state:'error',message:error instanceof Error?error.message:String(error)});return false}});
  ipcMain.handle('updates:cancel-download',()=>{if(!updateCancellationToken||lastUpdateStatus.state!=='downloading')return false;updateCancellationToken.cancel();publishUpdateStatus({state:'cancelled',version:pendingUpdateVersion,message:'Der Update-Download wurde abgebrochen.'});return true});
  ipcMain.handle('updates:install',()=>{if(lastUpdateStatus.state!=='downloaded')return false;setImmediate(()=>autoUpdater.quitAndInstall(false,true));return true});
  async function previousRelease(){const response=await fetch('https://api.github.com/repos/cmoere/GottesdienstRegie/releases?per_page=20',{headers:{'user-agent':`GottesdienstRegie/${app.getVersion()}`},signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error(`GitHub ${response.status}`);const releases=await response.json() as any[];for(const release of releases){if(release.draft||release.prerelease||!olderThan(String(release.tag_name),app.getVersion()))continue;const asset=(release.assets??[]).find((entry:any)=>/GottesdienstRegie-Setup-.*\.exe$/i.test(String(entry.name)));if(asset)return{version:String(release.tag_name).replace(/^v/,''),publishedAt:String(release.published_at??''),size:Number(asset.size??0),url:String(asset.browser_download_url)}}return null}
  ipcMain.handle('updates:previous',()=>previousRelease());
  ipcMain.handle('updates:rollback',async()=>{try{const previous=await previousRelease();if(!previous)throw new Error('NO_PREVIOUS_VERSION');const response=await fetch(previous.url,{signal:AbortSignal.timeout(120000)});if(!response.ok||!response.body)throw new Error(`DOWNLOAD_${response.status}`);const total=Number(response.headers.get('content-length')??previous.size),target=path.join(app.getPath('temp'),`GottesdienstRegie-Setup-${previous.version}.exe`),file=await fs.open(target,'w');let received=0;try{const reader=response.body.getReader();for(;;){const{done,value}=await reader.read();if(done)break;await file.write(value);received+=value.byteLength;publishUpdateStatus({state:'rollback-downloading',version:previous.version,percent:total?Math.round(received/total*100):0})}}finally{await file.close()}publishUpdateStatus({state:'rollback-ready',version:previous.version,percent:100});const opened=await shell.openPath(target);if(opened)throw new Error(opened);setTimeout(()=>app.quit(),1200);return true}catch(error){publishUpdateStatus({state:'error',message:error instanceof Error?error.message:String(error)});return false}});
  const displayInfo=()=>displayManager.list();
  ipcMain.handle('displays:list',displayInfo);
  const notifyDisplays=()=>controlWindow&&!controlWindow.isDestroyed()&&controlWindow.webContents.send('displays:changed',displayInfo());
  screen.on('display-added',notifyDisplays);screen.on('display-removed',(_event,display)=>{outputManager.handleRemoved(display.id);notifyDisplays()});screen.on('display-metrics-changed',notifyDisplays);
  ipcMain.handle('displays:identify',(_event,assignments:DisplayAssignments)=>outputManager.identify(assignments));
  ipcMain.handle('outputs:preflight',(_event,assignments:DisplayAssignments,presentation:{hasPresentation?:boolean;activeSlideCount?:number;media?:string[]})=>displayManager.preflight(assignments,presentation));
  ipcMain.handle('outputs:on-air',async(_event,assignments:DisplayAssignments,payload:unknown)=>{const preflight=displayManager.preflight(assignments,{hasPresentation:true,activeSlideCount:1});if(!preflight.ok)throw new Error(preflight.errors.join('\n'));remoteServer.updateLive({current:payload,onAir:true});return outputManager.start(assignments,payload)});
  ipcMain.handle('outputs:send-slide',(_event,payload:unknown)=>{outputManager.send(payload);remoteServer.updateLive({current:payload});return true});
  ipcMain.on('outputs:media-ended',(_event,behavior:string)=>{if(controlWindow&&!controlWindow.isDestroyed())controlWindow.webContents.send('outputs:media-ended',behavior)});
  ipcMain.handle('outputs:send-role',(_event,role:OutputRole,payload:unknown)=>outputManager.sendTo(role,payload));
  ipcMain.handle('outputs:send-quick',(_event,roles:OutputRole[],payload:unknown)=>outputManager.sendQuick(roles,payload));
  ipcMain.handle('outputs:off-air',()=>{remoteServer.updateLive({onAir:false});return outputManager.stop()});
  createControlWindow(initialPreferences);
  let cleanQuit=false;
  app.on('before-quit',event=>{if(cleanQuit)return;event.preventDefault();controlCloseInProgress=true;remoteServer.stop();void Promise.all([outputManager.stop(),presentationRepository.setState({cleanShutdown:true})]).finally(()=>{cleanQuit=true;app.quit()})});
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createControlWindow(appPreferences.get()); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
