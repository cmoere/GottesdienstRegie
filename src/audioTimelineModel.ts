import type { BackgroundAudioConfig, ServiceItem, ServiceSection } from "./store";

export type AudioTimelineEntry = {
  state: "starts" | "active" | "stops";
  sourceItemId?: string;
  sourceSectionId?: string;
  sourceTitle: string;
};

type RunningAudio = {
  config: BackgroundAudioConfig;
  sourceItemId?: string;
  sourceSectionId?: string;
  sourceTitle: string;
};

export function deriveAudioTimeline(
  sections: ServiceSection[],
  items: ServiceItem[],
): Record<string, AudioTimelineEntry> {
  const result: Record<string, AudioTimelineEntry> = {};
  const orderedSections = [...sections].sort((a, b) => a.order - b.order);
  let running: RunningAudio | undefined;

  for (const section of orderedSections) {
    const sectionItems = items
      .filter((item) => item.sectionId === section.id && item.enabled && !item.disabled)
      .sort((a, b) => a.order - b.order);

    if (
      running &&
      running.sourceSectionId !== section.id &&
      !["nextSection", "offAir", "stopCue", "playlistEnd"].includes(
        running.config.continueUntil,
      )
    ) running = undefined;

    for (const item of sectionItems) {
      if (item.audioStopCue) {
        result[item.id] = {
          state: "stops",
          sourceItemId: running?.sourceItemId,
          sourceSectionId: running?.sourceSectionId,
          sourceTitle: running?.sourceTitle ?? "Background Audio",
        };
        running = undefined;
        continue;
      }

      const itemAudio = item.backgroundAudio?.tracks.length && item.backgroundAudio.autoPlay !== false
        ? item.backgroundAudio
        : undefined;
      const sectionStarts =
        !itemAudio &&
        section.backgroundAudio?.tracks.length &&
        section.backgroundAudio.autoPlay !== false &&
        (!section.backgroundAudio.startItemId || section.backgroundAudio.startItemId === item.id) &&
        running?.sourceSectionId !== section.id;

      if (itemAudio) {
        running = {
          config: itemAudio,
          sourceItemId: item.id,
          sourceSectionId: section.id,
          sourceTitle: item.title,
        };
        result[item.id] = { state: "starts", ...running };
      } else if (sectionStarts) {
        running = {
          config: section.backgroundAudio!,
          sourceSectionId: section.id,
          sourceTitle: section.title,
        };
        result[item.id] = { state: "starts", ...running };
      } else if (running) {
        result[item.id] = { state: "active", ...running };
      }

      if (running?.config.continueUntil === "itemEnd") running = undefined;
    }

    if (running?.config.continueUntil === "sectionEnd") running = undefined;
  }

  return result;
}
