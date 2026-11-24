import {UiIcon} from './icons/UiIcon';
import { useEffect, useRef, useState } from "react";
import { searchRadioStations, suggestRadioStations, type RadioStation } from "./radioStations";
import type { BackgroundAudioTrack } from "./store";
import { startRadioPreview } from "./radioPlayback";
import {useI18n} from './i18n';
const PAGE_SIZE = 10;

function StationArtwork({url}: {url: string}) {
  const [failed, setFailed] = useState(false);
  return <span className="radio-station-artwork" aria-hidden="true">
    {url && !failed
      ? <img src={url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : <UiIcon name="radio" />}
  </span>;
}
export function RadioStationBrowser({
  add,
}: {
  add: (track: BackgroundAudioTrack) => void;
}) {
  const {t}=useI18n();
  const [query, setQuery] = useState(""),
    [stations, setStations] = useState<RadioStation[]>([]),
    [suggested, setSuggested] = useState<RadioStation[]>([]),
    [loadingSuggestions, setLoadingSuggestions] = useState(true),
    [showSuggestions, setShowSuggestions] = useState(true),
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
  useEffect(() => {
    const request = new AbortController();
    void suggestRadioStations(request.signal).then(found => {
      if (!request.signal.aborted) setSuggested(found);
    }).catch(() => {
      // Search remains available if suggestions cannot be loaded.
    }).finally(() => {
      if (!request.signal.aborted) setLoadingSuggestions(false);
    });
    return () => request.abort();
  }, []);
  const results = showSuggestions ? suggested : stations;
  const clearSearch = () => {
    setQuery("");
    setError(null);
    setVisible(PAGE_SIZE);
    setShowSuggestions(true);
  };
  const search = async () => {
    if (busy) return;
    if (!query.trim()) {
      clearSearch();
      return;
    }
    setShowSuggestions(false);
    setStations([]);
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
      <form className="radio-search" onSubmit={event => {event.preventDefault();void search();}}>
        <span className="radio-query">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('radioBrowserQuery')}
          />
          {query && (
            <button
              type="button"
              aria-label={t('radioBrowserClear')}
              title={t('radioBrowserClear')}
              disabled={busy}
              onClick={clearSearch}
            >
              <UiIcon name="close" aria-hidden="true" />
            </button>
          )}
        </span>
        <button type="submit" disabled={busy}>
          {busy ? t('radioBrowserSearching') : t('radioBrowserSearch')}
        </button>
      </form>
      {showSuggestions && (loadingSuggestions || results.length > 0) && (
        <h5>{t('radioBrowserSuggestions')}</h5>
      )}
      {showSuggestions && loadingSuggestions && <p role="status">{t('radioBrowserLoading')} …</p>}
      {error && <p role="alert">{error.kind==='empty'?t('radioBrowserEmpty'):t('radioBrowserSearchFailed',{detail:error.detail})}</p>}
      <div className="radio-results">
        {results.slice(0, visible).map((station) => (
          <article key={station.id}>
            <StationArtwork key={station.artworkUrl} url={station.artworkUrl} />
            <button
              className="radio-play"
              onClick={() => play(station)}
              aria-label={t('radioBrowserPlay',{station:station.name})}
            >
              <UiIcon name={active?.id === station.id && status === "playing"
                  ? "pause_circle"
                  : "play_circle"} />
            </button>
            <span className="radio-station-text">
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
      {results.length > PAGE_SIZE && (
        <div className="radio-pagination">
          {visible < results.length && (
            <button
              onClick={() =>
                setVisible((value) =>
                  Math.min(results.length, value + PAGE_SIZE),
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
          <StationArtwork key={active.artworkUrl} url={active.artworkUrl} />
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
