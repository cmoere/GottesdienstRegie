import { useEffect, useMemo, useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePresentation, type ItemType, type ServiceItem, type Slide } from './store';
import { authMessage, cancelTwoFactor, isTwoFactorChallenge, login, logout, restore, twoFactorMessage, verifyTwoFactor, type AuthSession, type TwoFactorChallenge } from './auth';
import { useI18n, type TranslationKey, type Translator } from './i18n';
import { usePreferences, type Language, type ThemeMode } from './preferences';
import bielefeldBackground from './assets/login-backgrounds/bielefeld.png';
import germanLakeBackground from './assets/login-backgrounds/german-lake.png';
import germanCityNightBackground from './assets/login-backgrounds/german-city-night.png';

function Icon({name}:{name:string}){return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>}
const X=()=> <Icon name="close"/>;
const LogOut=()=> <Icon name="logout"/>;
const languageOptions:{value:Language;label:TranslationKey;flag:string}[]=[
  {value:'de',label:'languageGerman',flag:'🇩🇪'},{value:'gsw',label:'languageSwissGerman',flag:'🇨🇭'},{value:'en',label:'languageEnglish',flag:'🇬🇧'},
  {value:'nl',label:'languageDutch',flag:'🇳🇱'},{value:'da',label:'languageDanish',flag:'🇩🇰'},{value:'no',label:'languageNorwegian',flag:'🇳🇴'},
  {value:'es',label:'languageSpanish',flag:'🇪🇸'},{value:'uk',label:'languageUkrainian',flag:'🇺🇦'},{value:'ru',label:'languageRussian',flag:'🇷🇺'},
  {value:'tr',label:'languageTurkish',flag:'🇹🇷'},{value:'ar',label:'languageArabic',flag:'🇸🇦'},{value:'pl',label:'languagePolish',flag:'🇵🇱'}
];

const lightLoginImages=[
  bielefeldBackground,
  germanLakeBackground
];
const darkLoginImages=[
  germanCityNightBackground,
  bielefeldBackground
];
function randomLoginImage(theme:ThemeMode){
  const dark=theme==='dark'||(theme==='system'&&typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme: dark)').matches);
  const images=dark?darkLoginImages:lightLoginImages;
  return images[Math.floor(Math.random()*images.length)];
}

