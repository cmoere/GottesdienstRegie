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

  const texts = rows ?? communityRows;
  return <section className="settings-group announcement-preparation-settings" aria-labelledby="announcement-preparation-title">
    <h3 id="announcement-preparation-title">{t('speechSettingsHeading')}</h3>
    <p>{t('speechSettingsHelp')}</p>
    <p role="note">{german?'Die deutsche Stimme und ihre Laufzeit sind im Update enthalten. Keine zusätzliche Installation, kein Konto und keine Windows-Stimme erforderlich. Die Sprachausgabe arbeitet offline mit klassischen Sprachaufnahmen. Die erste automatische Durchsage erfolgt nach dem gespeicherten Intervall, nur während ON AIR im Vor- oder Nachprogramm.':'The German voice and its runtime are included in the update. No extra installation, account or Windows voice is needed. Speech is generated offline using classical recorded speech segments. Automatic announcements start after the saved interval, only ON AIR in pre/post programs.'}</p>
    <p role="status">{engine.name||(german?'Mitgelieferte Stimme wird geprüft.':'Checking the included voice.')}</p>
    {status&&<p role="alert">{status}</p>}
    {!native && <p>{t('speechSettingsDesktopOnly')}</p>}
    <label><input type="checkbox" checked={saved.enabled} disabled={!ready||busy||(!saved.enabled&&!engine.ready)} onChange={event=>setSaved(value=>({...value,enabled:event.target.checked,...(event.target.checked?{voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true}:{})}))}/> {t('speechSettingsEnable')}</label>
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
