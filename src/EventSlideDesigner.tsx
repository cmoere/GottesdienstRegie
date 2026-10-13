import type { ServiceItem } from "./store";
import {useEffect,useState} from 'react';
import {getLatestPublicEvents} from './dynamicEventSlide';
import {prepareEventOverview} from './eventOverviewPresentation';
import { usePresentation } from "./store";
import {
  EVENT_SLIDE_DESIGNS,
  EVENT_SLIDE_DESIGN_LABELS,
  normalizeEventSlideSettings,
} from "./dynamicEventSlide";

export function EventSlideDesigner({
  item,
  canEdit,
}: {
  item: ServiceItem;
  canEdit: boolean;
}) {
  const state = usePresentation(),
    settings = normalizeEventSlideSettings(item.metadata);
  const [events,setEvents]=useState(getLatestPublicEvents);
  useEffect(()=>{const update=()=>setEvents(getLatestPublicEvents());window.addEventListener('gottesdienstregie:community-events',update);return()=>window.removeEventListener('gottesdienstregie:community-events',update)},[]);
  const minimum=prepareEventOverview({...item.metadata,eventItemsJson:JSON.stringify(events)}).minDurationMs;
  const change = (patch: { eventDesign?: string; eventLimit?: number }) => {
    state.updateItem(item.id, { metadata: { ...item.metadata, ...patch } });
    const element = item.slides[0]?.elements.find(
      (entry) => entry.type === "loop",
    );
    if (element)
      state.updateElement(element.id, {
        properties: { ...element.properties, ...patch },
      });
  };
  return (
    <section className="event-slide-designer">
      <h4>DESIGN</h4>
      <p className="field-hint">Tabelle ist die empfohlene Übersicht. Gespeicherte Layouts bleiben auswählbar.</p>
      <div className="event-design-cards">
        {EVENT_SLIDE_DESIGNS.map((design) => (
          <button
            type="button"
            key={design}
            disabled={!canEdit}
            aria-pressed={settings.design === design}
            onClick={() => change({ eventDesign: design })}
          >
            <span className={`event-design-preview event-design-${design}`}>
              <i />
              <i />
              <i />
            </span>
            <small>{EVENT_SLIDE_DESIGN_LABELS[design]}</small>
          </button>
        ))}
      </div>
      <label>
        Anzahl Veranstaltungen
        <input
          type="number"
          min="2"
          max={settings.design==='table'?50:8}
          step="1"
          disabled={!canEdit}
          value={settings.limit}
          onChange={(event) =>
            change({
              eventLimit: Math.max(
                2,
                Math.min(settings.design==='table'?50:8, Number(event.target.value) || 2),
              ),
            })
          }
        />
      </label>
      <p className="field-hint">Bei Platzmangel scrollt die Liste automatisch. Mindestdauer aktuell: {Math.ceil(minimum/1000)} Sekunden. Eine längere eingestellte Dauer bleibt erhalten.</p>
    </section>
  );
}
