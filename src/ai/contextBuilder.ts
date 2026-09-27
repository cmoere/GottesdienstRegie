import type { CloudMediaAsset } from '../platform/types';
import { isSensitiveKey, redactSensitiveValue, type PresentationDocument, type ServiceItem, type Slide } from '../store';

export interface AiContextInput {
  document: PresentationDocument;
  selectedItemId?: string;
  selectedSlideId?: string;
  selectedElementIds?: string[];
  media?: CloudMediaAsset[];
  language: string;
  includePresentationContext: boolean;
}

export interface AiAssistantContext {
  presentation?: { title: string; sections: unknown[]; items: unknown[] };
  selection?: unknown;
  media?: Array<{ id: string; name: string; kind: string; tags: string[] }>;
  language: string;
  truncated: boolean;
}

const MAX_ITEMS = 30;
const pathKey = /(?:^|_)(?:path|filepath|localpath|downloadurl|url)$/i;

function cleanRecord(value: Record<string, unknown>) {
  return redactSensitiveValue(Object.fromEntries(Object.entries(value).filter(([key]) => !pathKey.test(key) && !isSensitiveKey(key))));
}

function cleanSlide(slide: Slide) {
  return {
    id: slide.id,
    itemId: slide.itemId,
    order: slide.order,
    enabled: slide.enabled,
    title: slide.title,
    body: slide.body,
    timing: slide.timing,
    elements: slide.elements.map(element => ({
      id: element.id,
      type: element.type,
      name: element.name,
      visible: element.visible,
      properties: cleanRecord(element.properties),
    })),
  };
}

function cleanItem(item: ServiceItem) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    sectionId: item.sectionId,
    order: item.order,
    enabled: item.enabled,
    plannedDuration: item.plannedDuration,
    metadata: cleanRecord(item.metadata),
    timing: item.timing,
    slides: item.slides.map(cleanSlide),
  };
}

export function buildAiContext(input: AiContextInput): AiAssistantContext {
  const context: AiAssistantContext = { language: input.language, truncated: false };
  if (!input.includePresentationContext) return context;

  const selectedItem = input.document.items.find(item => item.id === input.selectedItemId || item.slides.some(slide => slide.id === input.selectedSlideId));
  const first = input.document.items.slice(0, MAX_ITEMS - (selectedItem && !input.document.items.slice(0, MAX_ITEMS).includes(selectedItem) ? 1 : 0));
  const chosen = selectedItem && !first.includes(selectedItem) ? [...first, selectedItem] : first;
  context.truncated = input.document.items.length > chosen.length;
  context.presentation = {
    title: input.document.title,
    sections: input.document.sections.map(section => ({ id: section.id, title: section.title, order: section.order, type: section.type })),
    items: chosen.map(cleanItem),
  };

  const selectedSlide = selectedItem?.slides.find(slide => slide.id === input.selectedSlideId);
  if (selectedItem || selectedSlide) {
    context.selection = {
      item: selectedItem ? cleanItem(selectedItem) : undefined,
      slide: selectedSlide ? cleanSlide(selectedSlide) : undefined,
      elementIds: input.selectedElementIds?.slice(0, 50) ?? [],
    };
  }
  if (input.media?.length) {
    context.media = input.media.slice(0, 100).map(asset => ({ id: asset.id, name: asset.name, kind: asset.kind, tags: asset.tags ?? [] }));
    if (input.media.length > 100) context.truncated = true;
  }
  return context;
}
