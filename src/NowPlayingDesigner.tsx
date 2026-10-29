import {useI18n} from './i18n';
import type { ServiceItem } from "./store";
import { usePresentation } from "./store";
import {
  NOW_PLAYING_ANIMATIONS,
  NOW_PLAYING_DESIGNS,
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
  const {tx}=useI18n();
  const designLabels = {
  "cover-left": tx("Cover links"),
  "cover-hero": tx("Cover groß"),
  minimal: tx("Minimal"),
  vinyl: tx("Vinyl"),
  radio: tx("Radio"),
  gradient: tx("Verlauf"),
  typography: tx("Typografie"),
  stage: tx("Bühne"),
  "split-card": tx("Split Card"),
  neon: tx("Neon"),
};
  const animationLabels = {
    "fade-rise": tx("Sanft einblenden"),
    "vinyl-spin": tx("Vinyl drehen"),
    "cover-zoom": tx("Cover-Zoom"),
    "slide-left": tx("Von links"),
    "slide-right": tx("Von rechts"),
    pulse: tx("Pulsieren"),
    float: tx("Schweben"),
    flip: tx("Aufklappen"),
    glow: tx("Leuchten"),
    none: tx("Ohne Animation"),
  };
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
    <section className="now-playing-designer" aria-label={tx("Läuft-gerade-Design")}>
      <h4>{tx("DESIGN")}</h4>
      <div className="now-playing-design-cards">
        {NOW_PLAYING_DESIGNS.map((design) => (
          <button
            type="button"
            key={design}
            disabled={!canEdit}
            aria-label={tx("Design: {name}",{name:designLabels[design]})}
            aria-pressed={settings.design === design}
            onClick={() => change({ design })}
          >
            <span className={`now-playing-card-preview design-${design}`}>
              <i />
              <b>Ä Ö Ü</b>
            </span>
            <small>{designLabels[design]}</small>
          </button>
        ))}
      </div>
      <h4>{tx("ANIMATION")}</h4>
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
            <small>{animationLabels[animation]}</small>
          </button>
        ))}
      </div>
      <div className="now-playing-controls">
        <label>
          {tx("Hintergrundfarbe")}<input
            aria-label={tx("Hintergrundfarbe")}
            type="color"
            disabled={!canEdit}
            value={settings.backgroundColor}
            onChange={(event) =>
              change({ backgroundColor: event.target.value })
            }
          />
        </label>
        <label>
          {tx("Akzentfarbe")}<input
            aria-label={tx("Akzentfarbe")}
            type="color"
            disabled={!canEdit}
            value={settings.accentColor}
            onChange={(event) => change({ accentColor: event.target.value })}
          />
        </label>
        <label>
          {tx("Textfarbe")}<input
            aria-label={tx("Textfarbe")}
            type="color"
            disabled={!canEdit}
            value={settings.textColor}
            onChange={(event) => change({ textColor: event.target.value })}
          />
        </label>
        <label>
          {tx("Schreibweise")}<select
            aria-label={tx("Schreibweise")}
            disabled={!canEdit}
            value={settings.textCase}
            onChange={(event) =>
              change({
                textCase: event.target
                  .value as NowPlayingPresentationSettings["textCase"],
              })
            }
          >
            <option value="normal">{tx("Wie eingegeben")}</option>
            <option value="uppercase">{tx("GROSSBUCHSTABEN")}</option>
            <option value="lowercase">{tx("kleinbuchstaben")}</option>
          </select>
        </label>
        <label>
          {tx("Visualizer-Position")}<select
            aria-label={tx("Visualizer-Position")}
            disabled={!canEdit}
            value={settings.visualizerPosition}
            onChange={(event) =>
              change({
                visualizerPosition: event.target
                  .value as NowPlayingPresentationSettings["visualizerPosition"],
              })
            }
          >
            <option value="top-left">{tx("Oben links")}</option>
            <option value="top-right">{tx("Oben rechts")}</option>
            <option value="bottom-left">{tx("Unten links")}</option>
            <option value="bottom-right">{tx("Unten rechts")}</option>
          </select>
        </label>
        <label>
          {tx("Visualizer-Stil")}<select
            disabled={!canEdit}
            value={settings.visualizerStyle}
            onChange={(event) =>
              change({
                visualizerStyle: event.target
                  .value as NowPlayingPresentationSettings["visualizerStyle"],
              })
            }
          >
            <option value="bars">{tx("Balken")}</option>
            <option value="wave">{tx("Welle")}</option>
            <option value="dots">{tx("Punkte")}</option>
            <option value="ring">{tx("Ring")}</option>
          </select>
        </label>
        <label>
          {tx("Anzeigedauer in Sekunden")}<input
            aria-label={tx("Anzeigedauer in Sekunden")}
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
            ["roundArtwork", "Cover rund anzeigen"],
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
