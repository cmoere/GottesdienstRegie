import type { Slide } from "./store";
import { getLatestPublicEvents } from "./dynamicEventSlide";

export function hydrateDynamicEventData(slide: Slide): Slide {
  const events = getLatestPublicEvents();
  return {
    ...structuredClone(slide),
    elements: slide.elements.map((element) => {
      const loopType = String(element.properties.loopType ?? "");
      if (
        element.type !== "loop" ||
        (loopType !== "event" && loopType !== "nextEvents")
      )
        return structuredClone(element);
      return {
        ...structuredClone(element),
        properties: {
          ...element.properties,
          eventItemsJson: JSON.stringify(events),
        },
      };
    }),
  };
}
