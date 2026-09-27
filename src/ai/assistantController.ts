import type { AiInferenceService } from './AiInferenceService';
import type { AiAssistantContext } from './contextBuilder';
import type { AiModelProfile, AiExecutionMode } from './modelProfiles';
import { parseAiAssistantResponse, type AiActionPlan } from './actionSchema';
import type { AiApplyResult } from './actionExecutor';
import type { AiAssistantStore, AiChatMessage } from './assistantStore';

interface Dependencies {
  inference: AiInferenceService;
  store: AiAssistantStore;
  getContext(): AiAssistantContext;
  getProfile(): AiModelProfile;
  getExecutionMode(): AiExecutionMode;
  getRevision(): number;
  applyPlan(plan: AiActionPlan, currentRevision: number): AiApplyResult;
}

const message = (role: AiChatMessage['role'], content: string): AiChatMessage => ({ id: crypto.randomUUID(), role, content, createdAt: Date.now() });
const system = 'Du bist der lokale KI-Helfer von GottesdienstRegie. Antworte ausschließlich als gültiges JSON im freigegebenen Antwortschema. Führe keine externen Aktionen aus und erfinde keine Bibeltexte.';

function unwrapGeneratedResponse(raw: unknown): unknown {
  const candidate = Array.isArray(raw) && raw.length === 1 && raw[0] && typeof raw[0] === 'object' && 'generated_text' in raw[0]
    ? (raw[0] as { generated_text: unknown }).generated_text : raw;
  if (typeof candidate !== 'string') return candidate;
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const text = fenced ?? candidate;
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return candidate;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return candidate; }
}

export function createAssistantController(dependencies: Dependencies) {
  let active: AbortController | undefined;
  const patch = (value: Partial<ReturnType<typeof dependencies.store.getState>>) => dependencies.store.setState(value);
  const apply = (plan: AiActionPlan) => {
    const result = dependencies.applyPlan(plan, dependencies.getRevision());
    if (!result.ok) { patch({ error: result.code === 'stale-plan' ? 'Die Präsentation wurde geändert. Bitte berechne den Vorschlag neu.' : 'Der Vorschlag konnte nicht vollständig angewendet werden.', pendingPlan: undefined }); return result; }
    patch({ pendingPlan: undefined, undoUntil: Date.now() + 5000, error: undefined }); return result;
  };
  const send = async (prompt: string) => {
    const state = dependencies.store.getState();
    if (state.busy) throw new Error('Ein KI-Auftrag läuft bereits.');
    const trimmed = prompt.trim(); if (!trimmed) return;
    active = new AbortController(); const controller = active;
    patch({ busy: true, progress: 0, error: undefined, lastPrompt: trimmed, messages: [...state.messages, message('user', trimmed)] });
    try {
      const raw = await dependencies.inference.generate({ system, prompt: trimmed, context: dependencies.getContext(), profile: dependencies.getProfile() }, { signal: controller.signal, onProgress: progress => patch({ progress }) });
      if (controller.signal.aborted) return;
      const response = parseAiAssistantResponse(unwrapGeneratedResponse(raw));
      patch({ messages: [...dependencies.store.getState().messages, message('assistant', response.message)], progress: 100 });
      if (response.plan) dependencies.getExecutionMode() === 'direct' ? apply(response.plan) : patch({ pendingPlan: response.plan });
    } catch (error) {
      if (!(controller.signal.aborted || error instanceof DOMException && error.name === 'AbortError')) patch({ error: 'Die Antwort konnte nicht sicher interpretiert werden. Bitte versuche es erneut.' });
    } finally { if (active === controller) active = undefined; patch({ busy: false }); }
  };
  return {
    send,
    cancel() { active?.abort(); patch({ busy: false, error: 'Auftrag wurde abgebrochen.' }); },
    retry() { const prompt = dependencies.store.getState().lastPrompt; return prompt ? send(prompt) : Promise.resolve(); },
    confirm(planId: string) { const plan = dependencies.store.getState().pendingPlan; return Promise.resolve(plan?.id === planId ? apply(plan) : { ok: false as const, code: 'invalid-target' as const }); },
    reject(planId: string) { if (dependencies.store.getState().pendingPlan?.id === planId) patch({ pendingPlan: undefined }); },
    clearHistory() { patch({ messages: [], pendingPlan: undefined, error: undefined }); },
  };
}
