import {BrowserWindow} from 'electron';
import type {NextPreviewPacket, NextPreviewState} from '../shared/nextPreview';

/** One read-only renderer shares a cached frame across all preview clients. */
export class NextPreviewWindow {
 private window: BrowserWindow | null = null;
 private packets: NextPreviewPacket[] = [];
 private serializedPacket = '[]';
 private revision = 0;
 private readyRevision = -1;
 private loading: Promise<void> | null = null;
 private cached: {revision: number; frames: Buffer[]} | null = null;
 private rendering: Promise<Buffer[] | null> | null = null;

 constructor(private preload: string, private load: (window: BrowserWindow, route: string) => Promise<void>) {}

 update(packet: NextPreviewPacket | null, upcoming?: NextPreviewPacket[]) {
  const packets = (upcoming ?? (packet ? [packet] : [])).slice(0, 4);
  const serialized = JSON.stringify(packets);
  if (serialized === this.serializedPacket) return this.revision;
  this.serializedPacket = serialized;
  this.packets = structuredClone(packets);
  this.revision++;
  this.cached = null;
  if (this.window && !this.window.isDestroyed()) {
   this.resize();
   this.window.webContents.send('remote:next-preview', this.get(this.window.webContents.id));
  }
  return this.revision;
 }

 get(sender: number): NextPreviewState | null {
  return this.window && !this.window.isDestroyed() && this.window.webContents.id === sender
   ? {revision: this.revision, packet: this.packets[0] ?? null, packets: this.packets} : null;
 }

 ready(sender: number, revision: number) {
  if (!this.get(sender) || revision !== this.revision) return false;
  this.readyRevision = revision;
  return true;
 }

 async capture(index = 0): Promise<Buffer | null> {
  if (!Number.isInteger(index) || index < 0 || index >= this.packets.length) return null;
  if (this.cached?.revision === this.revision) return this.cached.frames[index] ?? null;
  this.rendering ??= this.render().finally(() => {this.rendering = null;});
  const revision = this.revision;
  const frames = await this.rendering;
  return revision === this.revision ? frames?.[index] ?? null : null;
 }

 private resize() {
  this.window?.setContentSize(this.packets.length > 1 ? 1280 : 960, this.packets.length > 1 ? 720 : 540);
 }

 private async render(): Promise<Buffer[] | null> {
  if (!this.window || this.window.isDestroyed()) {
   this.window = new BrowserWindow({width: 960, height: 540, useContentSize: true, show: false, frame: false,
    webPreferences: {preload: this.preload, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false}});
   this.resize();
   this.loading = this.load(this.window, '#output-next-preview');
   this.window.on('closed', () => {this.window = null; this.readyRevision = -1;});
  }
  await this.loading;
  const window = this.window;
  if (!window || window.isDestroyed()) return null;
  const revision = this.revision;
  window.webContents.send('remote:next-preview', this.get(window.webContents.id));
  const end = Date.now() + 4000;
  while (this.readyRevision !== revision && Date.now() < end) {
   if (window.isDestroyed() || this.revision !== revision) return null;
   await new Promise(resolve => setTimeout(resolve, 20));
  }
  if (this.readyRevision !== revision || window.isDestroyed()) return null;
  const image = await window.webContents.capturePage();
  if (this.revision !== revision || image.isEmpty()) return null;
  const size = image.getSize();
  const columns = this.packets.length > 1 ? 2 : 1;
  const width = Math.floor(size.width / columns), height = Math.floor(size.height / columns);
  const frames = this.packets.map((_, index) => image.crop({
   x: (index % columns) * width, y: Math.floor(index / columns) * height, width, height,
  }).toJPEG(80));
  this.cached = {revision, frames};
  return frames;
 }

 stop() {
  if (this.window && !this.window.isDestroyed()) this.window.close();
  this.packets = [];
  this.serializedPacket = '[]';
  this.cached = null;
 }
}
