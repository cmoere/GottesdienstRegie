import {expect, it, vi} from 'vitest';
import {NextPreviewWindow} from './NextPreviewWindow';

const native = vi.hoisted(() => ({windows: [] as any[], crops: [] as unknown[], captures: 0}));
vi.mock('electron', () => ({BrowserWindow: class {
 webContents = {id: 7, send: vi.fn(), capturePage: async () => {
  native.captures++;
  return {isEmpty: () => false, getSize: () => ({width: 1280, height: 720}),
   crop: (rect: unknown) => {native.crops.push(rect); return {toJPEG: () => Buffer.from(JSON.stringify(rect))};}};
 }};
 constructor() {native.windows.push(this);}
 isDestroyed() {return false;}
 setContentSize = vi.fn();
 on = vi.fn();
 close = vi.fn();
}}));

it('shares one rendered atlas across four cached previews and rejects stale acknowledgements', async () => {
 native.windows = []; native.crops = []; native.captures = 0;
 const packets = Array.from({length: 4}, (_, index) => ({slide: {id: String(index), title: 'Folie', body: 'Inhalt'}}));
 const preview = new NextPreviewWindow('preload.js', async window => {
  const state = preview.get(window.webContents.id)!;
  expect(preview.ready(99, state.revision)).toBe(false);
  expect(preview.ready(window.webContents.id, state.revision - 1)).toBe(false);
  preview.ready(window.webContents.id, state.revision);
 });
 preview.update(packets[0], packets);
 const frames = await Promise.all(packets.map((_, index) => preview.capture(index)));
 expect(frames.every(frame => frame?.length)).toBe(true);
 expect(native.windows).toHaveLength(1);
 expect(native.captures).toBe(1);
 expect(native.crops).toEqual([
  {x: 0, y: 0, width: 640, height: 360}, {x: 640, y: 0, width: 640, height: 360},
  {x: 0, y: 360, width: 640, height: 360}, {x: 640, y: 360, width: 640, height: 360},
 ]);
 expect(await preview.capture(3)).toEqual(frames[3]);
 expect(native.captures).toBe(1);
 expect(await preview.capture(4)).toBeNull();
 preview.stop();
});
