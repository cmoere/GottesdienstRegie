import { app, BrowserWindow, ipcMain, screen, safeStorage, Menu, shell, dialog, protocol, net } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { createHash, createHmac, pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { compare as bcryptCompare } from 'bcryptjs';
import { autoUpdater, type UpdateInfo } from 'electron-updater';
import { DisplayManager, type DisplayAssignments, type OutputRole } from './DisplayManager';
import { OutputWindowManager } from './OutputWindowManager';
import { PresentationRepository } from './PresentationRepository';
import { MediaRepository } from './MediaRepository';

let controlWindow: BrowserWindow | null = null;
protocol.registerSchemesAsPrivileged([{scheme:'gottesdienst-media',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
const rendererUrl = process.env.VITE_DEV_SERVER_URL;

type UpdateStatus={state:'idle'|'checking'|'available'|'not-available'|'downloading'|'downloaded'|'rollback-downloading'|'rollback-ready'|'error'|'development';version?:string;percent?:number;releaseNotes?:string;message?:string};
let lastUpdateStatus:UpdateStatus={state:'idle'};
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
autoUpdater.on('update-available',info=>publishUpdateStatus({state:'available',version:info.version,releaseNotes:releaseNotes(info)}));
autoUpdater.on('update-not-available',info=>publishUpdateStatus({state:'not-available',version:info.version}));
autoUpdater.on('download-progress',progress=>publishUpdateStatus({state:'downloading',percent:Math.round(progress.percent)}));
autoUpdater.on('update-downloaded',info=>publishUpdateStatus({state:'downloaded',version:info.version,releaseNotes:releaseNotes(info)}));
autoUpdater.on('error',error=>publishUpdateStatus({state:'error',message:error.message}));

async function checkForUpdates(){
  if(!app.isPackaged)return publishUpdateStatus({state:'development',version:app.getVersion()});
  try{await autoUpdater.checkForUpdates();return lastUpdateStatus}catch(error){return publishUpdateStatus({state:'error',message:error instanceof Error?error.message:String(error)})}
}

function load(win: BrowserWindow, route = '') {
  if (rendererUrl) return win.loadURL(`${rendererUrl}${route}`);
  return win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: route.replace(/^#/, '') });
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1500, height: 920, minWidth: 1120, minHeight: 700,
    backgroundColor: '#282832', icon: app.isPackaged ? path.join(process.resourcesPath, 'icon.png') : path.join(app.getAppPath(), 'build/icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  void load(controlWindow);
  controlWindow.webContents.once('did-finish-load',()=>{setTimeout(()=>void checkForUpdates(),5000)});
}

function versionParts(value:string){return value.replace(/^v/,'').split('.').map(part=>Number(part)||0)}
function olderThan(candidate:string,current:string){const a=versionParts(candidate),b=versionParts(current);for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]??0)<(b[i]??0))return true;if((a[i]??0)>(b[i]??0))return false}return false}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const displayManager=new DisplayManager();
  const publishOutputStatus=(role:OutputRole,state:'ready'|'missing'|'closed')=>{if(controlWindow&&!controlWindow.isDestroyed())controlWindow.webContents.send('outputs:status',{role,state})};
  const outputManager=new OutputWindowManager(path.join(__dirname,'preload.js'),load,publishOutputStatus);
  const sessionFile = path.join(app.getPath('userData'), 'community-session.bin');
  const legacyPresentationFile=path.join(app.getPath('userData'),'presentations','default-presentation.json');
  const presentationRepository=new PresentationRepository(path.join(app.getPath('userData'),'library'));
  const mediaRepository=new MediaRepository(path.join(app.getPath('userData'),'media-library'));
  void presentationRepository.initialize();
  void mediaRepository.initialize();
  protocol.handle('gottesdienst-media',request=>{const url=new URL(request.url),fileName=path.basename(decodeURIComponent(url.pathname));return net.fetch(pathToFileURL(path.join(mediaRepository.directory,fileName)).toString())});
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
  ipcMain.handle('auth:restore',async()=>{const stored=await readStored();if(!stored||Number(stored.expiresAt??0)<Date.now()){try{await fs.unlink(sessionFile)}catch{}return null}try{const [sessionResponse,userResponse]=await Promise.all([fetch(`${databaseUrl}/users/${encodeURIComponent(stored.user.uid)}/sessions/${encodeURIComponent(stored.sessionId)}.json`,{signal:AbortSignal.timeout(8000),cache:'no-store'}),fetch(`${databaseUrl}/users/${encodeURIComponent(stored.user.uid)}.json`,{signal:AbortSignal.timeout(8000),cache:'no-store'})]);if(!sessionResponse.ok||!userResponse.ok)throw new Error('SESSION_CHECK_NETWORK');const remoteSession=await sessionResponse.json(),user=await userResponse.json(),access=normalizedAccess(user);const tokenValid=stored.serverSession===true?true:(typeof stored.secret==='string'&&same(createHash('sha256').update(stored.secret).digest('hex'),String(remoteSession?.tokenHash??'')));const accountDisabled=String(user?.status??'active').toLowerCase()==='disabled'||user?.anmeldungErlaubt===false||user?.forceLogout===true||user?.deletion?.pending===true;if(!remoteSession||remoteSession.revoked===true||Number(remoteSession.expiresAt??stored.expiresAt)<=Date.now()||!tokenValid||accountDisabled||!access.enabled){await fs.unlink(sessionFile).catch(()=>{});return null}const expiresAt=Number(remoteSession.expiresAt??stored.expiresAt);return {user:safeUser(stored.user.uid,user),permissions:Object.entries(access.permissions).filter(([,enabled])=>enabled).map(([key])=>key),expiresAt}}catch{return {user:stored.user,permissions:stored.permissions,expiresAt:stored.expiresAt,offline:true}}});
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
  ipcMain.handle('presentation:duplicate',(_event,id:string)=>presentationRepository.duplicate(id));
  ipcMain.handle('presentation:rename',(_event,id:string,title:string)=>presentationRepository.rename(id,title));
  ipcMain.handle('presentation:archive',(_event,id:string,value:boolean)=>presentationRepository.setFlag(id,'archived',value));
  ipcMain.handle('presentation:trash',(_event,id:string,value:boolean)=>presentationRepository.setFlag(id,'trashed',value));
  ipcMain.handle('presentation:recovery',()=>presentationRepository.recoveryInfo());
  ipcMain.handle('presentation:mark-clean',()=>presentationRepository.setState({cleanShutdown:true}));
  ipcMain.handle('presentation:import',async()=>{const picked=await dialog.showOpenDialog(controlWindow!,{title:'Präsentation importieren',properties:['openFile'],filters:[{name:'GottesdienstRegie',extensions:['json','grpresentation','grbackup']}]});if(picked.canceled||!picked.filePaths[0])return null;return presentationRepository.importDocument(picked.filePaths[0])});
  ipcMain.handle('presentation:export',async(_event,id:string)=>{const doc=await presentationRepository.read(id);if(!doc)return null;const picked=await dialog.showSaveDialog(controlWindow!,{title:'Präsentation exportieren',defaultPath:`${String(doc.title||'Praesentation').replace(/[<>:"/\\|?*]/g,'-')}.grpresentation`,filters:[{name:'GottesdienstRegie Präsentation',extensions:['grpresentation']}]});if(picked.canceled||!picked.filePath)return null;return presentationRepository.exportDocument(id,picked.filePath)});
  ipcMain.handle('presentation:backup',(_event,id:string)=>presentationRepository.backup(id));
  ipcMain.handle('external:open',async(_event,url:string)=>{if(!/^https:\/\/(github\.com\/cmoere\/GottesdienstRegie|cmoere\.github\.io\/GottesdienstRegie)/i.test(url))throw new Error('EXTERNAL_URL_NOT_ALLOWED');await shell.openExternal(url);return true});
  ipcMain.handle('media:list',()=>mediaRepository.list());
  ipcMain.handle('media:import',async()=>{const picked=await dialog.showOpenDialog(controlWindow!,{title:'Medien importieren',properties:['openFile','multiSelections'],filters:[{name:'Medien',extensions:['png','jpg','jpeg','webp','gif','svg','mp4','mov','webm','m4v','mp3','wav','m4a','ogg','flac','pdf']}]});if(picked.canceled)return[];return mediaRepository.import(picked.filePaths)});
  ipcMain.handle('media:update',(_event,id:string,patch:any)=>mediaRepository.update(id,patch));
  ipcMain.handle('media:remove',(_event,id:string)=>mediaRepository.remove(id));
  ipcMain.handle('updates:current-version',()=>app.getVersion());
  ipcMain.handle('updates:metadata',async()=>{const stat=await fs.stat(process.execPath);return{version:app.getVersion(),installedAt:stat.birthtime.toISOString(),modifiedAt:stat.mtime.toISOString(),fileSize:stat.size,executable:path.basename(process.execPath)}});
  ipcMain.handle('updates:check',()=>checkForUpdates());
  ipcMain.handle('updates:download',async()=>{if(lastUpdateStatus.state!=='available')return false;try{await autoUpdater.downloadUpdate();return true}catch(error){publishUpdateStatus({state:'error',message:error instanceof Error?error.message:String(error)});return false}});
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
  ipcMain.handle('outputs:on-air',async(_event,assignments:DisplayAssignments,payload:unknown)=>{const preflight=displayManager.preflight(assignments,{hasPresentation:true,activeSlideCount:1});if(!preflight.ok)throw new Error(preflight.errors.join('\n'));return outputManager.start(assignments,payload)});
  ipcMain.handle('outputs:send-slide',(_event,payload:unknown)=>{outputManager.send(payload);return true});
  ipcMain.handle('outputs:send-role',(_event,role:OutputRole,payload:unknown)=>outputManager.sendTo(role,payload));
  ipcMain.handle('outputs:off-air',()=>outputManager.stop());
  createControlWindow();
  let cleanQuit=false;
  app.on('before-quit',event=>{if(cleanQuit)return;event.preventDefault();void presentationRepository.setState({cleanShutdown:true}).finally(()=>{cleanQuit=true;app.quit()})});
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createControlWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
