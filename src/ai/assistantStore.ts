import { createStore, type StoreApi } from 'zustand/vanilla';
import type { AiActionPlan } from './actionSchema';

export interface AiChatMessage { id: string; role: 'user' | 'assistant'; content: string; createdAt: number }
export interface AiAssistantState {
  messages: AiChatMessage[];
  busy: boolean;
  progress: number;
  error?: string;
  pendingPlan?: AiActionPlan;
  lastPrompt?: string;
  undoUntil?: number;
}

const initial: AiAssistantState = { messages: [], busy: false, progress: 0 };
export type AiAssistantStore = StoreApi<AiAssistantState>;

export function createAssistantStore(storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): AiAssistantStore {
  let saved: AiChatMessage[] = [];
  try { saved = JSON.parse(storage?.getItem('gottesdienstregie.ai-chat') ?? '[]') as AiChatMessage[]; } catch { saved = []; }
  const store = createStore<AiAssistantState>(() => ({ ...initial, messages: Array.isArray(saved) ? saved : [] }));
  store.subscribe(state => { try { storage?.setItem('gottesdienstregie.ai-chat', JSON.stringify(state.messages)); } catch { /* local history is best effort */ } });
  return store;
}

export const assistantStore = createAssistantStore(typeof localStorage === 'undefined' ? undefined : localStorage);
