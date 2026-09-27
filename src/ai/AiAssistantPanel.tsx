import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import type { createAssistantController } from './assistantController';
import type { AiAssistantStore } from './assistantStore';
import { AiChangePreview } from './AiChangePreview';
import { usePreferences } from '../preferences';
import { AI_QUICK_ACTIONS, buildAssistantPrompt } from './assistantPrompts';

type Controller = ReturnType<typeof createAssistantController>;
export function AiAssistantPanel({ open, onClose, store, controller }: { open: boolean; onClose(): void; store: AiAssistantStore; controller: Controller }) {
  const state = useStore(store); const [prompt, setPrompt] = useState(''); const input = useRef<HTMLTextAreaElement>(null);
  const language = usePreferences(value => value.language); const permissions = usePreferences(value => value.aiAssistant);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  if (!open) return null;
  const submit = () => { const value = prompt.trim(); if (!value || state.busy) return; setPrompt(''); void controller.send(value); };
  return <div className="ai-assistant-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="ai-assistant-panel" role="dialog" aria-modal="true" aria-label="KI-Helfer">
      <header><div><small>LOKAL · OHNE API-SCHLÜSSEL</small><h2>KI-Helfer</h2></div><button type="button" aria-label="KI-Helfer schließen" onClick={onClose}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></header>
      <div className="ai-quick-actions">{AI_QUICK_ACTIONS.map(action => <button type="button" key={action.id} onClick={() => void controller.send(buildAssistantPrompt(action.id,{ scope:action.id==='rewrite'?'selected-slide':'presentation',language,allowMediaSuggestions:permissions.allowMediaSuggestions,allowTranslations:permissions.allowTranslations }))} disabled={state.busy}>{action.label}</button>)}</div>
      <div className="ai-messages" aria-live="polite">{state.messages.length ? state.messages.map(item => <article className={item.role} key={item.id}><small>{item.role === 'user' ? 'DU' : 'KI-HELFER'}</small><p>{item.content}</p></article>) : <p className="ai-empty">Frage etwas oder lasse Inhalte für deine Präsentation vorbereiten.</p>}</div>
      {state.pendingPlan && <div className="ai-plan"><AiChangePreview plan={state.pendingPlan}/><div><button type="button" onClick={() => controller.reject(state.pendingPlan!.id)}>Verwerfen</button><button type="button" className="primary" onClick={() => void controller.confirm(state.pendingPlan!.id)}>Änderungen anwenden</button></div></div>}
      {state.error && <div className="ai-error" role="alert"><span>{state.error}</span><button type="button" onClick={() => void controller.retry()}>Erneut versuchen</button></div>}
      {state.busy && <div className="ai-progress" role="status"><span>Lokale KI arbeitet</span><b>{Math.round(state.progress)} %</b><progress max="100" value={state.progress}/><button type="button" onClick={controller.cancel}>Abbrechen</button></div>}
      <footer><textarea ref={input} aria-label="Auftrag an den KI-Helfer" value={prompt} maxLength={5000} rows={3} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }}/><div><small>{prompt.length}/5000</small><button type="button" className="primary" disabled={!prompt.trim() || state.busy} onClick={submit}>Senden</button></div></footer>
    </aside>
  </div>;
}
