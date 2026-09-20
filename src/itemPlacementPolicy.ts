import { isLoopOnlyItem, sectionSupportsLoopItems } from './loopDomain';
import type { ItemType, ServiceItem, ServiceSection } from './store';

export const loopOnlyItemTypes = [
  'announcement', 'birthday', 'event', 'weather', 'loopQuiz', 'loopCountdown',
  'clock', 'bibleVerse', 'loopQr', 'infoCard', 'today', 'nextEvents',
] as const satisfies readonly ItemType[];

export const standardItemTypes = [
  'content', 'image', 'video', 'videoInput', 'audio', 'song', 'bible', 'web',
  'pdf', 'timer', 'countdown', 'slideshow', 'stageMessage', 'quickScreen', 'liveQuiz',
] as const satisfies readonly ItemType[];

const loopTypes = new Set<ItemType>(loopOnlyItemTypes);

export type PlacementViolation = {
  code: 'SECTION_MISSING' | 'LOOP_SECTION_REQUIRED';
  message: string;
};

export function canInsertItemType(
  type: ItemType,
  section: ServiceSection | null | undefined,
): boolean {
  if (!section) return false;
  return !loopTypes.has(type) || sectionSupportsLoopItems(section);
}

export function allowedItemTypes(section: ServiceSection | null | undefined): ItemType[] {
  if (!section) return [];
  return sectionSupportsLoopItems(section)
    ? [...standardItemTypes, ...loopOnlyItemTypes]
    : [...standardItemTypes];
}

export function placementViolation(
  item: Pick<ServiceItem, 'type'> & Partial<Pick<ServiceItem, 'itemCategory' | 'placementPolicy'>>,
  section: ServiceSection | null | undefined,
): PlacementViolation | null {
  if (!section) return { code: 'SECTION_MISSING', message: 'Der Zielbereich wurde nicht gefunden.' };
  const loopOnly = loopTypes.has(item.type) || isLoopOnlyItem({ id: '', ...item });
  if (loopOnly && !sectionSupportsLoopItems(section)) {
    return {
      code: 'LOOP_SECTION_REQUIRED',
      message: 'Dieses Element ist ausschließlich im Vor- oder Nachprogramm zulässig.',
    };
  }
  return null;
}

export function canInsertItem(
  item: Pick<ServiceItem, 'type'> & Partial<Pick<ServiceItem, 'itemCategory' | 'placementPolicy'>>,
  section: ServiceSection | null | undefined,
): boolean {
  return placementViolation(item, section) === null;
}
