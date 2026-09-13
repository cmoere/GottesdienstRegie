import type { PublicAnnouncement } from './loopData';

export type ScreenmeldungState = 'READY' | 'PLAYING' | 'COMPLETE' | 'EMPTY' | 'ERROR';

export interface ScreenmeldungSnapshot {
  state: ScreenmeldungState;
  title: string;
  body: string;
  qrCodeUrl?: string;
  durationMs: number;
  sourceId?: string;
}

export const SCREENMELDUNG_ASSET_ROOT = '/screenmeldung';

export function createScreenmeldungSnapshot(item: PublicAnnouncement | null): ScreenmeldungSnapshot {
  if (!item) return { state: 'EMPTY', title: '', body: '', durationMs: 0 };
  return { state: 'READY', title: item.title, body: item.text, qrCodeUrl: item.qrCodeUrl, durationMs: item.durationMs, sourceId: item.id };
}

export function screenmeldungAssetUrl(file: 'screenmeldung.html' | 'screenmeldung.css' | 'screenmeldung.js'): string {
  return `${SCREENMELDUNG_ASSET_ROOT}/${file}`;
}

export function isScreenmeldungInteractiveLinkAllowed(): false {
  return false;
}