function Login({authenticated}:{authenticated:(session:AuthSession)=>void}){
  const {t}=useI18n();
  const language=usePreferences(state=>state.language),setLanguage=usePreferences(state=>state.setLanguage);
  const theme=usePreferences(state=>state.theme),showLoginBackgrounds=usePreferences(state=>state.showLoginBackgrounds);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [remember,setRemember]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [connected,setConnected]=useState<boolean|null>(null);
  const [twoFactor,setTwoFactor]=useState<TwoFactorChallenge|null>(null);
  const [twoFactorCode,setTwoFactorCode]=useState('');
  const [recoveryMode,setRecoveryMode]=useState(false);
  const [twoFactorError,setTwoFactorError]=useState('');
  const [verifyBusy,setVerifyBusy]=useState(false);
  const [languageOpen,setLanguageOpen]=useState(false);
  const [backgroundImage]=useState(()=>randomLoginImage(theme));

  useEffect(()=>{
    let active=true;
    const check=()=>void window.desktop?.auth.connection().then(value=>active&&setConnected(value)).catch(()=>active&&setConnected(false));
    check();
    const timer=setInterval(check,15000);
    return()=>{active=false;clearInterval(timer)};
  },[]);

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');
    try{
      const result=await login(email,password,remember);setPassword('');
      if(isTwoFactorChallenge(result)){setTwoFactor(result);setTwoFactorCode('');setRecoveryMode(false);setTwoFactorError('');return}
      authenticated(result);
    }catch(error){setPassword('');setError(authMessage(error instanceof Error?error.message:'SERVER',t))}
    finally{setBusy(false)}
  }

  async function confirmTwoFactor(e?:React.FormEvent){
    e?.preventDefault();if(!twoFactor||verifyBusy)return;
    const normalized=recoveryMode?twoFactorCode.toUpperCase().replace(/[^A-Z2-9]/g,''):twoFactorCode.replace(/\D/g,'');
    if((recoveryMode&&normalized.length!==12)||(!recoveryMode&&normalized.length!==6)){setTwoFactorError(t(recoveryMode?'recoveryIncomplete':'codeIncomplete'));return}
    setVerifyBusy(true);setTwoFactorError('');
    try{authenticated(await verifyTwoFactor(twoFactor.challengeId,twoFactorCode,recoveryMode));setTwoFactor(null)}
    catch(error){setTwoFactorError(twoFactorMessage(error instanceof Error?error.message:'SERVER',t));if(!recoveryMode)setTwoFactorCode('')}
    finally{setVerifyBusy(false)}
  }

  async function cancelChallenge(){
    if(twoFactor)await cancelTwoFactor(twoFactor.challengeId);
    setTwoFactor(null);setTwoFactorCode('');setRecoveryMode(false);setTwoFactorError('');
  }

  const twoFactorText=twoFactor?.method==='totp'?t('twoFactorTotp'):t('twoFactorSent',{destination:twoFactor?.destination||t('securityChannel')});
  useEffect(()=>{if(!twoFactor||recoveryMode||twoFactorCode.length!==6||verifyBusy)return;const timer=setTimeout(()=>void confirmTwoFactor(),220);return()=>clearTimeout(timer)},[twoFactorCode,recoveryMode,twoFactor,verifyBusy]);
  const selectedLanguage=languageOptions.find(option=>option.value===language)??languageOptions[0];
  return <>
    <main className={`login ${showLoginBackgrounds?'with-background':''}`} style={showLoginBackgrounds?{'--login-image':`url("${backgroundImage}")`} as React.CSSProperties:undefined}>
      <div className="login-language-menu"><button type="button" className="language-flag" onClick={()=>setLanguageOpen(value=>!value)} title={t('language')} aria-expanded={languageOpen}>{selectedLanguage.flag}</button>{languageOpen&&<div className="language-menu" role="menu">{languageOptions.map(option=><button type="button" role="menuitem" className={option.value===language?'active':''} key={option.value} onClick={()=>{setLanguage(option.value);setLanguageOpen(false)}}><span>{option.flag}</span>{t(option.label)}</button>)}</div>}</div>
      <form onSubmit={submit} className="login-panel">
        <div className="brand-mark">GR</div><h1>GottesdienstRegie</h1><p>{t('loginSubtitle')}</p>
        <label>{t('email')}<input autoFocus type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label>{t('password')}<div className="password-field"><input type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShowPassword(value=>!value)} title={t(showPassword?'hidePassword':'showPassword')}><Icon name={showPassword?'visibility_off':'visibility'}/></button></div></label>
        <label className="remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> {t('remember')}</label>
        {error&&<div className="error">{error}</div>}
        <button className="primary" disabled={busy}>{t(busy?'signingIn':'signIn')}</button>
        <button type="button" className="forgot" disabled title={t('notAvailable')}>{t('forgotPassword')}</button>
      </form>
      <div className={`firebase-status ${connected===true?'connected':connected===false?'disconnected':''}`}><span/>{t(connected===null?'firebaseChecking':connected?'firebaseConnected':'firebaseDisconnected')}</div>
      {showLoginBackgrounds&&<span className="image-credit">{t('backgroundImageCredit')}</span>}
    </main>
    {twoFactor&&<div className="two-factor-backdrop"><form className="two-factor-dialog" onSubmit={confirmTwoFactor} role="dialog" aria-modal="true" aria-labelledby="two-factor-title">
      <header><div className="two-factor-icon"><Icon name="verified_user"/></div><div><h2 id="two-factor-title">{t('twoFactorTitle')}</h2><span>{t('twoFactorSubtitle')}</span></div></header>
      <p>{recoveryMode?t('recoveryIntro'):twoFactorText}</p>
      <label>{t(recoveryMode?'recoveryCode':'verificationCode')}<input autoFocus inputMode={recoveryMode?'text':'numeric'} autoComplete="one-time-code" maxLength={recoveryMode?14:6} placeholder={recoveryMode?'XXXX-XXXX-XXXX':'000000'} value={twoFactorCode} onChange={e=>{const value=recoveryMode?e.target.value.toUpperCase().replace(/[^A-Z2-9-]/g,'').slice(0,14):e.target.value.replace(/\D/g,'').slice(0,6);setTwoFactorCode(value);setTwoFactorError('')}}/></label>
      {twoFactorError&&<div className="error">{twoFactorError}</div>}
      <button className="recovery-toggle" type="button" onClick={()=>{setRecoveryMode(value=>!value);setTwoFactorCode('');setTwoFactorError('')}}>{t(recoveryMode?'useNormalCode':'useRecoveryCode')}</button>
      <div className="two-factor-actions"><button type="button" onClick={()=>void cancelChallenge()}>{t('cancel')}</button><button className="primary" disabled={verifyBusy}>{t(verifyBusy?'verifying':'confirm')}</button></div>
    </form></div>}
  </>;
}

