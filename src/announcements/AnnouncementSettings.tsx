import {useCallback, useEffect, useState} from 'react';
import {AnnouncementService} from '../community/AnnouncementService';
import {getCommunityAnnouncementRecords, getCommunityRuntimeSnapshot, subscribeCommunityRuntime} from '../community/communityRuntime';
import {normalizeAnnouncementSettings, validateAnnouncementSettings} from './settings';
import type {AnnouncementSettings as Settings, AnnouncementSettingsBridge} from './settings';
import type {SpokenAnnouncement} from './types';
import {useI18n} from '../i18n';
import type {TranslationKey} from '../i18n';
import './announcement-preparation.css';
import {useSpeechStatus} from './AnnouncementIndicator';
import {usePreferences} from '../preferences';

const service = new AnnouncementService();

/** Preparatory controls remain usable without loading a speech model or starting audio. */
export function AnnouncementSettings({bridge, rows}: {bridge?: AnnouncementSettingsBridge; rows?: SpokenAnnouncement[]}) {
  const {t}=useI18n();
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

  async function chooseEngine(){
    if(!native?.chooseEngine||!ready||busy)return;
    setBusy(true);window.dispatchEvent(new Event('gottesdienstregie:announcement-stop'));
    try{
      const result=await native.chooseEngine();setEngine(result);
      setSaved(value=>({...value,enabled:false,...(result.ready?{voiceId:'espeak-ng:de',speakerId:0,voiceAccepted:true}:{})}));
      window.dispatchEvent(new Event('gottesdienstregie:announcement-settings'));
    }catch{setError('speechSettingsLoadError')}
    finally{setBusy(false)}
  }
  const texts = rows ?? communityRows;
  return <section className="settings-group announcement-preparation-settings" aria-labelledby="announcement-preparation-title">
    <h3 id="announcement-preparation-title">{t('speechSettingsHeading')}</h3>
    <p>{t('speechSettingsHelp')}</p>
    <p role="note">{german?'Lokale deutsche eSpeak-NG-Stimme ohne KI-Modell und ohne Windows-Stimme. eSpeak NG separat installieren und das Programm auswählen. Die Stimme klingt synthetisch. Die erste automatische Durchsage erfolgt nach dem gespeicherten Intervall, nur während ON AIR im Vor- oder Nachprogramm.':'Local German eSpeak NG voice, without an AI model or Windows voice. Install eSpeak NG separately and select its executable. The voice sounds synthetic. Automatic announcements start after the saved interval, only ON AIR in pre/post programs.'}</p>
    <button type="button" disabled={!ready||busy||!native?.chooseEngine} onClick={()=>{void chooseEngine()}}>{german?'eSpeak NG auswählen':'Select eSpeak NG'}</button>
    <button type="button" onClick={()=>{void window.desktop?.openExternal('https://github.com/espeak-ng/espeak-ng/releases')}}>{german?'eSpeak-NG-Downloadseite':'eSpeak NG downloads'}</button>
    <p>{engine.name||(german?'eSpeak NG nicht eingerichtet. Keine automatische Ersatzstimme.':'eSpeak NG not configured. No automatic fallback voice.')}</p>
    {status&&<p role="alert">{status}</p>}
    {!native && <p>{t('speechSettingsDesktopOnly')}</p>}
    <label><input type="checkbox" checked={saved.enabled&&saved.voiceId==='espeak-ng:de'} disabled={!ready||busy||(!saved.enabled&&(!engine.ready||saved.voiceId!=='espeak-ng:de'))} onChange={event=>setSaved(value=>({...value,enabled:event.target.checked}))}/> {t('speechSettingsEnable')}</label>
    <label>{t('speechSettingsInterval')}<input className="settings-number-input" type="number" min="1" max="120" step="1" disabled={!ready || busy} value={interval} onChange={event => {setIntervalValue(event.target.value);setMessage('');}}/></label>
    <label>{t('speechSettingsMusicLevel')}<input className="settings-number-input" type="number" min="0" max="100" disabled={!ready || busy} value={percent} onChange={event => {setPercent(event.target.value);setMessage('');}}/></label>
    <p>{t('speechSettingsMusicHelp')}</p>
    <button type="button" disabled={!ready || busy} onClick={() => {void save();}}>{t('speechSettingsSave')}</button>
    {message && <p role="status">{t(message)}</p>}
    {error && <p role="alert">{t(error)}</p>}
    <h4>{t('speechSettingsPublicTexts')}</h4>
    <p>{t('speechSettingsPublicHelp')}</p>
    {!rows && <button type="button" onClick={refreshTexts}>{t('speechSettingsRefresh')}</button>}
    {texts.length ? <ol aria-label={t('speechSettingsPublicTexts')}>{texts.map(row => <li key={row.id}><strong>{row.title || 'Durchsage'}</strong><p style={{whiteSpace:'pre-wrap'}}>{row.text}</p></li>)}</ol> : <p>{t(loaded || rows ? 'speechSettingsEmpty' : 'speechSettingsNotLoaded')}</p>}
  </section>;
}
