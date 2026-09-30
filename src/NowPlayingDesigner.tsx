import type { ServiceItem } from "./store";
import { usePresentation } from "./store";
import {
  NOW_PLAYING_ANIMATIONS,
  NOW_PLAYING_ANIMATION_LABELS,
  NOW_PLAYING_DESIGNS,
  NOW_PLAYING_DESIGN_LABELS,
  normalizeNowPlayingSettings,
  nowPlayingSettingsPatch,
  type NowPlayingPresentationSettings,
} from "./nowPlayingModel";

export function NowPlayingDesigner({
  item,
  canEdit,
}: {
  item: ServiceItem;
  canEdit: boolean;
}) {
  const state = usePresentation(),
    settings = normalizeNowPlayingSettings(item.metadata);
  const change = (patch: Partial<NowPlayingPresentationSettings>) => {
    const next = { ...settings, ...patch },
      metadata = { ...item.metadata, ...nowPlayingSettingsPatch(next) },
      seconds = Math.max(1, next.durationSeconds);
    state.updateItem(item.id, {
      metadata,
      plannedDuration: seconds * 1000,
      timing: {
        ...item.timing,
        slideDurationSeconds: seconds,
        totalDurationSeconds: seconds,
      },
    });
    const element = item.slides[0]?.elements.find(
      (entry) => entry.type === "loop",
    );
    if (element)
      state.updateElement(element.id, {
        properties: { ...element.properties, ...nowPlayingSettingsPatch(next) },
      });
  };
  return (
    <section className="now-playing-designer" aria-label="Läuft-gerade-Design">
      <h4>DESIGN</h4>
      <div className="now-playing-design-cards">
        {NOW_PLAYING_DESIGNS.map((design) => (
          <button
            type="button"
            key={design}
            disabled={!canEdit}
            aria-label={`Design: ${NOW_PLAYING_DESIGN_LABELS[design]}`}
            aria-pressed={settings.design === design}
            onClick={() => change({ design })}
          >
            <span className={`now-playing-card-preview design-${design}`}>
              <i />
              <b>Ä Ö Ü</b>
            </span>
            <small>{NOW_PLAYING_DESIGN_LABELS[design]}</small>
          </button>
        ))}
      </div>
      <h4>ANIMATION</h4>
      <div className="now-playing-animation-cards">
        {NOW_PLAYING_ANIMATIONS.map((animation) => (
          <button
            type="button"
            key={animation}
            disabled={!canEdit}
            aria-pressed={settings.animation === animation}
            onClick={() => change({ animation })}
          >
            <span className={`animation-preview animation-${animation}`}>
              <i />
            </span>
            <small>{NOW_PLAYING_ANIMATION_LABELS[animation]}</small>
          </button>
        ))}
      </div>
      <div className="now-playing-controls">
        <label>
          Hintergrundfarbe
          <input
            aria-label="Hintergrundfarbe"
            type="color"
            disabled={!canEdit}
            value={settings.backgroundColor}
            onChange={(event) =>
              change({ backgroundColor: event.target.value })
            }
          />
        </label>
        <label>
          Akzentfarbe
          <input
            aria-label="Akzentfarbe"
            type="color"
            disabled={!canEdit}
            value={settings.accentColor}
            onChange={(event) => change({ accentColor: event.target.value })}
          />
        </label>
        <label>
          Textfarbe
          <input
            aria-label="Textfarbe"
            type="color"
            disabled={!canEdit}
            value={settings.textColor}
            onChange={(event) => change({ textColor: event.target.value })}
          />
        </label>
        <label>
          Schreibweise
          <select
            aria-label="Schreibweise"
            disabled={!canEdit}
            value={settings.textCase}
            onChange={(event) =>
              change({
                textCase: event.target
                  .value as NowPlayingPresentationSettings["textCase"],
              })
            }
          >
            <option value="normal">Wie eingegeben</option>
            <option value="uppercase">GROSSBUCHSTABEN</option>
            <option value="lowercase">kleinbuchstaben</option>
          </select>
        </label>
        <label>
          Visualizer-Position
          <select
            aria-label="Visualizer-Position"
            disabled={!canEdit}
            value={settings.visualizerPosition}
            onChange={(event) =>
              change({
                visualizerPosition: event.target
                  .value as NowPlayingPresentationSettings["visualizerPosition"],
              })
            }
          >
            <option value="top-left">Oben links</option>
            <option value="top-right">Oben rechts</option>
            <option value="bottom-left">Unten links</option>
            <option value="bottom-right">Unten rechts</option>
          </select>
        </label>
        <label>
          Visualizer-Stil
          <select
            disabled={!canEdit}
            value={settings.visualizerStyle}
            onChange={(event) =>
              change({
                visualizerStyle: event.target
                  .value as NowPlayingPresentationSettings["visualizerStyle"],
              })
            }
          >
            <option value="bars">Balken</option>
            <option value="wave">Welle</option>
            <option value="dots">Punkte</option>
            <option value="ring">Ring</option>
          </select>
        </label>
        <label>
          Anzeigedauer in Sekunden
          <input
            aria-label="Anzeigedauer in Sekunden"
            type="number"
            min="1"
            step="1"
            disabled={!canEdit}
            value={settings.durationSeconds}
            onChange={(event) =>
              change({
                durationSeconds: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
        </label>
      </div>
      <div className="now-playing-toggles">
        {(
          [
            ["showArtwork", "Cover anzeigen"],
            ["showTitle", "Titel anzeigen"],
            ["showArtist", "Interpret anzeigen"],
            ["showAlbum", "Album anzeigen"],
            ["skipWhenIdle", "Folie überspringen, wenn gerade nichts läuft"],
          ] as const
        ).map(([key, label]) => (
          <label className="setting-check" key={key}>
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={settings[key]}
              onChange={(event) => change({ [key]: event.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
