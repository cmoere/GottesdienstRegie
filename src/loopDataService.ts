import { onValue, ref, type Unsubscribe } from 'firebase/database';
import { communityDatabase } from './firebase';
import { filterAnnouncements, type AnnouncementPlacement, type PublicAnnouncement } from './loopData';
import type { ServiceItem, ServiceSection } from './store';
import { isCancelled, listChurchEvents, type ChurchEvent } from './events';

export type AnnouncementRecord = Record<string, Record<string, unknown>>;
export type AnnouncementListener = (items: PublicAnnouncement[], raw: AnnouncementRecord) => void;

export class FirebaseAnnouncementProvider {
  subscribe(listener: (raw: AnnouncementRecord) => void, onError?: (error: Error) => void): Unsubscribe {
    return onValue(ref(communityDatabase, 'meldungen'), (snapshot) => listener((snapshot.val() ?? {}) as AnnouncementRecord), (error) => onError?.(error));
  }
}

export class AnnouncementService {
  constructor(private readonly provider = new FirebaseAnnouncementProvider()) {}

  subscribe(placement: AnnouncementPlacement, listener: AnnouncementListener, onError?: (error: Error) => void): Unsubscribe {
    return this.provider.subscribe((raw) => listener(filterAnnouncements(raw, new Date(), placement), raw), onError);
  }
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
