import { describe, expect, it, vi } from 'vitest';
import { CapabilityUnavailableError } from '../types';
import { WebAiService } from './WebAiService';

const request = { system: 'Stay safe', prompt: 'Create a welcome slide', context: { language: 'de', truncated: false }, profile: 'eco' as const };

describe('WebAiService', () => {
  it('rejects unsupported browsers without network activity and recommends desktop', async () => {
    const network = vi.spyOn(globalThis, 'fetch');
    const service = new WebAiService({ supported: false, loadCached: vi.fn() });
    await expect(service.generate(request, { signal: new AbortController().signal })).rejects.toMatchObject({
      name: 'CapabilityUnavailableError', capability: 'localAi', state: { availability: 'unavailable' },
    } satisfies Partial<CapabilityUnavailableError>);
    expect(network).not.toHaveBeenCalled();
    network.mockRestore();
  });

  it('uses only a cached local runner and honors cancellation', async () => {
    const abort = new AbortController();
    const generate = vi.fn(async (_input: string, signal: AbortSignal) => { abort.abort(); if (signal.aborted) throw new DOMException('aborted', 'AbortError'); return {}; });
    const loadCached = vi.fn(async () => ({ generate }));
    const service = new WebAiService({ supported: true, loadCached });
    await expect(service.generate(request, { signal: abort.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(loadCached).toHaveBeenCalledWith('eco');
  });
});
