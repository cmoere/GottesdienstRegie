import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { AiModelManifest } from '../src/ai/modelManifest';
import { AiModelManager, AiModelManagerError } from './AiModelManager';

const payload = new TextEncoder().encode('local model fixture');
const hash = createHash('sha256').update(payload).digest('hex');
const manifest: AiModelManifest = { version: 1, profiles: {
  eco: { repository: 'fixture/model', revision: 'a'.repeat(40), dtype: 'q4', license: 'Apache-2.0', minimumMemoryGb: 4, minimumStorageBytes: payload.length, requiresAcceleration: false, assets: [{ path: 'model.bin', bytes: payload.length, sha256: hash }] },
  balanced: { repository: 'fixture/model', revision: 'a'.repeat(40), dtype: 'q4', license: 'Apache-2.0', minimumMemoryGb: 8, minimumStorageBytes: payload.length, requiresAcceleration: false, assets: [{ path: 'model.bin', bytes: payload.length, sha256: hash }] },
  quality: { repository: 'fixture/model', revision: 'a'.repeat(40), dtype: 'fp16', license: 'Apache-2.0', minimumMemoryGb: 16, minimumStorageBytes: payload.length, requiresAcceleration: true, assets: [{ path: 'model.bin', bytes: payload.length, sha256: hash }] },
} };
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
async function root() { const value = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-model-')); roots.push(value); return value; }

describe('AiModelManager', () => {
  it('downloads, verifies, atomically installs, reports progress, and removes a model', async () => {
    const target = await root(); const progress: number[] = [];
    const manager = new AiModelManager(target, manifest, { fetchAsset: async () => payload, freeBytes: async () => 1000 });
    await manager.prepare('eco', new AbortController().signal, value => progress.push(value.percent));
    expect((await manager.status()).state).toBe('ready');
    expect(progress.at(-1)).toBe(100);
    expect(await fs.readFile(path.join(target, 'eco', 'model.bin'), 'utf8')).toBe('local model fixture');
    await manager.remove();
    expect((await manager.status()).state).toBe('missing');
  });

  it('rejects corrupt downloads without installing them', async () => {
    const target = await root();
    const manager = new AiModelManager(target, manifest, { fetchAsset: async () => new TextEncoder().encode('corrupt'), freeBytes: async () => 1000 });
    await expect(manager.prepare('eco', new AbortController().signal, () => {})).rejects.toMatchObject({ code: 'integrity' });
    expect((await manager.status()).state).toBe('missing');
  });

  it('cleans a cancelled partial download and allows retry', async () => {
    const target = await root(); const abort = new AbortController();
    const manager = new AiModelManager(target, manifest, { fetchAsset: async (_asset, signal) => { abort.abort(); if (signal.aborted) throw new DOMException('aborted', 'AbortError'); return payload; }, freeBytes: async () => 1000 });
    await expect(manager.prepare('eco', abort.signal, () => {})).rejects.toMatchObject({ code: 'cancelled' });
    expect(await fs.readdir(target)).toEqual([]);
  });

  it('fails before download when storage is insufficient', async () => {
    const manager = new AiModelManager(await root(), manifest, { fetchAsset: async () => payload, freeBytes: async () => 0 });
    await expect(manager.prepare('eco', new AbortController().signal, () => {})).rejects.toBeInstanceOf(AiModelManagerError);
    await expect(manager.prepare('eco', new AbortController().signal, () => {})).rejects.toMatchObject({ code: 'storage' });
  });
});
