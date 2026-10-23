import { useEffect, useRef, useState } from "react";
import { searchRadioStations, type RadioStation } from "./radioStations";
import type { BackgroundAudioTrack } from "./store";
import { startRadioPreview } from "./radioPlayback";
import {useI18n} from './i18n';
const PAGE_SIZE = 10;
export function RadioStationBrowser({
  add,
}: {
  add: (track: BackgroundAudioTrack) => void;
}) {
  const {t}=useI18n();
  const [query, setQuery] = useState(""),
    [stations, setStations] = useState<RadioStation[]>([]),
    [visible, setVisible] = useState(PAGE_SIZE),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<{kind:'empty'}|{kind:'search';detail:string}|null>(null),
    [active, setActive] = useState<RadioStation | null>(null),
    [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">(
      "idle",
    ),
    [liveTitle, setLiveTitle] = useState(""),
    [liveArtist, setLiveArtist] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(()=>{
    const media=audioRef.current;
    return()=>{if(media?.getAttribute('src')){media.pause();media.removeAttribute('src');media.load()}};
  },[]);
  const search = async () => {
    setBusy(true);
    setError(null);
    setVisible(PAGE_SIZE);
    try {
      const found = await searchRadioStations(query);
      setStations(found);
      if (!found.length)
        setError({kind:'empty'});
    } catch (reason) {
      setError({kind:'search',detail:reason instanceof Error?reason.message:String(reason)});
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!active) return;
    const radio = (window.desktop as any)?.radio;
    const sessionId=crypto.randomUUID();
    const off = radio?.onMetadata?.(
      (value: { stationId: string; title: string; artist: string;sessionId?:string }) => {
        if (value.stationId !== active.id||value.sessionId!==sessionId) return;
        setLiveTitle(value.title);
        setLiveArtist(value.artist);
      },
    );
    void radio?.startMetadata?.(active.id, active.streamUrl,sessionId,'preview');
    return () => {
      off?.();
      void radio?.stopMetadata?.(sessionId,'preview');
    };
  }, [active]);
  const play = (station: RadioStation) => {
    audioRef.current?.pause();
    setActive(station);
    setLiveTitle("");
    setLiveArtist("");
    setStatus("loading");
    const media = audioRef.current;
    if (media)
      void startRadioPreview(media, station.streamUrl).catch(() =>
        setStatus("error"),
      );
  };
  return (
    <section className="radio-station-browser">
      <header>
        <h4>{t('radioBrowserHeading')}</h4>
        <p>{t('radioBrowserIntro')}</p>
      </header>
      <div className="radio-search">
        <span className="radio-query">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void search();
              }
            }}
            placeholder={t('radioBrowserQuery')}
          />
          {query && (
            <button
              type="button"
              aria-label={t('radioBrowserClear')}
              title={t('radioBrowserClear')}
              onClick={() => setQuery("")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          )}
        </span>
        <button disabled={busy} onClick={() => void search()}>
          {busy ? t('radioBrowserSearching') : t('radioBrowserSearch')}
        </button>
      </div>
      {error && <p role="alert">{error.kind==='empty'?t('radioBrowserEmpty'):t('radioBrowserSearchFailed',{detail:error.detail})}</p>}
      <div className="radio-results">
        {stations.slice(0, visible).map((station) => (
          <article key={station.id}>
            <button
              className="radio-play"
              onClick={() => play(station)}
              aria-label={t('radioBrowserPlay',{station:station.name})}
            >
              <span className="material-symbols-outlined">
                {active?.id === station.id && status === "playing"
                  ? "pause_circle"
                  : "play_circle"}
              </span>
            </button>
            <span>
              <b>{station.name}</b>
              <small>
                {[
                  station.country,
                  station.language,
                  station.codec,
                  station.bitrate ? `${station.bitrate} kbit/s` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </span>
            <button
              onClick={() =>
                add({
                  assetId: `radio:${station.id}`,
                  name: station.name,
                  url: station.streamUrl,
                  artist: "Online-Radio",
                  album: station.name,
                  imageUrl: station.artworkUrl,
                  format: station.codec || "Stream",
                  status: "ready",
                })
              }
            >
              {t('radioBrowserAdd')}
            </button>
          </article>
        ))}
      </div>
      {stations.length > PAGE_SIZE && (
        <div className="radio-pagination">
          {visible < stations.length && (
            <button
              onClick={() =>
                setVisible((value) =>
                  Math.min(stations.length, value + PAGE_SIZE),
                )
              }
            >
              {t('radioBrowserMore')}
            </button>
          )}
          {visible > PAGE_SIZE && (
            <button onClick={() => setVisible(PAGE_SIZE)}>
              {t('radioBrowserLess')}
            </button>
          )}
        </div>
      )}
      <audio
        ref={audioRef}
        preload="none"
        onLoadStart={() => setStatus("loading")}
        onWaiting={() => setStatus("loading")}
        onPlaying={() => setStatus("playing")}
        onError={() => setStatus("error")}
      />
      {active && (
        <footer className={`radio-now-playing ${status}`} aria-live="polite">
          {active.artworkUrl ? (
            <img src={active.artworkUrl} alt="" />
          ) : (
            <span className="material-symbols-outlined" aria-hidden="true">radio</span>
          )}
          <div>
            <small>
              {status === "loading" ? (
                <>
                  {t('radioBrowserLoading')}
                  <span className="loading-dots" />
                </>
              ) : status === "error" ? (
                t('radioBrowserPlaybackFailed')
              ) : (
                t('radioBrowserNowLive')
              )}
            </small>
            <b>{liveTitle || active.name}</b>
            {liveTitle && (
              <span>
                {[liveArtist, active.name].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </footer>
      )}
    </section>
  );
}
