import type { ServiceItem } from "./store";
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
          max="8"
          step="1"
          disabled={!canEdit}
          value={settings.limit}
          onChange={(event) =>
            change({
              eventLimit: Math.max(
                2,
                Math.min(8, Number(event.target.value) || 2),
              ),
            })
          }
        />
      </label>
    </section>
  );
}