function SortableItem({item,active,onSelect,canEdit}:{item:ServiceItem;active:boolean;onSelect:()=>void;canEdit:boolean}){
  const {t}=useI18n();
  const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:item.id,disabled:!canEdit});
  const icon={song:'music_note',bible:'menu_book',content:'title',media:'image'}[item.type];
  return <button ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition}} className={`service-item ${active?'active':''} ${isDragging?'dragging':''}`} onClick={onSelect}><span className="drag" {...attributes} {...listeners}><Icon name="drag_indicator"/></span><span className="kind"><Icon name={icon}/></span><span><b>{item.title}</b><small>{item.slides.length} {t(item.slides.length===1?'slidesOne':'slidesMany')}</small></span></button>;
}

function AddPopover({close}:{close:()=>void}){
  const {t}=useI18n();
  const add=usePresentation(state=>state.addItem);
  const options:{type:ItemType;label:TranslationKey;title:TranslationKey;icon:string}[]=[
    {type:'song',label:'song',title:'newSong',icon:'music_note'},
    {type:'bible',label:'bible',title:'newBible',icon:'menu_book'},
    {type:'content',label:'content',title:'newContent',icon:'title'},
    {type:'media',label:'media',title:'newMedia',icon:'image'}
  ];
  return <div className="popover"><header><b>{t('addItem')}</b><button onClick={close}><Icon name="close"/></button></header>{options.map(option=><button key={option.type} onClick={()=>{add(option.type,{title:t(option.title),section:t('serviceSection'),body:t('editContent')});close()}}><Icon name={option.icon}/><span>{t(option.label)}</span></button>)}</div>;
}

function OrderOfService({canEdit}:{canEdit:boolean}){
  const {t}=useI18n();
  const items=usePresentation(state=>state.items),selected=usePresentation(state=>state.selectedItemId),select=usePresentation(state=>state.select),reorder=usePresentation(state=>state.reorder);
  const [adding,setAdding]=useState(false);let last='';
  function end(e:DragEndEvent){if(canEdit&&e.over&&e.active.id!==e.over.id)reorder(String(e.active.id),String(e.over.id))}
  return <aside className="service"><header><b>{t('orderOfService')}</b><button className="icon-button" disabled={!canEdit} onClick={()=>setAdding(value=>!value)} title={t(canEdit?'addItem':'noEditPermission')}><Icon name="add"/></button>{adding&&canEdit&&<AddPopover close={()=>setAdding(false)}/>}</header><div className="service-list"><DndContext collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={items.map(item=>item.id)} strategy={verticalListSortingStrategy}>{items.map(item=>{const show=item.section!==last;last=item.section;return <div key={item.id}>{show&&<div className="section-label">{item.section}</div>}<SortableItem item={item} active={selected===item.id} canEdit={canEdit} onSelect={()=>select(item.id)}/></div>})}</SortableContext></DndContext></div></aside>;
}

function SlideView({slide,small=false}:{slide:Slide;small?:boolean}){return <div className={`slide ${small?'small':''}`} style={{background:slide.background}}><div><strong>{slide.title}</strong><p>{slide.body}</p></div></div>}

function Workspace(){
  const {t}=useI18n();const state=usePresentation();const item=state.items.find(entry=>entry.id===state.selectedItemId)??state.items[0];const slide=item?.slides.find(entry=>entry.id===state.selectedSlideId)??item?.slides[0];
  if(!slide)return <section className="workspace empty">{t('noSlides')}</section>;
  if(state.mode==='preview'&&state.previewLayout==='grid')return <section className="workspace preview-grid" style={{'--grid-size':`${state.gridSize}px`} as React.CSSProperties}>{state.items.map(entry=><div className="grid-item" key={entry.id}><h3>{entry.title}</h3><div className="grid-slides">{entry.slides.map(current=><button key={current.id} className={current.id===state.selectedSlideId?'selected':''} onClick={()=>state.select(entry.id,current.id)}><SlideView slide={current} small/></button>)}</div></div>)}</section>;
  return <section className="workspace"><div className="canvas-wrap"><SlideView slide={slide}/></div></section>;
}

