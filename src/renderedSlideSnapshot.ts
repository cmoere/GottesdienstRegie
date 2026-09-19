import type { ServiceItem, Slide } from './store';
import { getLoopCoreLayer, type LoopCoreLayer } from './loopCoreLayer';

export type OutputProfile = 'main' | 'stage' | 'livestream';
export type RenderedSlideSnapshot = Readonly<{
  slideId: string;
  profile: OutputProfile;
  hash: string;
  createdAt: number;
  slide: Slide;
  coreLayer: LoopCoreLayer | null;
}>;

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
}

function stableHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildRenderedSlideSnapshot(slide: Slide, item: ServiceItem, profile: OutputProfile, createdAt = Date.now()): RenderedSlideSnapshot {
  const renderedSlide = structuredClone(slide);
  const coreLayer = getLoopCoreLayer(renderedSlide, item);
  return freezeDeep({ slideId: renderedSlide.id, profile, hash: stableHash({ renderedSlide, coreLayer, profile }), createdAt, slide: renderedSlide, coreLayer });
}

export function cloneRenderedSlideSnapshot(snapshot: RenderedSlideSnapshot): RenderedSlideSnapshot {
  return freezeDeep(structuredClone(snapshot));
}
