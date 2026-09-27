import { useEffect, useState } from 'react';
import { usePreferences } from '../preferences';
import type { AiModelProfile } from './modelProfiles';

interface ModelStatus { state: 'missing' | 'ready'; profile?: AiModelProfile; version?: number; sizeBytes?: number }
interface ModelManager { status(): Promise<ModelStatus>; prepare(profile: AiModelProfile): Promise<unknown>; remove(): Promise<unknown> }
const labels: Record<AiModelProfile, string> = { eco: 'Ressourcenschonend', balanced: 'Ausgewogen', quality: 'Höhere Qualität' };

export function AiSettings({ supported, manager, clearHistory = () => {} }: { supported: boolean; manager?: ModelManager; clearHistory?: () => void }) {
  const preferences = usePreferences(state => state.aiAssistant); const set = usePreferences(state => state.setAiAssistant);
  const [status, setStatus] = useState<ModelStatus>({ state: 'missing' }); const [confirm, setConfirm] = useState<'model' | 'history'>(); const [busy, setBusy] = useState(false);
  const refresh = () => manager?.status().then(setStatus).catch(() => setStatus({ state: 'missing' }));
  useEffect(() => { void refresh(); }, [manager]);
  if (!supported) return <section><h3>Lokaler KI-Helfer</h3><div className="settings-group"><b>Dieser Browser unterstützt die lokale KI nicht vollständig.</b><p>Bitte verwende die Desktop-App. Präsentationsdaten werden nicht an einen Cloud-Dienst gesendet.</p></div></section>;
  const selected = preferences.modelPreference === 'auto' ? 'balanced' : preferences.modelPreference;
  return <section className="ai-settings"><h3>Lokaler KI-Helfer</h3><p>Kostenlos, lokal und nach dem Modelldownload offline nutzbar. Die automatische Auswahl ist empfohlen.</p>
    <div className="settings-group"><label>Modellwahl<select aria-label="Modellwahl" value={preferences.modelPreference} onChange={event => set({ modelPreference: event.target.value as typeof preferences.modelPreference })}><option value="auto">Automatisch (empfohlen)</option><option value="eco">Ressourcenschonend</option><option value="balanced">Ausgewogen</option><option value="quality">Höhere Qualität</option></select></label>
      <fieldset><legend>Änderungsmodus</legend><label><input type="radio" name="ai-mode" checked={preferences.executionMode === 'confirm'} onChange={() => set({ executionMode: 'confirm' })}/>Vorher bestätigen</label><label><input aria-label="Direkt anwenden" type="radio" name="ai-mode" checked={preferences.executionMode === 'direct'} onChange={() => set({ executionMode: 'direct' })}/>Direkt anwenden</label></fieldset>
      <label className="setting-check"><input aria-label="Medienvorschläge zulassen" type="checkbox" checked={preferences.allowMediaSuggestions} onChange={event => set({ allowMediaSuggestions: event.target.checked })}/><span><b>Medienvorschläge zulassen</b></span></label>
      <label className="setting-check"><input type="checkbox" checked={preferences.allowTranslations} onChange={event => set({ allowTranslations: event.target.checked })}/><span><b>Übersetzungen vorbereiten</b></span></label>
      <label className="setting-check"><input type="checkbox" checked={preferences.includePresentationContext} onChange={event => set({ includePresentationContext: event.target.checked })}/><span><b>Präsentationsinhalte als Kontext verwenden</b></span></label>
      <label className="setting-check"><input type="checkbox" checked={preferences.clearHistoryOnClose} onChange={event => set({ clearHistoryOnClose: event.target.checked })}/><span><b>Chatverlauf beim Schließen löschen</b></span></label>
    </div>
    <div className="settings-group"><h4>LOKALES MODELL</h4>{status.state === 'ready' ? <p><b>{labels[status.profile ?? selected]}</b><br/>Version {status.version ?? 1} · {new Intl.NumberFormat('de-DE', { style: 'unit', unit: 'megabyte', maximumFractionDigits: 0 }).format((status.sizeBytes ?? 0) / 1024 / 1024)}</p> : <p>Noch kein lokales Modell installiert.</p>}
      <button type="button" disabled={!manager || busy} onClick={() => { if (!manager) return; setBusy(true); void Promise.resolve(manager.prepare(selected)).then(refresh).finally(() => setBusy(false)); }}>{status.state === 'ready' ? 'Modell aktualisieren' : 'Modell herunterladen'}</button>
      <button type="button" disabled={!manager || status.state !== 'ready'} onClick={() => setConfirm('model')}>Lokales Modell entfernen</button>
      <button type="button" onClick={() => setConfirm('history')}>Lokalen KI-Verlauf löschen</button>
      <details><summary>Technische Details</summary><p>Qwen2.5 Instruct · ONNX · Apache-2.0 · Profil {labels[selected]}. Die Verarbeitung erfolgt lokal.</p></details>
    </div>
    {confirm && <div className="settings-confirm" role="dialog" aria-modal="true"><p>{confirm === 'model' ? 'Das Modell muss vor der nächsten Nutzung erneut heruntergeladen werden.' : 'Der lokale Chatverlauf wird dauerhaft gelöscht.'}</p><button type="button" onClick={() => setConfirm(undefined)}>Abbrechen</button><button type="button" aria-label={confirm === 'model' ? 'Entfernen bestätigen' : 'Verlauf löschen bestätigen'} onClick={() => { if (confirm === 'model' && manager) void Promise.resolve(manager.remove()).then(refresh); else clearHistory(); setConfirm(undefined); }}>{confirm === 'model' ? 'Entfernen' : 'Verlauf löschen'}</button></div>}
  </section>;
}