function Inspector({canEdit}:{canEdit:boolean}){
  const {t}=useI18n();const state=usePresentation();const item=state.items.find(entry=>entry.id===state.selectedItemId),slide=item?.slides.find(entry=>entry.id===state.selectedSlideId);
  return <aside className="inspector"><header><b>{t('properties')}</b><span>{t('layers')}</span></header>{slide?<div className="fields"><label>{t('title')}<input disabled={!canEdit} value={slide.title} onChange={e=>state.updateSlide({title:e.target.value})}/></label><label>{t('text')}<textarea disabled={!canEdit} rows={7} value={slide.body} onChange={e=>state.updateSlide({body:e.target.value})}/></label><label>{t('background')}<input disabled={!canEdit} type="color" value={slide.background} onChange={e=>state.updateSlide({background:e.target.value})}/></label></div>:null}</aside>;
}

function Filmstrip(){const {t}=useI18n();const state=usePresentation();const item=state.items.find(entry=>entry.id===state.selectedItemId);return <div className="filmstrip"><header>{t('slides')}</header><div>{item?.slides.map((slide,index)=><button key={slide.id} className={slide.id===state.selectedSlideId?'active':''} onClick={()=>state.select(item.id,slide.id)}><SlideView slide={slide} small/><span>{index+1}</span></button>)}</div></div>}

function ExpandableItem({title,body}:{title:string;body:string}){const [open,setOpen]=useState(false);return <div className="expandable-item"><button type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open}><b>{open?'−':'+'}</b><span>{title}</span></button>{open&&<p>{body}</p>}</div>}

type SettingsTab='general'|'accessibility'|'updates'|'display'|'audio'|'videoInput'|'presentation'|'quickScreens'|'fonts'|'defaultMedia'|'defaultStage'|'remote'|'lightingMidi';
const settingTabs:SettingsTab[]=['general','accessibility','updates','display','audio','videoInput','presentation','quickScreens','fonts','defaultMedia','defaultStage','remote','lightingMidi'];

