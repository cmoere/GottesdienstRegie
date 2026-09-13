export const WEATHER_SCREEN_URL = 'https://weather.crbnm06.workers.dev';
export const WEATHER_SCREEN_DURATION_MS = 20_000;
export const LOOP_DURATION_PRESETS_MS = [5_000, 10_000, 15_000, 20_000, 30_000, 45_000, 60_000] as const;

export type LoopSectionType = 'preLoop' | 'postLoop' | 'preProgram' | 'warmup' | 'service' | 'custom';
export type LoopItemType = 'announcement' | 'birthday' | 'event' | 'weather' | 'loopQuiz' | 'loopCountdown' | 'clock' | 'bibleVerse' | 'loopQr' | 'infoCard' | 'today' | 'nextEvents';
export type LoopItemCategory = 'loop' | 'standard';
export type PlacementPolicy = 'loopOnly' | 'any';

export interface LoopSectionLike {
  id: string;
  title?: string;
  type?: LoopSectionType | string;
  autoLoop?: boolean;
  supportsLoopItems?: boolean;
}

export interface LoopItemLike {
  id: string;
  type?: string;
  itemCategory?: LoopItemCategory;
  placementPolicy?: PlacementPolicy;
  durationMs?: number;
  plannedDuration?: number;
  timing?: { slideDurationSeconds?: number };
  ready?: boolean;
  enabled?: boolean;
  disabled?: boolean;
}

export interface LoopRuntimeItem {
  id: string;
  ready?: boolean;
  enabled?: boolean;
  disabled?: boolean;
  durationMs?: number;
}

export interface LoopControllerSnapshot {
  running: boolean;
  index: number;
  currentId: string | null;
  itemIds: string[];
}

const loopSectionIds = new Set(['pre', 'post', 'preLoop', 'postLoop']);
const loopOnlyTypes = new Set<string>([
  'announcement', 'birthday', 'event', 'weather', 'loopQuiz', 'loopCountdown',
  'clock', 'bibleVerse', 'loopQr', 'infoCard', 'today', 'nextEvents',
]);

export function isLoopSection(section: LoopSectionLike | null | undefined): boolean {
  if (!section) return false;
  if (section.supportsLoopItems === true) return true;
  const type = String(section.type ?? '');
  if (type === 'preLoop' || type === 'postLoop') return true;
  if ((type === 'preProgram' || section.id === 'pre') && section.autoLoop === true) return true;
  return loopSectionIds.has(section.id) && section.id !== 'pre';
}

export function sectionSupportsLoopItems(section: LoopSectionLike | null | undefined): boolean {
  return isLoopSection(section);
}

export function isLoopOnlyItem(item: LoopItemLike | null | undefined): boolean {
  if (!item) return false;
  // `announcement` already existed as a normal ServiceItem before loop
  // announcements were introduced. Only the explicitly marked loop variant
  // is loop-only; all newer loop types remain loop-only by their type.
  const type = String(item.type ?? '');
  return item.placementPolicy === 'loopOnly' || item.itemCategory === 'loop' || (type !== 'announcement' && loopOnlyTypes.has(type));
}

export function canPlaceItem(item: LoopItemLike | null | undefined, targetSection: LoopSectionLike | null | undefined): boolean {
  if (!item || !targetSection) return false;
  if (!isLoopOnlyItem(item)) return true;
  return sectionSupportsLoopItems(targetSection);
}

export function loopDurationMs(item: LoopItemLike | null | undefined): number {
  if (!item) return 0;
  const value = Number(item.durationMs ?? item.plannedDuration ?? (Number(item.timing?.slideDurationSeconds ?? 0) * 1000));
  return Number.isFinite(value) && value > 0 ? value : 15_000;
}

export function isLoopItemType(type: string): type is LoopItemType {
  return loopOnlyTypes.has(type);
}

export function createLoopItemDefaults(type: LoopItemType): Record<string, string | number | boolean> {
  const base = { itemCategory: 'loop' as const, placementPolicy: 'loopOnly' as const, autoAdvance: true };
  if (type === 'weather') return { ...base, refreshMode: 'beforeDisplay', mute: true, durationMs: WEATHER_SCREEN_DURATION_MS };
  if (type === 'announcement') return { ...base, source: 'firebase', rotationMode: 'rotate', durationMs: 15_000 };
  return { ...base, durationMs: 15_000 };
}

export class LoopController<T extends LoopRuntimeItem = LoopRuntimeItem> {
  private items: T[];
  private index = -1;
  private running = false;

  constructor(items: T[] = []) {
    this.items = items.slice();
  }

  setItems(items: T[]): void {
    const current = this.current()?.id;
    this.items = items.slice();
    const nextIndex = current ? this.items.findIndex((item) => item.id === current) : -1;
    this.index = nextIndex;
  }

  start(): string | null {
    this.running = true;
    return this.advance();
  }

  stop(): void {
    this.running = false;
    this.index = -1;
  }

  current(): T | null {
    const item = this.items[this.index];
    return item && this.isAvailable(item) ? item : null;
  }

  select(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id && this.isAvailable(item));
    if (index < 0) return false;
    this.index = index;
    this.running = true;
    return true;
  }

  advance(): string | null {
    if (!this.running) return null;
    if (!this.items.length) return null;
    for (let offset = 1; offset <= this.items.length; offset += 1) {
      const candidateIndex = (this.index + offset + this.items.length) % this.items.length;
      const candidate = this.items[candidateIndex];
      if (!this.isAvailable(candidate)) continue;
      this.index = candidateIndex;
      return candidate.id;
    }
    this.index = -1;
    return null;
  }

  snapshot(): LoopControllerSnapshot {
    return { running: this.running, index: this.index, currentId: this.current()?.id ?? null, itemIds: this.items.map((item) => item.id) };
  }

  private isAvailable(item: T): boolean {
    return item.enabled !== false && item.ready !== false && item.disabled !== true;
  }
}
