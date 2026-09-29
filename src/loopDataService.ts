import type { AnnouncementPlacement, PublicAnnouncement } from './loopData';
import { AnnouncementService as DomainAnnouncementService, type RawAnnouncement } from './community/AnnouncementService';
import {StableLoopSnapshot} from './community/StableLoopSnapshot';
import type { ServiceItem, ServiceSection } from './store';
import { isCancelled, listChurchEvents, type ChurchEvent } from './events';

export type AnnouncementRecord = Record<string, Record<string, unknown>>;
export type AnnouncementListener = (items: PublicAnnouncement[], raw: AnnouncementRecord) => void;

export class CommunityAnnouncementProvider {
  subscribe(listener: (raw: AnnouncementRecord) => void, onError?: (error: Error) => void): () => void {
    const bridge = (window as unknown as {desktop?:{community?:{start:()=>Promise<unknown>;onAnnouncements:(callback:(items:RawAnnouncement[])=>void)=>()=>void}}}).desktop?.community;
    if (!bridge) { onError?.(new Error('Gemeindedaten sind in dieser Umgebung nicht verfügbar.')); return () => {}; }
    void bridge.start().catch(onError);
    return bridge.onAnnouncements((items) => listener(Object.fromEntries(items.map((item) => [item.messageId, item]))));
  }
}

export class AnnouncementService {
  private readonly snapshot=new StableLoopSnapshot<PublicAnnouncement>();
  constructor(private readonly provider = new CommunityAnnouncementProvider(), private readonly domain = new DomainAnnouncementService()) {}

  subscribe(placement: AnnouncementPlacement, listener: AnnouncementListener, onError?: (error: Error) => void): () => void {
    return this.provider.subscribe((raw) => {this.snapshot.prepare(this.domain.getForPlacement(Object.values(raw) as RawAnnouncement[], new Date(), placement).map((item) => ({ ...item, qrCodeUrl: item.qrReference })));listener([...this.snapshot.current()], raw)}, onError);
  }
  beginDisplay(id:string){return this.snapshot.beginDisplay(id)}
  completeDisplay(){this.snapshot.completeDisplay()}
  get isEmpty(){return this.snapshot.isEmpty}
}

export interface PublicEvent { id: string; title: string; startsAt: string; location?: string; cancelled: boolean }

export async function loadPublicEvents(limit = 3): Promise<PublicEvent[]> {
  const events = await listChurchEvents();
  return events.filter((event) => !isCancelled(event)).slice(0, limit).map((event: ChurchEvent) => ({ id: event.eventKey, title: event.titel, startsAt: `${event.start_datum}T${event.start_uhrzeit || '00:00'}`, location: undefined, cancelled: false }));
}

export interface PublicBirthday { id: string; displayName: string }

export async function loadPublicBirthdays(loader: () => Promise<PublicBirthday[]> = async () => []): Promise<PublicBirthday[]> {
  return loader();
}

export interface LoopPreflightResult { warnings: string[]; ready: boolean }

export function loopPreflight(items: ServiceItem[], sections: ServiceSection[]): LoopPreflightResult {
  const warnings: string[] = [];
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  for (const item of items.filter((entry) => entry.itemCategory === 'loop')) {
    const section = sectionMap.get(item.sectionId);
    if (!section?.supportsLoopItems) warnings.push(`Loop-Element „${item.title}“ befindet sich in einem nicht unterstützten Bereich.`);
    if (item.type === 'weather') {
      if (!Number.isFinite(Number(item.plannedDuration)) || Number(item.plannedDuration) < 1_000) warnings.push('Wetter benötigt eine Anzeigedauer von mindestens 1 Sekunde.');
      if (String(item.metadata.weatherScreenUrl ?? '') !== 'https://weather.crbnm06.workers.dev') warnings.push('Wetterquelle wird auf den festen Systemwert zurückgesetzt.');
    }
  }
  return { warnings, ready: true };
}