function SettingsModal({close,canConfigure}:{close:()=>void;canConfigure:boolean}){
  const {t}=useI18n();
  const [tab,setTab]=useState<SettingsTab>('general');
  const [displays,setDisplays]=useState<DesktopDisplay[]>([]);
  const [currentVersion,setCurrentVersion]=useState('…');
  const [updateStatus,setUpdateStatus]=useState<DesktopUpdateStatus>({state:'idle'});
  const main=usePresentation(state=>state.mainDisplayId),setMain=usePresentation(state=>state.setMainDisplay);
  const language=usePreferences(state=>state.language),theme=usePreferences(state=>state.theme),blackWhite=usePreferences(state=>state.blackWhite),reduceMotion=usePreferences(state=>state.reduceMotion),compactMode=usePreferences(state=>state.compactMode),showLoginBackgrounds=usePreferences(state=>state.showLoginBackgrounds);
  const setLanguage=usePreferences(state=>state.setLanguage),setTheme=usePreferences(state=>state.setTheme),setBlackWhite=usePreferences(state=>state.setBlackWhite),setReduceMotion=usePreferences(state=>state.setReduceMotion),setCompactMode=usePreferences(state=>state.setCompactMode),setShowLoginBackgrounds=usePreferences(state=>state.setShowLoginBackgrounds);
  useEffect(()=>{
    void window.desktop?.displays().then(setDisplays);
    void window.desktop?.updates.currentVersion().then(setCurrentVersion);
    const dispose=window.desktop?.updates.onStatus(setUpdateStatus);
    return()=>dispose?.();
  },[]);
  const themeOptions:{value:ThemeMode;label:TranslationKey}[]=[{value:'system',label:'themeSystem'},{value:'light',label:'themeLight'},{value:'dark',label:'themeDark'}];
  const updateText=updateStatus.state==='checking'?t('updateChecking')
    :updateStatus.state==='available'?t('updateAvailable',{version:updateStatus.version??''})
    :updateStatus.state==='not-available'?t('updateCurrent')
    :updateStatus.state==='downloading'?t('updateDownloading',{percent:updateStatus.percent??0})
    :updateStatus.state==='downloaded'?t('updateDownloaded',{version:updateStatus.version??''})
    :updateStatus.state==='error'?t('updateError',{detail:updateStatus.message??t('authUnknown')})
    :updateStatus.state==='development'?t('updateDevelopment'):'';
  const notes:[[TranslationKey,TranslationKey],[TranslationKey,TranslationKey],[TranslationKey,TranslationKey],[TranslationKey,TranslationKey],[TranslationKey,TranslationKey]]=[['releaseNoteLanguagesTitle','releaseNoteLanguagesBody'],['releaseNoteLoginTitle','releaseNoteLoginBody'],['releaseNoteSecurityTitle','releaseNoteSecurityBody'],['releaseNoteHelpTitle','releaseNoteHelpBody'],['releaseNoteUpdatesTitle','releaseNoteUpdatesBody']];
  return <div className="modal-backdrop"><div className="modal"><header><h2>{t('settings')}</h2><button onClick={close} title={t('cancel')}><X/></button></header><div className="modal-body"><nav>{settingTabs.map(key=><button className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{t(key)}</button>)}</nav>
    {tab==='general'?<section><h3>{t('general')}</h3><p>{t('generalHelp')}</p><div className="settings-group"><h4>{t('language')}</h4><label>{t('language')}<select value={language} onChange={e=>setLanguage(e.target.value as Language)}>{languageOptions.map(option=><option value={option.value} key={option.value}>{option.flag} {t(option.label)}</option>)}</select></label></div><div className="settings-group"><h4>{t('appearance')}</h4><label>{t('theme')}<select value={theme} onChange={e=>setTheme(e.target.value as ThemeMode)}>{themeOptions.map(option=><option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label><label className="setting-check"><input type="checkbox" checked={blackWhite} onChange={e=>setBlackWhite(e.target.checked)}/><span><b>{t('blackWhite')}</b><small>{t('blackWhiteHelp')}</small></span></label></div></section>
    :tab==='accessibility'?<section><h3>{t('accessibility')}</h3><p>{t('accessibilityHelp')}</p><label className="setting-check"><input type="checkbox" checked={reduceMotion} onChange={e=>setReduceMotion(e.target.checked)}/><span><b>{t('reduceMotion')}</b><small>{t('reduceMotionHelp')}</small></span></label><label className="setting-check"><input type="checkbox" checked={compactMode} onChange={e=>setCompactMode(e.target.checked)}/><span><b>{t('compactMode')}</b><small>{t('compactModeHelp')}</small></span></label><label className="setting-check"><input type="checkbox" checked={showLoginBackgrounds} onChange={e=>setShowLoginBackgrounds(e.target.checked)}/><span><b>{t('showLoginBackgrounds')}</b><small>{t('showLoginBackgroundsHelp')}</small></span></label></section>
    :tab==='updates'?<section><h3>{t('updatesTitle')}</h3><p>{t('currentVersion')}: <b>{currentVersion}</b></p>{updateText&&<div className={`update-state ${updateStatus.state}`}>{updateText}</div>}<div className="update-actions"><button className="primary" disabled={updateStatus.state==='checking'||updateStatus.state==='downloading'} onClick={()=>void window.desktop?.updates.check().then(setUpdateStatus)}>{t('checkUpdates')}</button>{updateStatus.state==='available'&&<button className="primary" onClick={()=>void window.desktop?.updates.download()}>{t('updateDownload')}</button>}{updateStatus.state==='downloaded'&&<button className="primary" onClick={()=>void window.desktop?.updates.install()}>{t('updateInstall')}</button>}</div><h4>{t('releaseNotes')} {currentVersion}</h4><div className="release-accordion">{notes.map(([title,body])=><ExpandableItem key={title} title={t(title)} body={t(body)}/>)}</div>{updateStatus.releaseNotes&&<div className="remote-release-notes"><h4>{t('onlineReleaseNotes')}</h4><p>{updateStatus.releaseNotes}</p></div>}</section>
    :tab==='display'?<section><h3>{t('displayTitle')}</h3><p>{t('displayHelp')}</p><label>MAIN<select disabled={!canConfigure} value={main??''} onChange={e=>setMain(e.target.value?Number(e.target.value):undefined)}><option value="">{t('unassigned')}</option>{displays.map((display,index)=><option key={display.id} value={display.id}>{t('displayNumber',{number:index+1})}{display.primary?` (${t('controlSurface')})`:''} · {display.bounds.width}×{display.bounds.height}</option>)}</select></label>{!canConfigure&&<div className="notice">{t('noPermission')}</div>}{!window.desktop&&<div className="notice">{t('displayDesktopOnly')}</div>}</section>
    :<section><h3>{t(tab)}</h3><p>{t('sectionUnavailable')}</p></section>}
  </div></div></div>;
}

function roleLabel(t:Translator,role:string){const labels:Record<string,TranslationKey>={viewer:'roleViewer',presenter:'rolePresenter',editor:'roleEditor',admin:'roleAdmin'};return labels[role]?t(labels[role]):role.toUpperCase()}

function HelpModal({close}:{close:()=>void}){
  const {t}=useI18n();
  const [version,setVersion]=useState('…');
  useEffect(()=>{void window.desktop?.updates.currentVersion().then(setVersion)},[]);
  const topics:[[TranslationKey,TranslationKey],[TranslationKey,TranslationKey],[TranslationKey,TranslationKey],[TranslationKey,TranslationKey],[TranslationKey,TranslationKey]]=[['helpGettingStarted','helpGettingStartedBody'],['helpShortcuts','helpShortcutsBody'],['helpUpdates','helpUpdatesBody'],['helpSecurity','helpSecurityBody'],['helpImages','helpImagesBody']];
  return <div className="modal-backdrop"><div className="help-dialog"><header><div><h2>{t('helpTitle')}</h2><p>{t('helpIntro')}</p></div><button onClick={close} title={t('close')}><X/></button></header><div className="help-topics">{topics.map(([title,body])=><ExpandableItem key={title} title={t(title)} body={t(body)}/>)}</div><footer><span>GottesdienstRegie {version}</span><button className="primary" onClick={close}>{t('close')}</button></footer></div></div>;
}

function LogoutDialog({cancel,confirm}:{cancel:()=>void;confirm:()=>void}){const {t}=useI18n();return <div className="modal-backdrop"><div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="confirm-icon"><Icon name="logout"/></div><h2 id="logout-title">{t('logoutConfirmTitle')}</h2><p>{t('logoutConfirmText')}</p><div><button onClick={cancel}>{t('staySignedIn')}</button><button className="danger-button" onClick={confirm}>{t('logoutNow')}</button></div></div></div>}

function AppShell({session,onLogout}:{session:AuthSession;onLogout:()=>void}){
  const {t,locale}=useI18n();
  const state=usePresentation();const [settingsOpen,setSettingsOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false),[logoutConfirm,setLogoutConfirm]=useState(false);
  const user=session.user,access=user.appAccess.gottesdienstRegie,can=(permission:string)=>session.permissions.includes(permission),canEdit=can('presentationEdit'),canConfigure=can('outputSettings')||can('appSettings');
  const selected=state.items.find(item=>item.id===state.selectedItemId),slideCount=selected?.slides.length??0,slideIndex=Math.max(0,selected?.slides.findIndex(slide=>slide.id===state.selectedSlideId)??0)+1;
  async function air(){if(!can('presentationLive'))return;if(state.onAir){await window.desktop?.goOffAir();state.setOnAir(false);return}if(state.mainDisplayId&&window.desktop){await window.desktop.goOnAir(state.mainDisplayId);state.setOnAir(true)}}
  async function leave(){if(state.onAir){await window.desktop?.goOffAir();state.setOnAir(false)}await logout();onLogout()}
  const menus:{key:TranslationKey;action?:()=>void}[]=[{key:'file'},{key:'media'},{key:'presentation'},{key:'view'},{key:'tools'},{key:'settings',action:()=>setSettingsOpen(true)},{key:'help',action:()=>setHelpOpen(true)}];
  return <div className="app"><div className="menubar">{menus.map(menu=><button key={menu.key} disabled={!menu.action} title={menu.action?t(menu.key):t('notAvailableTitle')} onClick={menu.action}>{t(menu.key)}</button>)}<span/><button title={`GottesdienstRegie: ${roleLabel(t,access.role)} · ${t('logout')}`} onClick={()=>setLogoutConfirm(true)}><LogOut/> {user.firstname??user.email}</button></div>
    <div className="toolbar"><div><b>{state.title}</b><span> · {new Date().toLocaleDateString(locale)}</span></div><div className="mode"><button className={state.mode==='edit'?'active':''} onClick={()=>state.setMode('edit')}>{t('edit')}</button><button className={state.mode==='preview'?'active':''} onClick={()=>state.setMode('preview')}>{t('preview')}</button>{state.mode==='preview'&&<><i/><button className={state.previewLayout==='single'?'active':''} onClick={()=>state.setPreviewLayout('single')}>{t('singleView')}</button><button className={state.previewLayout==='grid'?'active':''} onClick={()=>state.setPreviewLayout('grid')}>{t('slideOverview')}</button>{state.previewLayout==='grid'&&<input aria-label={t('previewSize')} type="range" min="120" max="300" value={state.gridSize} onChange={e=>state.setGridSize(Number(e.target.value))}/>}</>}</div><button className={`onair ${state.onAir?'live':''}`} disabled={!can('presentationLive')||!state.mainDisplayId||!window.desktop} title={!can('presentationLive')?t('noLivePermission'):!state.mainDisplayId?t('assignMain'):''} onClick={()=>void air()}><span/> {t(state.onAir?'offAir':'onAir')}</button></div>
    <div className="main"><OrderOfService canEdit={canEdit}/><Workspace/><Inspector canEdit={canEdit}/></div>{state.mode==='edit'&&<Filmstrip/>}
    <div className="status"><span>{t('ready')}</span><span>{t('local')} ✓</span><span>{t('syncOffline')}</span><span>{t('main')} {state.onAir?t('live'):state.mainDisplayId?t('ready'):'—'}</span><i/><span>{roleLabel(t,access.role)}</span><span>{t('item')} {Math.max(1,state.items.findIndex(item=>item.id===state.selectedItemId)+1)}/{state.items.length}</span><span>{t('slide')} {slideIndex}/{slideCount}</span><Clock locale={locale}/></div>
    {settingsOpen&&<SettingsModal canConfigure={canConfigure} close={()=>setSettingsOpen(false)}/>} {helpOpen&&<HelpModal close={()=>setHelpOpen(false)}/>} {logoutConfirm&&<LogoutDialog cancel={()=>setLogoutConfirm(false)} confirm={()=>void leave()}/>}</div>;
}

function Clock({locale}:{locale:string}){const [now,setNow]=useState(new Date());useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer)},[]);return <span>{now.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}</span>}
function Output(){const state=usePresentation();const item=state.items.find(entry=>entry.id===state.selectedItemId),slide=item?.slides.find(entry=>entry.id===state.selectedSlideId);return <div className="output">{slide&&<SlideView slide={slide}/>}</div>}

