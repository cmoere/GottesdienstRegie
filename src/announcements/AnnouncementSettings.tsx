import {useCallback, useEffect, useState} from 'react';
import {AnnouncementService} from '../community/AnnouncementService';
import {getCommunityAnnouncementRecords, getCommunityRuntimeSnapshot, subscribeCommunityRuntime} from '../community/communityRuntime';
import {normalizeAnnouncementSettings, validateAnnouncementSettings} from './settings';
import type {AnnouncementSettings as Settings, AnnouncementSettingsBridge} from './settings';
import type {SpokenAnnouncement} from './types';
import {useI18n} from '../i18n';
import type {TranslationKey} from '../i18n';
import './announcement-preparation.css';

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
      value = validateAnnouncementSettings({...saved, enabled:false,
        intervalMinutes:Number(interval), musicRemainingPercent:Number(percent)});
    } catch {
      setError('speechSettingsValidation');
      return;
    }
    setBusy(true);
    try {
      const stored = validateAnnouncementSettings(await native.writeSettings(value));
      if (stored.enabled) throw Error('activation refused');
      setSaved(stored);setMessage('speechSettingsSaved');
    } catch {setError('speechSettingsSaveError');}
    finally {setBusy(false);}
  }

  const texts = rows ?? communityRows;
  return <section className="settings-group announcement-preparation-settings" aria-labelledby="announcement-preparation-title">
    <h3 id="announcement-preparation-title">{t('speechSettingsHeading')}</h3>
    <p>{t('speechSettingsHelp')}</p>
    <p role="note">{t('speechSettingsPreparation')}</p>
    {!native && <p>{t('speechSettingsDesktopOnly')}</p>}
    <label><input type="checkbox" checked={false} disabled readOnly/> {t('speechSettingsEnable')}</label>
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
