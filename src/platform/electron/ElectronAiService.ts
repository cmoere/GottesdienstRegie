import type { AiInferenceRequest, AiInferenceService, AiInferenceOptions } from '../../ai/AiInferenceService';

export interface ElectronAiBridge { generate(request: AiInferenceRequest): Promise<unknown>; cancel(): Promise<boolean> }
export class ElectronAiService implements AiInferenceService {
  constructor(private readonly bridge: ElectronAiBridge) {}
  async generate(request: AiInferenceRequest, options: AiInferenceOptions) {
    const cancel = () => { void this.bridge.cancel(); };
    options.signal.addEventListener('abort', cancel, { once: true });
    try { options.onProgress?.(10); const result = await this.bridge.generate(request); options.onProgress?.(100); return result; }
    finally { options.signal.removeEventListener('abort', cancel); }
  }
}
