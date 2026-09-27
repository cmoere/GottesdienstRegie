import type { AiAssistantContext } from './contextBuilder';
import type { AiModelProfile } from './modelProfiles';

export interface AiInferenceRequest { system: string; prompt: string; context: AiAssistantContext; profile: AiModelProfile }
export interface AiInferenceOptions { signal: AbortSignal; onProgress?: (percent: number) => void }
export interface AiInferenceService { generate(request: AiInferenceRequest, options: AiInferenceOptions): Promise<unknown> }