export function App(){
  const [session,setSession]=useState<AuthSession|null|undefined>(undefined);
  const language=usePreferences(state=>state.language),theme=usePreferences(state=>state.theme),blackWhite=usePreferences(state=>state.blackWhite),reduceMotion=usePreferences(state=>state.reduceMotion),compactMode=usePreferences(state=>state.compactMode);
  const {t}=useI18n();
  useEffect(()=>{document.documentElement.lang=language==='gsw'?'de-CH':language;document.documentElement.dir=language==='ar'?'rtl':'ltr';document.documentElement.dataset.theme=theme;document.documentElement.dataset.bw=String(blackWhite);document.documentElement.dataset.reduceMotion=String(reduceMotion);document.documentElement.dataset.compact=String(compactMode)},[language,theme,blackWhite,reduceMotion,compactMode]);
  useEffect(()=>{void restore().then(setSession)},[]);
  const signedIn=!!session;
  useEffect(()=>{if(!signedIn)return;let active=true;const check=async()=>{const refreshed=await restore();if(!active)return;if(!refreshed){setSession(null);return}setSession(current=>{if(!current)return refreshed;const currentAccess=current.user.appAccess.gottesdienstRegie,nextAccess=refreshed.user.appAccess.gottesdienstRegie;const changed=current.expiresAt!==refreshed.expiresAt||current.user.uid!==refreshed.user.uid||currentAccess.enabled!==nextAccess.enabled||currentAccess.role!==nextAccess.role||JSON.stringify(current.permissions)!==JSON.stringify(refreshed.permissions);return changed?refreshed:current})};const timer=setInterval(()=>void check(),120_000);return()=>{active=false;clearInterval(timer)}},[signedIn]);
  const output=useMemo(()=>location.hash==='#output',[]);
  if(output)return <Output/>;
  if(session===undefined)return <div className="boot">{t('accountLoading')}</div>;
  return session?<AppShell session={session} onLogout={()=>setSession(null)}/>:<Login authenticated={setSession}/>;
}
