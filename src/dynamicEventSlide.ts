export type LatestPublicEvent = {
  id?: string;
  title: string;
  effectiveStart: string;
  effectiveEnd?: string;
  effectiveLocation?: string;
  coverUrl?: string;
};
export const EVENT_SLIDE_DESIGNS = [
  "table",
  "cards",
  "timeline",
  "poster",
  "minimal",
] as const;
export type EventSlideDesign = (typeof EVENT_SLIDE_DESIGNS)[number];
export const EVENT_SLIDE_DESIGN_LABELS: Record<EventSlideDesign, string> = {
  table: "Tabelle",
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
    : "table";
  const raw = Math.round(Number(value.eventLimit ?? 4));
  return {
    design,
    limit: Math.max(2, Math.min(design==='table'?50:8, Number.isFinite(raw) ? raw : 4)),
  };
}

export function formatEventDate(value:string|number|Date){
 const date=value instanceof Date?value:new Date(value);
 if(Number.isNaN(date.getTime()))return '';
 const weekday=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',weekday:'short'}).format(date).replace(/\.$/,'');
 const numeric=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
 return `${weekday}., ${numeric}`;
}
function formatted(event: LatestPublicEvent) {
  const start = new Date(event.effectiveStart), end = new Date(event.effectiveEnd ?? "");
  const validStart = !Number.isNaN(start.getTime()), validEnd = !Number.isNaN(end.getTime());
  // The community screen uses the congregation's time zone, on every output device.
  const dayFormatter = new Intl.DateTimeFormat("de-DE", {timeZone:"Europe/Berlin",day:"2-digit",month:"2-digit",year:"numeric"});
  const timeFormatter = new Intl.DateTimeFormat("de-DE", {timeZone:"Europe/Berlin",hour:"2-digit",minute:"2-digit"});
  const fullDay = formatEventDate;
  const date = validStart ? `${fullDay(start)}${validEnd && dayFormatter.format(start)!==dayFormatter.format(end)?` – ${fullDay(end)}`:''}` : "";
  const time = validStart ? `${timeFormatter.format(start)}${validEnd?`–${timeFormatter.format(end)}`:''}` : "";
  const location = event.effectiveLocation?.trim() ?? "";
  return {
    title: event.title.trim(),
    date,
    time,
    location,
    details: [date, time, location]
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
          effectiveEnd: String(properties.eventEnd ?? properties.end ?? ""),
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
