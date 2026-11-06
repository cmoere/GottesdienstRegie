import { canPlaceItem, isLoopOnlyItem, sectionSupportsLoopItems } from './loopDomain';
import type { ItemType, ServiceItem, ServiceSection } from './store';

export const loopOnlyItemTypes = [
  'announcement', 'birthday', 'event', 'weather', 'loopQuiz', 'loopCountdown',
  'clock', 'bibleVerse', 'loopQr', 'siteMap', 'infoCard', 'today', 'nextEvents', 'nowPlaying', 'news', 'football',
] as const satisfies readonly ItemType[];

export const standardItemTypes = [
  'content', 'image', 'video', 'videoInput', 'audio', 'song', 'bible', 'web',
  'pdf', 'timer', 'countdown', 'slideshow', 'stageMessage', 'quickScreen', 'liveQuiz',
] as const satisfies readonly ItemType[];

const loopTypes = new Set<ItemType>(loopOnlyItemTypes);

export function resolveInsertionSectionId(requested:string|undefined,selected:string|undefined):string{
  const value=requested??selected??'service';
  if(value==='preLoop')return 'pre';
  if(value==='postLoop')return 'post';
  if(value==='arrival')return 'warmup';
  return value;
}

export type PlacementViolation = {
  code: 'SECTION_MISSING' | 'LOOP_SECTION_REQUIRED';
  message: string;
};

export function canInsertItemType(
  type: ItemType,
  section: ServiceSection | null | undefined,
): boolean {
  if (!section) return false;
  return !loopTypes.has(type)||canPlaceItem({id:"",type,itemCategory:"loop"},section);
}

export function allowedItemTypes(section: ServiceSection | null | undefined): ItemType[] {
  if (!section) return [];
  return sectionSupportsLoopItems(section)
    ? [...standardItemTypes, ...loopOnlyItemTypes.filter(type=>canInsertItemType(type,section))]
    : [...standardItemTypes];
}

export function menuItemTypesForSection(section: ServiceSection | null | undefined): ItemType[] {
  return section && sectionSupportsLoopItems(section) ? loopOnlyItemTypes.filter(type=>canInsertItemType(type,section)) : [...standardItemTypes];
}

export function placementViolation(
  item: Pick<ServiceItem, 'type'> & Partial<Pick<ServiceItem, 'itemCategory' | 'placementPolicy'>>,
  section: ServiceSection | null | undefined,
): PlacementViolation | null {
  if (!section) return { code: 'SECTION_MISSING', message: 'Der Zielbereich wurde nicht gefunden.' };
  const loopOnly = loopTypes.has(item.type) || isLoopOnlyItem({ id: '', ...item });
  if (loopOnly && !canPlaceItem({id:"",...item,itemCategory:"loop"},section)) {
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
