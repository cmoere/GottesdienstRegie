export type AnnouncementPlacement = 'preLoop' | 'postLoop' | 'preProgram';
export type AnnouncementAudience = 'public' | 'operator' | 'stage' | 'internal';
export type AnnouncementPriority = 'urgent' | 'important' | 'normal';
export type AnnouncementCategory = 'general' | 'event' | 'traffic' | 'service' | 'community' | 'info' | 'technical' | 'internal';

export interface Announcement {
  id: string;
  title: string;
  text: string;
  shortText?: string;
  enabled: boolean;
  validFrom?: string;
  validUntil?: string;
  priority: AnnouncementPriority;
  placements: AnnouncementPlacement[];
  audience: AnnouncementAudience;
  category: AnnouncementCategory;
  language?: string;
  displayDurationMs?: number;
  repeatMode?: 'everyLoop' | 'rotate' | 'oncePerSession';
  icon?: string;
  mediaId?: string;
  qrCodeUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  text: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  durationMs: number;
  icon?: string;
  qrCodeUrl?: string;
}

const allowedPlacements = new Set<AnnouncementPlacement>(['preLoop', 'postLoop', 'preProgram']);
const priorities = new Set<AnnouncementPriority>(['urgent', 'important', 'normal']);
const categories = new Set<AnnouncementCategory>(['general', 'event', 'traffic', 'service', 'community', 'info', 'technical', 'internal']);

const asDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['1', 'true', 'ja', 'yes', 'on', 'öffentlich', 'oeffentlich', 'public'].includes(value.trim().toLowerCase());
  return fallback;
};

const safeHtml = (value: unknown): string => String(value ?? '')
  .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript\s*:/gi, '')
  .trim();

export function normalizeAnnouncement(id: string, raw: Record<string, unknown>): Announcement {
  const rawPlacements = Array.isArray(raw.placements) ? raw.placements : Array.isArray(raw.displayAreas) ? raw.displayAreas : [];
  const placements = rawPlacements.map(String).filter((value): value is AnnouncementPlacement => allowedPlacements.has(value as AnnouncementPlacement));
  const priority = String(raw.priority ?? 'normal') as AnnouncementPriority;
  const category = String(raw.category ?? 'general') as AnnouncementCategory;
  const title = String(raw.title ?? raw.titel ?? '').trim();
  const text = safeHtml(raw.text ?? raw.textMeldung ?? raw.beschreibung ?? '');
  const shortText = safeHtml(raw.shortText ?? raw.kurztext ?? '');
  return {
    id,
    title,
    text,
    shortText: shortText || undefined,
    enabled: asBoolean(raw.enabled ?? raw.aktiv, true) && !asBoolean(raw.deleted ?? raw.trash ?? raw.geloescht),
    validFrom: String(raw.validFrom ?? raw.showFrom ?? raw.giltAb ?? '') || undefined,
    validUntil: String(raw.validUntil ?? raw.giltBis ?? '') || undefined,
    priority: priorities.has(priority) ? priority : 'normal',
    placements,
    audience: (['public', 'operator', 'stage', 'internal'].includes(String(raw.audience)) ? String(raw.audience) : (asBoolean(raw.messageScreen) && ['öffentlich', 'oeffentlich', 'public'].includes(String(raw.status ?? '').toLowerCase()) ? 'public' : 'internal')) as AnnouncementAudience,
    category: categories.has(category) ? category : 'general',
    language: String(raw.language ?? 'de') || 'de',
    displayDurationMs: Number.isFinite(Number(raw.displayDurationMs)) ? Number(raw.displayDurationMs) : undefined,
    repeatMode: (['everyLoop', 'rotate', 'oncePerSession'].includes(String(raw.repeatMode)) ? String(raw.repeatMode) : 'rotate') as Announcement['repeatMode'],
    icon: raw.icon ? String(raw.icon) : undefined,
    mediaId: raw.mediaId ? String(raw.mediaId) : undefined,
    qrCodeUrl: (raw.qrCodeUrl ?? raw.qrUrl) ? String(raw.qrCodeUrl ?? raw.qrUrl) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

export function validateAnnouncement(item: Announcement, now = new Date(), placement: AnnouncementPlacement): boolean {
  if (!item.id || !item.enabled || item.audience !== 'public') return false;
  if (!item.title && !item.text) return false;
  if (!item.placements.includes(placement)) return false;
  const from = asDate(item.validFrom);
  const until = asDate(item.validUntil);
  if (from && until && from > until) return false;
  if (from && now < from) return false;
  if (until && now > until) return false;
  return true;
}

export function toPublicAnnouncement(item: Announcement): PublicAnnouncement {
  const text = item.shortText || item.text;
  const lengthDuration = Math.min(Math.max((item.title.length + text.replace(/<[^>]*>/g, '').length) * 80 + 4_000, 12_000), 180_000);
  return { id: item.id, title: item.title, text, priority: item.priority, category: item.category, durationMs: item.displayDurationMs && item.displayDurationMs > 0 ? item.displayDurationMs : lengthDuration, icon: item.icon, qrCodeUrl: item.qrCodeUrl };
}

export function filterAnnouncements(records: Record<string, Record<string, unknown>>, now = new Date(), placement: AnnouncementPlacement): PublicAnnouncement[] {
  return Object.entries(records)
    .map(([id, raw]) => normalizeAnnouncement(id, raw))
    .filter((item) => validateAnnouncement(item, now, placement))
    .sort((a, b) => (a.priority === b.priority ? a.title.localeCompare(b.title, 'de') : a.priority === 'urgent' ? -1 : b.priority === 'urgent' ? 1 : a.priority === 'important' ? -1 : 1))
    .map(toPublicAnnouncement);
}

export function announcementDiagnostic(item: Announcement, now = new Date(), placement: AnnouncementPlacement): string {
  if (!item.enabled) return 'Deaktiviert';
  if (item.audience !== 'public') return 'Nicht öffentlich';
  if (!item.placements.includes(placement)) return 'Nicht für diesen Loop freigegeben';
  const from = asDate(item.validFrom), until = asDate(item.validUntil);
  if (from && now < from) return 'Beginnt erst später';
  if (until && now > until) return 'Abgelaufen';
  if (!item.title && !item.text) return 'Kein anzeigbarer Inhalt';
  return 'Wird angezeigt';
}
