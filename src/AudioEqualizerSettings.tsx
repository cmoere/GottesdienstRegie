import { usePreferences, type AudioEqualizerMode } from "./preferences";

const bands = ["31 Hz", "63 Hz", "125 Hz", "250 Hz", "500 Hz", "1 kHz", "2 kHz", "4 kHz", "8 kHz", "16 kHz"];

export function AudioEqualizerSettings() {
  const { audioEqualizer, setAudioEqualizer } = usePreferences();
  const values = audioEqualizer?.bands ?? bands.map(() => 0);
  const mode: AudioEqualizerMode = audioEqualizer?.mode ?? "standard";
  const setBand = (index: number, value: number) => {
    const next = [...values];
    next[index] = value;
    setAudioEqualizer({ mode: "custom", bands: next });
  };
  return (
    <section className="audio-equalizer-settings">
      <h3>EQUALIZER</h3>
      <p>Eigene Klangkorrekturen werden gespeichert und gelten für Vorschau und Wiedergabe. ON AIR bleibt während einer Änderung ungestört.</p>
      <div className="equalizer-mode-switch" role="group" aria-label="Equalizer-Modus">
        <button className={mode === "standard" ? "active" : ""} onClick={() => setAudioEqualizer({ mode: "standard" })}>
          Standard
        </button>
        <button className={mode === "custom" ? "active" : ""} onClick={() => setAudioEqualizer({ mode: "custom" })}>
          Eigene Einstellung
        </button>
      </div>
      <div className={`equalizer-bands ${mode === "standard" ? "disabled" : ""}`}>
        {bands.map((label, index) => (
          <label key={label}>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={values[index] ?? 0}
              disabled={mode === "standard"}
              onChange={(event) => setBand(index, Number(event.target.value))}
              aria-label={label}
            />
            <output>{values[index] ?? 0} dB</output>
            <small>{label}</small>
          </label>
        ))}
      </div>
      <div className="equalizer-actions">
        <span>{mode === "standard" ? "Neutraler Standardklang" : "Eigene Kurve aktiv"}</span>
        <button onClick={() => setAudioEqualizer({ mode: "custom", bands: bands.map(() => 0) })}>
          Zurücksetzen
        </button>
      </div>
    </section>
  );
}
