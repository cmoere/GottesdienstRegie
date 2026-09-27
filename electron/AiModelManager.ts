import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { AI_MODEL_MANIFEST, type AiModelAsset, type AiModelManifest } from '../src/ai/modelManifest';
import type { AiModelProfile } from '../src/ai/modelProfiles';

export type AiModelStatus = { state: 'missing' | 'ready'; profile?: AiModelProfile; version?: number; sizeBytes?: number; directory?: string };
export interface AiModelProgress { phase: 'downloading' | 'verifying' | 'installing'; receivedBytes: number; totalBytes: number; percent: number }
export class AiModelManagerError extends Error { constructor(public readonly code: 'storage' | 'integrity' | 'cancelled' | 'download', message: string) { super(message); this.name = 'AiModelManagerError'; } }

type AssetSource = Uint8Array | AsyncIterable<Uint8Array>;
interface Dependencies { fetchAsset?: (url: string, signal: AbortSignal, offset: number, asset: AiModelAsset) => Promise<AssetSource>; freeBytes?: (root: string) => Promise<number> }

async function defaultFetch(url: string, signal: AbortSignal, offset: number): Promise<AsyncIterable<Uint8Array>> {
  const response = await fetch(url, { signal, headers: offset ? { Range: `bytes=${offset}-` } : undefined });
  if (!response.ok || !response.body) throw new AiModelManagerError('download', `Modelldownload fehlgeschlagen (${response.status}).`);
  return { async *[Symbol.asyncIterator]() { const reader = response.body!.getReader(); for (;;) { const { done, value } = await reader.read(); if (done) break; if (value) yield value; } } };
}
async function sha256(file: string) { const hash = createHash('sha256'); for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer); return hash.digest('hex'); }

export class AiModelManager {
  constructor(private readonly root: string, private readonly manifest: AiModelManifest = AI_MODEL_MANIFEST, private readonly dependencies: Dependencies = {}) {}

  async status(): Promise<AiModelStatus> {
    for (const profile of Object.keys(this.manifest.profiles) as AiModelProfile[]) {
      const directory = path.join(this.root, profile);
      try { const metadata = JSON.parse(await fs.readFile(path.join(directory, 'installed.json'), 'utf8')) as { version: number; sizeBytes: number }; return { state: 'ready', profile, version: metadata.version, sizeBytes: metadata.sizeBytes, directory }; } catch { /* not installed */ }
    }
    return { state: 'missing' };
  }

  async prepare(profile: AiModelProfile, signal: AbortSignal, onProgress: (progress: AiModelProgress) => void) {
    const model = this.manifest.profiles[profile];
    const totalBytes = model.assets.reduce((sum, asset) => sum + asset.bytes, 0);
    await fs.mkdir(this.root, { recursive: true });
    const free = await (this.dependencies.freeBytes ?? (async root => (await fs.statfs(root)).bavail * (await fs.statfs(root)).bsize))(this.root);
    if (free < totalBytes * 1.05) throw new AiModelManagerError('storage', 'Nicht genügend freier Speicher für das lokale KI-Modell.');
    const staging = path.join(this.root, `${profile}.partial`);
    let receivedBytes = 0;
    try {
      await fs.mkdir(staging, { recursive: true });
      for (const asset of model.assets) {
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const destination = path.join(staging, asset.path); await fs.mkdir(path.dirname(destination), { recursive: true });
        let offset = 0; try { offset = Math.min(asset.bytes, (await fs.stat(destination)).size); } catch { /* new file */ }
        receivedBytes += offset;
        const source = await (this.dependencies.fetchAsset ?? ((url, activeSignal, activeOffset) => defaultFetch(url, activeSignal, activeOffset)))(`https://huggingface.co/${model.repository}/resolve/${model.revision}/${asset.path}`, signal, offset, asset);
        const handle = await fs.open(destination, offset ? 'a' : 'w');
        try {
          const chunks: AsyncIterable<Uint8Array> = typeof (source as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === 'function' ? source as AsyncIterable<Uint8Array> : { async *[Symbol.asyncIterator]() { yield source as Uint8Array; } };
          for await (const chunk of chunks) { if (signal.aborted) throw new DOMException('aborted', 'AbortError'); await handle.write(chunk); receivedBytes += chunk.byteLength; onProgress({ phase: 'downloading', receivedBytes, totalBytes, percent: Math.min(99, Math.round(receivedBytes / totalBytes * 100)) }); }
        } finally { await handle.close(); }
      }
      onProgress({ phase: 'verifying', receivedBytes, totalBytes, percent: 99 });
      for (const asset of model.assets) if (await sha256(path.join(staging, asset.path)) !== asset.sha256) throw new AiModelManagerError('integrity', `Integritätsprüfung fehlgeschlagen: ${asset.path}`);
      onProgress({ phase: 'installing', receivedBytes, totalBytes, percent: 99 });
      await fs.writeFile(path.join(staging, 'installed.json'), JSON.stringify({ version: this.manifest.version, profile, repository: model.repository, revision: model.revision, dtype: model.dtype, license: model.license, sizeBytes: totalBytes }));
      const target = path.join(this.root, profile); await fs.rm(target, { recursive: true, force: true }); await fs.rename(staging, target);
      onProgress({ phase: 'installing', receivedBytes: totalBytes, totalBytes, percent: 100 });
    } catch (error) {
      if (signal.aborted || error instanceof DOMException && error.name === 'AbortError') { await fs.rm(staging, { recursive: true, force: true }); throw new AiModelManagerError('cancelled', 'Modelldownload abgebrochen.'); }
      if (error instanceof AiModelManagerError && error.code === 'integrity') await fs.rm(staging, { recursive: true, force: true });
      throw error instanceof AiModelManagerError ? error : new AiModelManagerError('download', error instanceof Error ? error.message : String(error));
    }
  }

  async remove() { await Promise.all((Object.keys(this.manifest.profiles) as AiModelProfile[]).map(profile => fs.rm(path.join(this.root, profile), { recursive: true, force: true }))); }
}
