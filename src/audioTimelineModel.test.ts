import { describe, expect, it } from "vitest";
import type { BackgroundAudioConfig, ServiceItem, ServiceSection } from "./store";
import { deriveAudioTimeline } from "./audioTimelineModel";

const audio = (continueUntil: BackgroundAudioConfig["continueUntil"] = "stopCue"): BackgroundAudioConfig => ({
  tracks: [{ assetId: "track-1", name: "Instrumental", url: "audio.mp3" }],
  autoPlay: true,
  shuffle: false,
  repeat: true,
  continueUntil,
  volume: 70,
  fadeInSeconds: 1,
  fadeOutSeconds: 2,
  crossfadeSeconds: 1,
  muted: false,
  ducking: { enabled: true, level: 25, attackMs: 350, releaseMs: 900 },
});

const item = (id: string, sectionId: string, order: number, patch: Partial<ServiceItem> = {}) =>
  ({ id, sectionId, order, enabled: true, disabled: false, title: id, slides: [{ id: `${id}-1` }], ...patch }) as ServiceItem;

const sections: ServiceSection[] = [
  { id: "pre", title: "Vorprogramm", order: 0 },
  { id: "service", title: "Gottesdienst", order: 1 },
];

describe("deriveAudioTimeline", () => {
  it("marks every following item until a stop cue", () => {
    const result = deriveAudioTimeline(sections, [
      item("start", "pre", 0, { backgroundAudio: audio("stopCue") }),
      item("middle", "pre", 1),
      item("stop", "pre", 2, { audioStopCue: { fadeOutSeconds: 2 } }),
      item("after", "pre", 3),
    ]);

    expect(result.start).toMatchObject({ state: "starts", sourceItemId: "start" });
    expect(result.middle).toMatchObject({ state: "active", sourceItemId: "start" });
    expect(result.stop).toMatchObject({ state: "stops", sourceItemId: "start" });
    expect(result.after).toBeUndefined();
  });

  it("ends section audio at the configured section boundary", () => {
    const result = deriveAudioTimeline(
      [{ ...sections[0], backgroundAudio: audio("sectionEnd") }, sections[1]],
      [item("pre-1", "pre", 0), item("pre-2", "pre", 1), item("service-1", "service", 0)],
    );

    expect(result["pre-1"].state).toBe("starts");
    expect(result["pre-2"].state).toBe("active");
    expect(result["service-1"]).toBeUndefined();
  });

  it("only marks the source item when audio ends with that item", () => {
    const result = deriveAudioTimeline(sections, [
      item("short", "pre", 0, { backgroundAudio: audio("itemEnd") }),
      item("next", "pre", 1),
    ]);
    expect(result.short.state).toBe("starts");
    expect(result.next).toBeUndefined();
  });
});
