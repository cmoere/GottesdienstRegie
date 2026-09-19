import type { ServiceItem, Slide, SlideElement } from './store';
import { isLoopOnlyItem } from './loopDomain';

export type LoopCoreKind = 'weather' | 'clock' | 'birthdays' | 'events' | 'screen-message';
export type LoopCoreLayer = Readonly<{ id: `loop-core:${string}`; protected: true; kind: LoopCoreKind }>;

const kinds: Readonly<Record<string, LoopCoreKind>> = Object.freeze({
  weather: 'weather', clock: 'clock', birthday: 'birthdays', event: 'events',
  announcement: 'screen-message', infoCard: 'screen-message', today: 'events', nextEvents: 'events',
});

function isSystemElement(element: SlideElement): boolean {
  return element.properties.systemLayer === true || element.properties.coreLayer === true || element.properties.protected === true;
}

export function getLoopCoreLayer(_slide: Slide, item: ServiceItem): LoopCoreLayer | null {
  if (!isLoopOnlyItem(item)) return null;
  return Object.freeze({ id: `loop-core:${item.id}` as const, protected: true as const, kind: kinds[item.type] ?? 'screen-message' });
}

export function getUserOverlayElements(slide: Slide, item: ServiceItem): SlideElement[] {
  const elements = Array.isArray(slide.elements) ? slide.elements : [];
  const primaryId = elements.find((element) => element.type === 'text')?.id;
  return elements.filter((element) => element.id !== primaryId && !isSystemElement(element));
}

export function normalizeLoopOverlays(slide: Slide, item: ServiceItem): Slide {
  if (!isLoopOnlyItem(item)) return { ...slide, elements: Array.isArray(slide.elements) ? [...slide.elements] : [] };
  return { ...slide, elements: getUserOverlayElements(slide, item) };
}
