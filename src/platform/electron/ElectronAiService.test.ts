import { describe, expect, it, vi } from 'vitest';
import { ElectronAiService } from './ElectronAiService';

describe('ElectronAiService', () => {
  it('prepares the requested local model before first generation', async () => {
    const bridge = { generate: vi.fn(async () => ({ message: 'ok' })), cancel: vi.fn(async () => true) };
    const models = { status: vi.fn(async () => ({ state: 'missing' as const })), prepare: vi.fn(async () => undefined) };
    const service = new ElectronAiService(bridge, models);
    await service.generate({ system: 's', prompt: 'p', context: { language: 'de', truncated: false }, profile: 'eco' }, { signal: new AbortController().signal });
    expect(models.prepare).toHaveBeenCalledWith('eco');
    expect(bridge.generate).toHaveBeenCalledOnce();
  });

  it('does not download an already matching model again', async () => {
    const bridge = { generate: vi.fn(async () => ({ message: 'ok' })), cancel: vi.fn(async () => true) };
    const models = { status: vi.fn(async () => ({ state: 'ready' as const, profile: 'balanced' as const })), prepare: vi.fn() };
    const service = new ElectronAiService(bridge, models);
    await service.generate({ system: 's', prompt: 'p', context: { language: 'de', truncated: false }, profile: 'balanced' }, { signal: new AbortController().signal });
    expect(models.prepare).not.toHaveBeenCalled();
  });
});
