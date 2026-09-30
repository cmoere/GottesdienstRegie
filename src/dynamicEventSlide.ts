export type LatestPublicEvent = {
  id?: string;
  title: string;
  effectiveStart: string;
  effectiveLocation?: string;
  coverUrl?: string;
};
export const EVENT_SLIDE_DESIGNS = [
  "cards",
  "timeline",
  "poster",
  "minimal",
] as const;
export type EventSlideDesign = (typeof EVENT_SLIDE_DESIGNS)[number];
export const EVENT_SLIDE_DESIGN_LABELS: Record<EventSlideDesign, string> = {
  cards: "Karten",
  timeline: "Zeitstrahl",
  poster: "Plakat",
  minimal: "Minimal",
};
export type EventSlideSettings = { design: EventSlideDesign; limit: number };

let latestPublicEvents: LatestPublicEvent[] = [];
export function setLatestPublicEvents(events: LatestPublicEvent[]) {
  latestPublicEvents = structuredClone(events);
}
export function getLatestPublicEvents() {
  return structuredClone(latestPublicEvents);
}
export function setLatestPublicEvent(event: LatestPublicEvent | null) {
  setLatestPublicEvents(event ? [event] : []);
}
export function getLatestPublicEvent() {
  return getLatestPublicEvents()[0] ?? null;
}

export function normalizeEventSlideSettings(
  value: Record<string, unknown>,
): EventSlideSettings {
  const design = EVENT_SLIDE_DESIGNS.includes(
    value.eventDesign as EventSlideDesign,
  )
    ? (value.eventDesign as EventSlideDesign)
    : "cards";
  const raw = Math.round(Number(value.eventLimit ?? 4));
  return {
    design,
    limit: Math.max(2, Math.min(8, Number.isFinite(raw) ? raw : 4)),
  };
}

function formatted(event: LatestPublicEvent) {
  let date = "";
  if (event.effectiveStart) {
    const value = new Date(event.effectiveStart);
    if (!Number.isNaN(value.getTime()))
      date = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
        .format(value)
        .replace(",", " ·");
  }
  return {
    title: event.title.trim(),
    details: [date, event.effectiveLocation?.trim()]
      .filter(Boolean)
      .join(" · "),
    coverUrl: event.coverUrl ?? "",
  };
}

export function eventSlideItems(properties: Record<string, unknown>) {
  let events: LatestPublicEvent[] = [];
  try {
    const parsed = JSON.parse(String(properties.eventItemsJson ?? "[]"));
    if (Array.isArray(parsed))
      events = parsed.filter((item) => item && typeof item.title === "string");
  } catch {
    events = [];
  }
  if (!events.length) {
    const title = String(
      properties.eventTitle ?? properties.title ?? "",
    ).trim();
    if (title)
      events = [
        {
          title,
          effectiveStart: String(
            properties.eventStart ?? properties.start ?? "",
          ),
          effectiveLocation: String(
            properties.eventLocation ?? properties.location ?? "",
          ),
        },
      ];
  }
  const { limit } = normalizeEventSlideSettings(properties);
  return events
    .slice(0, limit)
    .map(formatted)
    .filter((item) => item.title);
}

export function eventSlideContent(properties: Record<string, unknown>) {
  return (
    eventSlideItems(properties)[0] ?? {
      title: "Keine kommenden Veranstaltungen",
      details: "",
      coverUrl: "",
    }
  );
}
