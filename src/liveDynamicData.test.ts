import { describe, expect, it } from "vitest";
import type { Slide } from "./store";
import { hydrateDynamicEventData } from "./liveDynamicData";
import { setLatestPublicEvents } from "./dynamicEventSlide";

const slide: Slide = {
  id: "slide",
  itemId: "item",
  order: 0,
  enabled: true,
  title: "Termine",
  body: "",
  background: "#000",
  transition: "none",
  transitionDuration: 0,
  notes: "",
  elements: [
    {
      id: "event",
      type: "loop",
      name: "Termine",
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: 1,
      properties: { loopType: "nextEvents" },
    },
  ],
};

describe("live dynamic event hydration", () => {
  it("embeds the current event snapshot in the slide sent to MAIN", () => {
    setLatestPublicEvents([
      { title: "Gottesdienst", effectiveStart: "2026-10-04T10:30:00+02:00" },
      { title: "Gebetsabend", effectiveStart: "2026-10-06T19:30:00+02:00" },
    ]);
    const hydrated = hydrateDynamicEventData(slide);
    expect(
      JSON.parse(String(hydrated.elements[0].properties.eventItemsJson)),
    ).toHaveLength(2);
    expect(hydrated).not.toBe(slide);
  });
});
