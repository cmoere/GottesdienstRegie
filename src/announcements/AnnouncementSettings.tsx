import {useCallback, useEffect, useState,useRef} from 'react';
import {AnnouncementService} from '../community/AnnouncementService';
import {getCommunityAnnouncementRecords, getCommunityRuntimeSnapshot, subscribeCommunityRuntime} from '../community/communityRuntime';
import {normalizeAnnouncementSettings, validateAnnouncementSettings,isBundledAnnouncementVoice,bundledAnnouncementVoice,bundledFemaleAnnouncementVoice} from './settings';
import type {AnnouncementSettings as Settings, AnnouncementSettingsBridge} from './settings';
import type {SpokenAnnouncement} from './types';
import {useI18n} from '../i18n';
import type {TranslationKey} from '../i18n';
import './announcement-preparation.css';
import {useSpeechStatus} from './AnnouncementIndicator';
import {usePreferences} from '../preferences';
import {generalAnnouncementProbe,startAnnouncementTest,stopAnnouncementTest} from './AnnouncementTestRequests';
import {ReadingSettingsControls} from './ReadingSettingsControls';
import {normalizeReadingSettings} from './readingSettings';
import {bundledVoices} from './voices';

const service = new AnnouncementService();

/** Preparatory controls remain usable without loading a speech model or starting audio. */
export function AnnouncementSettings({bridge, rows}: {bridge?: AnnouncementSettingsBridge; rows?: SpokenAnnouncement[]}) {
  const {t,tx}=useI18n();
  const native = bridge ?? window.desktop?.announcements;
  const [saved, setSaved] = useState<Settings>(() => normalizeAnnouncementSettings(undefined));
  const [interval, setIntervalValue] = useState('5');
  const [percent, setPercent] = useState('20');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey|''>('');
  const [message, setMessage] = useState<TranslationKey|''>('');
  const [communityRows, setCommunityRows] = useState<SpokenAnnouncement[]>([]);
  const [loaded, setLoaded] = useState(Boolean(rows));
  const [engine,setEngine]=useState({ready:false,name:''});
  const [testId,setTestId]=useState(''),[testError,setTestError]=useState(''),alive=useRef(true);
  const testing=useSpeechStatus(state=>state.testing),speaking=useSpeechStatus(state=>state.active);
  const status=useSpeechStatus(state=>state.message),german=usePreferences(state=>state.language==='de');
  const refreshTexts = useCallback(() => {
    setLoaded(getCommunityRuntimeSnapshot().loaded?.announcements === true);
    setCommunityRows(service.getSpoken(getCommunityAnnouncementRecords(), new Date()));
  }, []);

  useEffect(() => {
    if (rows) return;
    refreshTexts();
    return subscribeCommunityRuntime(refreshTexts);
  }, [rows, refreshTexts]);

  useEffect(() => {
    let active = true;
    setReady(false);
    void native?.engineStatus?.().then(value=>{if(active)setEngine(value)}).catch(()=>{if(active)setEngine({ready:false,name:''})});
    if (native) void native.readSettings().then(value => {
      if (!active) return;
      const settings = normalizeAnnouncementSettings(value);
      setSaved(settings);
      setIntervalValue(String(settings.intervalMinutes));
      setPercent(String(settings.musicRemainingPercent));
      setError('');setReady(true);
    }).catch(() => {if (active) setError('speechSettingsLoadError');});
    return () => {active = false;};
  }, [native]);

  async function save() {
    if (!native || !ready || busy) return;
    setMessage('');setError('');
    let value: Settings;
    try {
      if (!interval.trim() || !percent.trim()) throw Error('empty');
      value = validateAnnouncementSettings({...saved,
        intervalMinutes:Number(interval), musicRemainingPercent:Number(percent)});
    } catch {
      setError('speechSettingsValidation');
      return;
    }
    setBusy(true);
    try {
      const stored = validateAnnouncementSettings(await native.writeSettings(value));
      setSaved(stored);setMessage('speechSettingsSaved');
      window.dispatchEvent(new Event('gottesdienstregie:announcement-settings'));
    } catch {setError('speechSettingsSaveError');}
    finally {setBusy(false);}
  }

  const texts = rows ?? communityRows;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;stopAnnouncementTest()}},[]);
  const selectedMessage=texts.find(row=>row.id===testId),selectedProbe=selectedMessage??generalAnnouncementProbe;
  async function startProbe(){
    setTestError('');
    try{await startAnnouncementTest(selectedMessage?{kind:'message',id:selectedMessage.id}:{kind:'general'},Number(percent))}
    catch(reason){if(alive.current)setTestError(reason instanceof Error?reason.message:'Tonprobe fehlgeschlagen.')}
  }
  return <section className="settings-group announcement-preparation-settings" aria-labelledby="announcement-preparation-title">
    <h3 id="announcement-preparation-title">{t('speechSettingsHeading')}</h3>
    <p>{t('speechSettingsHelp')}</p>
    <p role="note">{german?tx("Die deutsche Stimme und ihre Laufzeit sind im Update enthalten. Keine zusätzliche Installation, kein Konto und keine Windows-Stimme erforderlich. Die neuen lokalen KI-Stimmen arbeiten offline mit kurzen Satzpausen und ruhigem Sprechtempo. Die erste automatische Durchsage erfolgt nach dem gespeicherten Intervall, nur während ON AIR im Vor- oder Nachprogramm."):'The German voice and its runtime are included in the update. No extra installation, account or Windows voice is needed. The new local neural voices work offline with short sentence pauses and a calm speaking pace. Automatic announcements start after the saved interval, only ON AIR in pre/post programs.'}</p>
    <p role="status">{(engine.name?tx(engine.name):null)||(german?tx("Mitgelieferte Stimme wird geprüft."):'Checking the included voice.')}</p>
    {status&&<p role="alert">{tx(status)}</p>}
    {!native && <p>{t('speechSettingsDesktopOnly')}</p>}
    <label>{german?tx("Ansagenstimme"):'Announcement voice'}<select disabled={!ready||busy||!engine.ready||testing||speaking} value={isBundledAnnouncementVoice(saved.voiceId)?saved.voiceId:bundledAnnouncementVoice} onChange={event=>{stopAnnouncementTest();setSaved(value=>({...value,voiceId:event.target.value,speakerId:0,voiceAccepted:true}));setMessage('')}}>{bundledVoices.map(voice=><option key={voice.id} value={voice.id}>{voice.name} · {german?tx("Deutsch"):'German'}</option>)}</select></label>
    <p>{german?tx("Die gespeicherte Stimme gilt auf diesem Regie-PC für alle Präsentationen und alle angemeldeten Benutzer. Alle fünf Stimmen sind enthalten. Nach dem Speichern verwendet auch die Tonprobe diese Auswahl."):'The saved voice applies to every presentation and signed-in operator on this control computer. All five voices are included. Save before testing the new selection.'}</p>
    <label><input type="checkbox" checked={saved.enabled} disabled={!ready||busy||(!saved.enabled&&!engine.ready)} onChange={event=>setSaved(value=>({...value,enabled:event.target.checked,...(event.target.checked?{voiceId:isBundledAnnouncementVoice(value.voiceId)?value.voiceId:bundledAnnouncementVoice,speakerId:0,voiceAccepted:true}:{})}))}/> {t('speechSettingsEnable')}</label>
    <label>{t('speechSettingsInterval')}<input className="settings-number-input" type="number" min="1" max="120" step="1" disabled={!ready || busy} value={interval} onChange={event => {setIntervalValue(event.target.value);setMessage('');}}/></label>
    <label>{t('speechSettingsMusicLevel')}<input className="settings-number-input" type="number" min="0" max="100" disabled={!ready || busy} value={percent} onChange={event => {setPercent(event.target.value);setMessage('');}}/></label>
    <p>{t('speechSettingsMusicHelp')}</p>
    <ReadingSettingsControls value={normalizeReadingSettings(saved.reading)} disabled={!ready||busy||testing||speaking} german={german} onChange={reading=>{setSaved(value=>({...value,reading}));setMessage('')}}/>
    <button type="button" disabled={!ready || busy} onClick={() => {void save();}}>{t('speechSettingsSave')}</button>
    {message && <p role="status">{t(message)}</p>}
    {error && <p role="alert">{t(error)}</p>}
    <fieldset className="announcement-test-controls">
      <legend>{german?tx("Ansagen testen"):'Test announcements'}</legend>
      <p>{german?tx("Tonprobe mit Gong und anschließendem Text über den eingestellten Background-Audio-Ausgang, auch OFF AIR. Laufende Hintergrundmusik wird dabei abgesenkt. Automatische Ansagen werden dadurch nicht eingeschaltet."):'Play the gong and selected text through Background Audio, including OFF AIR. Background music is attenuated; automatic announcements stay unchanged.'}</p>
      <label>{german?tx("Testtext"):'Test text'}<select value={selectedMessage?.id??''} disabled={testing} onChange={event=>{setTestId(event.target.value);setTestError('')}}>
        <option value="">{german?tx("Allgemeine Testdurchsage"):'General test announcement'}</option>
        {texts.map(row=><option key={row.id} value={row.id}>{row.title||row.text}</option>)}
      </select></label>
      <p style={{whiteSpace:'pre-wrap'}}>{selectedProbe.text}</p>
      <div className="announcement-test-actions"><button type="button" disabled={!ready||busy||!engine.ready||!native?.synthesize||testing||speaking} onClick={()=>{void startProbe()}}>{german?tx("Tonprobe starten"):'Start audio test'}</button>
      <button type="button" disabled={!testing} onClick={stopAnnouncementTest}>{german?tx("Tonprobe stoppen"):'Stop audio test'}</button></div>
      {testing&&<p role="status">{speaking?(german?tx("Tonprobe läuft …"):'Audio test playing …'):(german?tx("Tonprobe wird vorbereitet …"):'Preparing audio test …')}</p>}
      {testError&&<p role="alert">{tx(testError)}</p>}
    </fieldset>
    <h4>{t('speechSettingsPublicTexts')}</h4>
    <p>{t('speechSettingsPublicHelp')}</p>
    {!rows && <button type="button" onClick={refreshTexts}>{t('speechSettingsRefresh')}</button>}
    {texts.length ? <ol aria-label={t('speechSettingsPublicTexts')}>{texts.map(row => <li key={row.id}><strong>{(row.title||tx("Durchsage"))}</strong><p style={{whiteSpace:'pre-wrap'}}>{row.text}</p></li>)}</ol> : <p>{t(loaded || rows ? 'speechSettingsEmpty' : 'speechSettingsNotLoaded')}</p>}
  </section>;
}
