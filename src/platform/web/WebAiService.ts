import type { AiInferenceRequest, AiInferenceService, AiInferenceOptions } from '../../ai/AiInferenceService';
import { CapabilityUnavailableError } from '../types';

interface LocalRunner { generate(input: string, signal: AbortSignal): Promise<unknown> }
interface WebAiDependencies { supported: boolean; loadCached: (profile: AiInferenceRequest['profile']) => Promise<LocalRunner> }

export function supportsWebLocalAi() { return typeof navigator !== 'undefined' && 'gpu' in navigator && typeof indexedDB !== 'undefined' && typeof caches !== 'undefined'; }

async function loadCachedRunner(profile: AiInferenceRequest['profile']): Promise<LocalRunner> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowRemoteModels = false;
  const repository = profile === 'eco' ? 'onnx-community/Qwen2.5-0.5B-Instruct' : 'onnx-community/Qwen2.5-1.5B-Instruct';
  const generator = await pipeline('text-generation', repository, { dtype: profile === 'quality' ? 'fp16' : 'q4', device: 'webgpu', local_files_only: true });
  return { generate: async (input, signal) => { if (signal.aborted) throw new DOMException('aborted', 'AbortError'); return generator(input, { max_new_tokens: 768 }); } };
}

export class WebAiService implements AiInferenceService {
  constructor(private readonly dependencies: WebAiDependencies = { supported: supportsWebLocalAi(), loadCached: loadCachedRunner }) {}
  async generate(request: AiInferenceRequest, options: AiInferenceOptions) {
    if (!this.dependencies.supported) throw new CapabilityUnavailableError('localAi', { availability: 'unavailable', reason: 'Lokale KI wird von diesem Browser nicht unterstützt. Bitte verwende die Desktop-App.' });
    if (options.signal.aborted) throw new DOMException('aborted', 'AbortError');
    const runner = await this.dependencies.loadCached(request.profile);
    options.onProgress?.(25);
    const input = `${request.system}\n\nKontext:\n${JSON.stringify(request.context)}\n\nAuftrag:\n${request.prompt}`;
    const result = await runner.generate(input, options.signal);
    options.onProgress?.(100);
    return result;
  }
}
