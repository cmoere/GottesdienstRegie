import type { AiInferenceRequest, AiInferenceService, AiInferenceOptions } from '../../ai/AiInferenceService';

export interface ElectronAiBridge { generate(request: AiInferenceRequest): Promise<unknown>; cancel(): Promise<boolean> }
export interface ElectronAiModelBridge { status(): Promise<{ state: string; profile?: string }>; prepare(profile: AiInferenceRequest['profile']): Promise<unknown> }
export class ElectronAiService implements AiInferenceService {
  constructor(private readonly bridge: ElectronAiBridge, private readonly models?: ElectronAiModelBridge) {}
  async generate(request: AiInferenceRequest, options: AiInferenceOptions) {
    const cancel = () => { void this.bridge.cancel(); };
    options.signal.addEventListener('abort', cancel, { once: true });
    try {
      options.onProgress?.(5);
      if (this.models) {
        const status = await this.models.status();
        if (status.state !== 'ready' || status.profile !== request.profile) await this.models.prepare(request.profile);
      }
      options.onProgress?.(20);
      const result = await this.bridge.generate(request); options.onProgress?.(100); return result;
    }
    finally { options.signal.removeEventListener('abort', cancel); }
  }
}
