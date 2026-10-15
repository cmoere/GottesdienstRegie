import {useCallback, useEffect, useState} from 'react';
import {AnnouncementService} from '../community/AnnouncementService';
import {getCommunityAnnouncementRecords, getCommunityRuntimeSnapshot, subscribeCommunityRuntime} from '../community/communityRuntime';
import {normalizeAnnouncementSettings, validateAnnouncementSettings} from './settings';
import type {AnnouncementSettings as Settings, AnnouncementSettingsBridge} from './settings';
import type {SpokenAnnouncement} from './types';

const service = new AnnouncementService();

/** Preparatory controls remain usable without loading a speech model or starting audio. */
export function AnnouncementSettings({bridge, rows}: {bridge?: AnnouncementSettingsBridge; rows?: SpokenAnnouncement[]}) {
  const native = bridge ?? window.desktop?.announcements;
  const [saved, setSaved] = useState<Settings>(() => normalizeAnnouncementSettings(undefined));
  const [interval, setIntervalValue] = useState('5');
  const [percent, setPercent] = useState('20');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
    }).catch(() => {if (active) setError('Ansageneinstellungen konnten nicht geladen werden.');});
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
      setError('Bitte ein Intervall von 1 bis 120 Minuten und einen Musikpegel von 0 bis 100 Prozent eingeben.');
      return;
    }
    setBusy(true);
    try {
      const stored = validateAnnouncementSettings(await native.writeSettings(value));
      if (stored.enabled) throw Error('activation refused');
      setSaved(stored);setMessage('Einstellungen gespeichert.');
    } catch {setError('Ansageneinstellungen konnten nicht gespeichert werden.');}
    finally {setBusy(false);}
  }

  const texts = rows ?? communityRows;
  return <section className="settings-group" aria-labelledby="announcement-preparation-title">
    <h3 id="announcement-preparation-title">ANSAGEN</h3>
    <p>Durchsagen laufen nur im Vor- und Nachprogramm. Musik und Hintergrundaudio werden während Gong und Durchsage auf den eingestellten Pegel abgesenkt und danach wiederhergestellt.</p>
    <p role="note">Vorbereitung: Die Sprachausgabe bleibt deaktiviert, bis eine lokale Sprachengine geprüft ist. Es wird keine Stimme automatisch gewählt und kein Sprachpaket heruntergeladen.</p>
    {!native && <p>Diese Einstellungen können in der Desktop-Version gespeichert werden.</p>}
    <label><input type="checkbox" checked={false} disabled readOnly/> Automatische Ansagen aktivieren</label>
    <label>Intervall (Minuten)<input className="settings-number-input" type="number" min="1" max="120" step="1" disabled={!ready || busy} value={interval} onChange={event => {setIntervalValue(event.target.value);setMessage('');}}/></label>
    <label>Musikpegel während der Ansage (%)<input className="settings-number-input" type="number" min="0" max="100" disabled={!ready || busy} value={percent} onChange={event => {setPercent(event.target.value);setMessage('');}}/></label>
    <p>20 % bedeutet: Ein Fünftel des sonst gültigen Musikpegels bleibt hörbar. Stummschaltung und eine stärkere Videoabsenkung behalten Vorrang. Die Einstellung gilt für diesen Regie-PC.</p>
    <button type="button" disabled={!ready || busy} onClick={() => {void save();}}>Ansageneinstellungen speichern</button>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <h4>Freigegebene Saaltexte</h4>
    <p>Lesbare Texte aus den zentral geladenen Gemeindemeldungen; keine Rückschreibung nach Firebase. Die Anzeige allein startet keine Durchsage.</p>
    {!rows && <button type="button" onClick={refreshTexts}>Texte aktualisieren</button>}
    {texts.length ? <ol aria-label="Freigegebene Saaltexte">{texts.map(row => <li key={row.id}><strong>{row.title || 'Durchsage'}</strong><p style={{whiteSpace:'pre-wrap'}}>{row.text}</p></li>)}</ol> : <p>{loaded || rows ? 'Keine gültigen Saal-Durchsagen vorhanden.' : 'Gemeindemeldungen sind noch nicht geladen.'}</p>}
  </section>;
}
