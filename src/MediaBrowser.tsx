import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "./preferences";
import { applyAudioRoute, defaultAudioRouting } from "./audioRouting";
const Icon = ({ name }: { name: string }) => (
  <span className="material-symbols-outlined" aria-hidden="true">
    {name}
  </span>
);
type Context = "manage" | "select";
type Purpose = "item" | "background" | "foreground" | "audio";
type TargetType = "section" | "serviceItem";
const bytes = (value: number) =>
  value < 1048576
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / 1048576).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
const typeName = (kind: CloudMediaAsset["kind"]) =>
  ({ image: "Bild", video: "Video", audio: "Audio", pdf: "PDF" })[kind];
const generatorStyles = [
  ["soft", "Ruhig und weich"],
  ["bold", "Kräftig und kontrastreich"],
  ["dark", "Dunkel für helle Schrift"],
  ["light", "Hell und freundlich"],
  ["glass", "Modernes Glasdesign"],
  ["aurora", "Leuchtende Aurora"],
  ["paper", "Papier und organische Flächen"],
  ["geometric", "Geometrisch und klar"],
  ["sunset", "Warmer Sonnenuntergang"],
  ["ocean", "Tiefe Meeresfarben"],
  ["minimal", "Minimalistisch"],
  ["festive", "Festlich und lebendig"],
  ["cinematic", "Filmisch und atmosphärisch"],
  ["documentary", "Natürlich und dokumentarisch"],
  ["watercolor", "Aquarell und malerisch"],
  ["noir", "Dunkles Kino"],
  ["pastel", "Sanfte Pastelltöne"],
  ["vintage", "Warmer Vintage-Look"],
  ["highkey", "Helles High-Key-Licht"],
  ["lowkey", "Kontrastreiches Low-Key-Licht"],
  ["editorial", "Modernes Editorial-Design"],
  ["calm", "Meditativ und reduziert"],
] as const;
const generatorScenes = [
  ["abstract", "Abstrakt"],
  ["nature", "Natur und Landschaft"],
  ["forest", "Wald und Lichtung"],
  ["mountains", "Berge und Täler"],
  ["city", "Stadt und Architektur"],
  ["ocean", "Meer und Küste"],
  ["sky", "Himmel und Licht"],
  ["church", "Kirchenraum und Gemeinde"],
  ["lake", "See und Ufer"],
  ["meadow", "Wiese und Felder"],
  ["desert", "Wüste und Weite"],
  ["winter", "Winterlandschaft"],
  ["garden", "Garten und Pflanzen"],
  ["nightcity", "Stadt bei Nacht"],
  ["sunrise", "Sonnenaufgang"],
  ["rain", "Regen und ruhige Stimmung"],
] as const;
const generatorIdeas = [
  "Eine realistische weite Naturlandschaft im 16:9-Format kurz nach Sonnenaufgang: echtes warmes Licht fällt über eine grüne Wiese, im Hintergrund stehen natürliche Baumgruppen und sanfte Hügel, leichte Bodennebel erzeugen Tiefe. Die Bildmitte bleibt ruhig und kontrastarm für gut lesbare Liedtexte. Keine geometrischen Formen, keine Illustration, keine Schrift, keine Logos und keine erkennbaren Personen.",
  "Eine glaubwürdige europäische Stadtansicht in der blauen Stunde, aufgenommen aus leicht erhöhter Perspektive. Warme Fensterlichter, dezente Straßenreflexionen und natürliche architektonische Details rahmen eine ruhigere Fläche in der Mitte ein. Hochwertiger filmischer Fotolook, 16:9, ohne Schrift, Logos, Plakate oder erkennbare Personen.",
  "Ein echter dichter Wald mit hohen Bäumen und einer offenen Lichtung, durch die weiches Morgenlicht fällt. Natürliche Farben, sichtbare Blätter, Rinde, Moos und feiner Dunst, fotografisch und räumlich glaubwürdig. Der zentrale Bereich bleibt ruhig genug für weißen Präsentationstext; keine abstrakten Formen, keine Illustration und keine Personen.",
  "Eine realistische Berglandschaft mit weitem Tal, natürlichen Felsstrukturen und Wolken, die von spätem goldenem Sonnenlicht beleuchtet werden. Ruhige, würdige Atmosphäre, hochwertige Landschaftsfotografie im 16:9-Format und freie dunklere Textfläche im unteren Drittel, ohne Schrift oder künstliche Formen.",
  "Eine ruhige Meeresküste mit echten Wellen, dunklen Felsen und einem weiten Himmel nach Sonnenuntergang. Natürliches Licht, feine Wasserbewegung, dezente Farbtöne und eine klare freie Fläche für Bibeltexte. Fotorealistisch, 16:9, ohne Schrift, Logos oder Personen.",
  "Ein heller moderner Kirchenraum mit natürlichem Tageslicht, Holz, dezenten warmen Materialien und großer räumlicher Tiefe. Symmetrische, ruhige Komposition mit freier Bildmitte für Ankündigungstext, fotografischer Look, keine Personen, keine sichtbaren Marken und keine eingebettete Schrift.",
  "Ein weiter See in Mitteleuropa an einem stillen Morgen mit natürlichen Spiegelungen, Schilf am Bildrand, echten Wolken und leichtem Nebel über dem Wasser. Realistische Fotografie mit ruhiger Mitte und ausgewogener Belichtung für helle Überschriften, ohne künstliche Formen oder Schrift.",
  "Eine lebendige, aber ruhige Gartenlandschaft mit natürlichen Gräsern, Blüten, weichem Gegenlicht und geringer Tiefenschärfe. Fotorealistisch, hochwertig, 16:9, großzügige unscharfe Fläche für Text, keine Menschen, Logos oder grafischen Elemente.",
];
const generatorPhotoSources: Record<string, string> = {
  nature: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  forest: new URL("./assets/login-backgrounds/scene-07.png", import.meta.url)
    .href,
  mountains: new URL(
    "./assets/login-backgrounds/german-lake.png",
    import.meta.url,
  ).href,
  city: new URL("./assets/login-backgrounds/bielefeld.png", import.meta.url)
    .href,
  ocean: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  sky: new URL("./assets/login-backgrounds/scene-06.png", import.meta.url).href,
  church: new URL("./assets/login-backgrounds/scene-05.png", import.meta.url)
    .href,
  lake: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  meadow: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  desert: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  winter: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  garden: new URL("./assets/login-backgrounds/german-lake.png", import.meta.url)
    .href,
  nightcity: new URL(
    "./assets/login-backgrounds/german-city-night.png",
    import.meta.url,
  ).href,
  sunrise: new URL(
    "./assets/login-backgrounds/german-lake.png",
    import.meta.url,
  ).href,
  rain: new URL("./assets/login-backgrounds/scene-08.png", import.meta.url)
    .href,
};
const loadGeneratorPhoto = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const photo = new Image();
    photo.onload = () => resolve(photo);
    photo.onerror = reject;
    photo.src = src;
  });
const drawCover = (
  context: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  width: number,
  height: number,
) => {
  const scale = Math.max(
      width / photo.naturalWidth,
      height / photo.naturalHeight,
    ),
    sourceWidth = width / scale,
    sourceHeight = height / scale;
  context.drawImage(
    photo,
    (photo.naturalWidth - sourceWidth) / 2,
    (photo.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
};
export function MediaBrowser() {
  const prefs = usePreferences();
  const initial = useMemo(() => {
    const q = new URLSearchParams(location.hash.split("?")[1] ?? ""),
      rawPurpose = q.get("purpose"),
      purpose = (
        rawPurpose === "audio"
          ? "audio"
          : rawPurpose === "background"
            ? "background"
            : rawPurpose === "foreground"
              ? "foreground"
              : "item"
      ) as Purpose;
    return {
      context: (q.get("context") === "select" ? "select" : "manage") as Context,
      purpose,
      targetType: (q.get("targetType") === "serviceItem"
        ? "serviceItem"
        : "section") as TargetType,
      targetId: q.get("targetId") ?? "",
    };
  }, []);
  const [context, setContext] = useState(initial.context),
    [purpose, setPurpose] = useState(initial.purpose),
    [targetType, setTargetType] = useState<TargetType>(initial.targetType),
    [targetId, setTargetId] = useState(initial.targetId),
    [items, setItems] = useState<CloudMediaAsset[]>([]),
    [cloudItems, setCloudItems] = useState<CloudMediaAsset[]>([]),
    [selected, setSelected] = useState<CloudMediaAsset | null>(null),
    [audioSelection, setAudioSelection] = useState<CloudMediaAsset[]>([]),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState(initial.purpose === "audio" ? "audio" : "all"),
    [sort, setSort] = useState("newest"),
    [tab, setTab] = useState<"cloud" | "community" | "unsplash">("cloud"),
    [libraryFilter, setLibraryFilter] = useState<
      "all" | "recent" | "favorites"
    >("all"),
    [visibleCount, setVisibleCount] = useState(30),
    [loading, setLoading] = useState(true),
    [offline, setOffline] = useState(false),
    [cloudStatus, setCloudStatus] = useState<MediaStorageStatus | null>(null),
    [busy, setBusy] = useState(""),
    [staged, setStaged] = useState<MediaAsset[]>([]),
    [uploadName, setUploadName] = useState(""),
    [uploadTags, setUploadTags] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CloudMediaAsset | null>(
      null,
    ),
    [gridSize, setGridSize] = useState(() =>
      Number(localStorage.getItem("gottesdienstregie.media-grid-size") || 190),
    ),
    [generatorOpen, setGeneratorOpen] = useState(false),
    [generatorPrompt, setGeneratorPrompt] = useState(
      () => generatorIdeas[Math.floor(Math.random() * generatorIdeas.length)],
    ),
    [generatorStyle, setGeneratorStyle] = useState<string>(
      () =>
        generatorStyles[Math.floor(Math.random() * generatorStyles.length)][0],
    ),
    [generatorScene, setGeneratorScene] = useState<string>(
      () =>
        generatorScenes[Math.floor(Math.random() * generatorScenes.length)][0],
    ),
    [generatorOutput, setGeneratorOutput] = useState<"image" | "video">(
      "image",
    ),
    [generatorDuration, setGeneratorDuration] = useState(30),
    [generating, setGenerating] = useState(false),
    [generatorError, setGeneratorError] = useState(""),
    [unsplashPage, setUnsplashPage] = useState(1),
    [unsplashHasMore, setUnsplashHasMore] = useState(true),
    [unsplashQuery, setUnsplashQuery] = useState(""),
    [unsplashLoadingMore, setUnsplashLoadingMore] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null),
    api = (window.desktop as any)?.media,
    mediaWindow = (window.desktop as any)?.mediaWindow,
    isAudio = purpose === "audio";
  const audioRouting = usePreferences((state) => state.audioRouting);
  async function refresh(target = tab) {
    setLoading(true);
    try {
      const status = await api?.onlineStatus?.().catch(() => null);
      if (!status?.online)
        throw new Error(status?.message || "MEDIA_STORAGE_OFFLINE");
      const cloud = await (api?.cloudList() ?? Promise.resolve([])).catch(
        () => [] as CloudMediaAsset[],
      );
      setCloudItems(cloud);
      setItems(
        target === "community"
          ? cloud.filter(
              (entry: CloudMediaAsset) => entry.visibility === "community",
            )
          : cloud,
      );
      setCloudStatus(status);
      setOffline(false);
      setSelected((current) =>
        current
          ? (cloud.find(
              (entry: CloudMediaAsset) =>
                entry.id === current.id ||
                entry.path === current.path ||
                entry.checksum === current.checksum,
            ) ?? null)
          : null,
      );
    } catch {
      setCloudStatus(null);
      setOffline(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  async function searchUnsplash(search = query, page = 1, append = false) {
    const normalizedSearch = search.trim();
    if (append) setUnsplashLoadingMore(true);
    else {
      setLoading(true);
      setVisibleCount(30);
      setUnsplashQuery(normalizedSearch);
    }
    setOffline(false);
    try {
      const key = usePreferences.getState().unsplashAccessKey,
        results: CloudMediaAsset[] =
          (await api?.unsplashSearch(normalizedSearch, key, page)) ?? [];
      setItems((current) =>
        append
          ? [
              ...current,
              ...results.filter(
                (result) => !current.some((item) => item.id === result.id),
              ),
            ]
          : results,
      );
      setUnsplashPage(page);
      setUnsplashHasMore(results.length === 30);
      if (!append) setSelected(null);
    } catch (error) {
      setOffline(true);
      alert(
        `Unsplash konnte nicht geladen werden. Bitte prüfe die Internetverbindung und versuche es erneut.\n\n${String(error).replace(/^Error invoking remote method '[^']+':\s*/, "")}`,
      );
    } finally {
      if (append) setUnsplashLoadingMore(false);
      else setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const dispose = mediaWindow?.onContext(
      (next: {
        context: Context;
        purpose: Purpose;
        targetType?: TargetType;
        targetId?: string;
      }) => {
        setContext(next.context);
        setPurpose(next.purpose);
        setKind(next.purpose === "audio" ? "audio" : "all");
        setTargetType(next.targetType ?? "section");
        setTargetId(next.targetId ?? "");
        setAudioSelection([]);
      },
    );
    return () => dispose?.();
  }, []);
  useEffect(() => {
    if (selected?.kind !== "audio") return;
    const frame = requestAnimationFrame(() => {
      const audio = document.querySelector<HTMLAudioElement>(
        ".detail-preview audio",
      );
      if (!audio) return;
      const routing = {
        ...defaultAudioRouting,
        ...audioRouting,
        preview: { ...defaultAudioRouting.preview, ...audioRouting?.preview },
      };
      void applyAudioRoute(audio, routing, "preview");
    });
    return () => cancelAnimationFrame(frame);
  }, [selected?.id, audioRouting]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (
        event.key === "Delete" &&
        selected &&
        tab !== "unsplash" &&
        context === "manage"
      ) {
        event.preventDefault();
        setDeleteTarget(selected);
      }
      if (event.key === "Escape") {
        if (deleteTarget) setDeleteTarget(null);
        else if (context === "select") void mediaWindow?.close();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [context, selected, tab, deleteTarget]);
  const shown = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (kind === "all" || item.kind === kind) &&
            (purpose !== "background" ||
              item.kind === "image" ||
              item.kind === "video") &&
            (purpose !== "foreground" || item.kind === "image") &&
            (!isAudio || item.kind === "audio") &&
            (libraryFilter !== "favorites" || item.favorite) &&
            (libraryFilter !== "recent" || Boolean(item.updatedAt)) &&
            (tab === "unsplash" ||
              `${item.name} ${(item.tags ?? []).join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase())),
        )
        .sort((a, b) =>
          tab === "unsplash"
            ? 0
            : sort === "name"
              ? a.name.localeCompare(b.name)
              : sort === "size"
                ? b.size - a.size
                : String(b.updatedAt ?? "").localeCompare(
                    String(a.updatedAt ?? ""),
                  ),
        )
        .slice(
          0,
          libraryFilter === "recent"
            ? Math.min(20, visibleCount)
            : visibleCount,
        ),
    [
      items,
      kind,
      purpose,
      isAudio,
      query,
      sort,
      libraryFilter,
      visibleCount,
      tab,
    ],
  );
  const totalMatches = useMemo(
    () =>
      items.filter(
        (item) =>
          (kind === "all" || item.kind === kind) &&
          (purpose !== "background" ||
            item.kind === "image" ||
            item.kind === "video") &&
          (purpose !== "foreground" || item.kind === "image") &&
          (!isAudio || item.kind === "audio") &&
          (libraryFilter !== "favorites" || item.favorite) &&
          (libraryFilter !== "recent" || Boolean(item.updatedAt)) &&
          (tab === "unsplash" ||
            `${item.name} ${(item.tags ?? []).join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ).length + (tab === "unsplash" && unsplashHasMore ? 1 : 0),
    [items, kind, purpose, isAudio, query, libraryFilter, tab, unsplashHasMore],
  );
  useEffect(() => {
    if (
      tab !== "unsplash" ||
      loading ||
      !unsplashHasMore ||
      visibleCount <= items.length
    )
      return;
    void searchUnsplash(unsplashQuery, unsplashPage + 1, true);
  }, [tab, visibleCount, items.length, unsplashHasMore]);
  function switchTab(next: "cloud" | "community" | "unsplash") {
    setGeneratorOpen(false);
    setTab(next);
    setSelected(null);
    setQuery("");
    setKind(isAudio ? "audio" : "all");
    setLibraryFilter("all");
    setVisibleCount(30);
    setOffline(false);
    if (next === "cloud") {
      setItems(cloudItems);
      void refresh("cloud");
    } else if (next === "community") {
      setLoading(false);
      setItems(cloudItems.filter((entry) => entry.visibility === "community"));
    } else {
      setItems([]);
      setUnsplashPage(1);
      setUnsplashQuery("");
      void searchUnsplash("", 1);
    }
  }
  function resetFilters() {
    setQuery("");
    setKind(isAudio ? "audio" : "all");
    setLibraryFilter("all");
    setVisibleCount(30);
  }
  async function beginUpload() {
    const picked: MediaAsset[] =
      (await api?.import(isAudio ? "audio" : undefined)) ?? [];
    if (!picked.length) return;
    setStaged(picked);
    setUploadName(picked[0].name);
    setUploadTags("");
  }
  const uploadError = (error: unknown) => {
    const value = String(error);
    if (value.includes("MEDIA_STORAGE_NOT_PRIVATE"))
      return "Die Medien-Cloud ist noch nicht als privater Team-Speicher eingerichtet.";
    if (
      value.includes("GITHUB_LOGIN_REQUIRED") ||
      value.includes("HTTP_401") ||
      value.includes("HTTP_403")
    )
      return "Die Anmeldung für die Medien-Cloud fehlt oder besitzt keine Upload-Berechtigung.";
    if (value.includes("TOO_LARGE"))
      return "Diese Datei ist für den Cloudspeicher zu groß.";
    if (
      value.includes("OFFLINE") ||
      value.includes("fetch") ||
      value.includes("timeout")
    )
      return "Die Medien-Cloud ist momentan nicht erreichbar. Die Quelldatei bleibt erhalten.";
    return `Der Upload konnte nicht abgeschlossen werden: ${value.replace(/^Error invoking remote method '[^']+':\s*/, "").slice(0, 220)}`;
  };
  async function upload() {
    setBusy("upload");
    try {
      for (const [index, asset] of staged.entries()) {
        await api.update(asset.id, {
          name: index === 0 ? uploadName.trim() || asset.name : asset.name,
          tags: uploadTags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean),
        });
        await api.sync(asset.id);
      }
      setStaged([]);
      await refresh();
    } catch (error) {
      alert(uploadError(error));
    } finally {
      setBusy("");
    }
  }
  async function remove() {
    if (!deleteTarget) {
      if (selected) setDeleteTarget(selected);
      return;
    }
    const target = deleteTarget;
    setBusy(target.id);
    try {
      await api.cloudRemove(target.id);
      setSelected(null);
      setDeleteTarget(null);
      setAudioSelection((list) =>
        list.filter((entry) => entry.id !== target.id),
      );
      await refresh();
    } catch (error) {
      const detail = String(error);
      setDeleteTarget(null);
      alert(
        detail.includes("MEDIA_IN_PRESENTATIONS")
          ? "Dieses Medium wird noch in einer Präsentation verwendet und kann deshalb nicht gelöscht werden."
          : detail.includes("MEDIA_IN_LIVE_USE")
            ? "Während ON AIR können Medien nicht gelöscht werden."
            : "Das Medium konnte nicht gelöscht werden. Bitte prüfe Cloud-Verbindung und Berechtigung.",
      );
    } finally {
      setBusy("");
    }
  }
  function choose(item: CloudMediaAsset) {
    setSelected(item);
    if (isAudio && context === "select")
      setAudioSelection((list) =>
        list.some((entry) => entry.id === item.id)
          ? list.filter((entry) => entry.id !== item.id)
          : [...list, item],
      );
  }
  function reorder(from: number, to: number) {
    setAudioSelection((list) => {
      const next = [...list],
        [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }
  function useSelected() {
    if (isAudio)
      return void mediaWindow?.selectAudio(
        audioSelection,
        targetType,
        targetId,
      );
    if (selected) void mediaWindow?.select(selected, purpose);
  }
  async function generateLocal() {
    const nonce = Date.now() + Math.floor(Math.random() * 100000),
      seed = [
        ...`${generatorPrompt}${generatorStyle}${generatorScene}${nonce}`,
      ].reduce((sum, char) => sum + char.charCodeAt(0), 0),
      hue = seed % 360,
      offset =
        generatorStyle === "bold"
          ? 95
          : generatorStyle === "sunset"
            ? 35
            : generatorStyle === "ocean"
              ? 185
              : 55,
      hue2 = (hue + offset) % 360,
      id = `generated-${nonce}`,
      safe = generatorPrompt.replace(/[<>&"']/g, "").slice(0, 500),
      dark = ["dark", "ocean", "aurora"].includes(generatorStyle),
      light = ["light", "paper"].includes(generatorStyle),
      geometry =
        generatorStyle === "geometric"
          ? `<g opacity=".26"><path d="M0 0L700 0L180 1080H0Z" fill="#fff"/><path d="M1920 0H1420L1740 1080H1920Z" fill="#000"/></g>`
          : "";
    const scenes: Record<string, string> = {
      nature:
        '<path d="M0 830Q420 520 850 790Q1260 470 1920 750V1080H0Z" fill="#173f31" opacity=".55"/>',
      forest:
        '<g fill="#102f27" opacity=".62"><path d="M80 900L260 400L440 900Z"/><path d="M1180 900L1400 330L1620 900Z"/><path d="M1450 900L1700 470L1900 900Z"/></g>',
      mountains:
        '<path d="M0 900L430 350L720 720L1050 250L1500 800L1740 470L1920 700V1080H0Z" fill="#172936" opacity=".62"/>',
      city: '<g fill="#101923" opacity=".68"><path d="M0 880V520H210V880M250 880V390H520V880M1370 880V470H1570V880M1610 880V300H1880V880"/><path d="M840 880V610H1110V880"/></g>',
      ocean:
        '<g fill="none" stroke="#fff" stroke-width="18" opacity=".2"><path d="M0 690Q240 610 480 690T960 690T1440 690T1920 690"/><path d="M0 790Q240 710 480 790T960 790T1440 790T1920 790"/></g>',
      sky: '<g fill="#fff" opacity=".18"><circle cx="1500" cy="250" r="130"/><path d="M1500 20V120M1500 380V480M1270 250H1170M1730 250H1830" stroke="#fff" stroke-width="25"/></g>',
      church:
        '<g fill="#111c27" opacity=".58"><path d="M1160 900V390L1460 180L1760 390V900Z"/><path d="M420 900V510H920V900Z"/></g><path d="M1390 900V610Q1460 500 1530 610V900Z" fill="#fff" opacity=".16"/>',
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} ${light ? 28 : 55}% ${dark ? 11 : light ? 88 : 30}%)"/><stop offset="1" stop-color="hsl(${hue2} ${light ? 38 : 68}% ${dark ? 24 : light ? 72 : 54}%)"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="${generatorStyle === "minimal" ? 120 : 75}"/></filter></defs><rect width="1920" height="1080" fill="url(#g)"/>${geometry}<g opacity="${generatorStyle === "minimal" ? ".22" : ".52"}" filter="url(#b)"><circle cx="${240 + (seed % 620)}" cy="${160 + (seed % 260)}" r="${260 + (seed % 180)}" fill="hsl(${(hue + 130) % 360} 72% 64%)"/><circle cx="${1250 + (seed % 400)}" cy="${480 + (seed % 310)}" r="${340 + (seed % 170)}" fill="hsl(${(hue2 + 90) % 360} 72% 56%)"/></g>${scenes[generatorScene] ?? ""}<path d="M0 850 Q480 ${500 + (seed % 210)} 960 820 T1920 ${620 + (seed % 150)} V1080 H0Z" fill="${light ? "#fff" : "#000"}" opacity=".12"/><metadata>${safe}</metadata></svg>`;
    setGenerating(true);
    setGeneratorError("");
    try {
      if (generatorOutput === "video") {
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const context = canvas.getContext("2d")!,
          photoSource = generatorPhotoSources[generatorScene],
          photo = photoSource ? await loadGeneratorPhoto(photoSource) : null,
          stream = canvas.captureStream(30),
          mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
              ? "video/webm;codecs=vp8"
              : "video/webm",
          recorder = new MediaRecorder(stream, { mimeType }),
          chunks: BlobPart[] = [];
        recorder.ondataavailable = (event) =>
          event.data.size && chunks.push(event.data);
        const finished = new Promise<Blob>(
          (resolve) =>
            (recorder.onstop = () =>
              resolve(new Blob(chunks, { type: mimeType }))),
        );
        recorder.start();
        const started = performance.now();
        await new Promise<void>((resolve) => {
          const draw = (now: number) => {
            const progress = (now - started) / (generatorDuration * 1000),
              gradient = context.createLinearGradient(0, 0, 1280, 720);
            if (photo) {
              context.save();
              const zoom = 1.02 + Math.sin(progress * Math.PI) * 0.035;
              context.translate(640, 360);
              context.scale(zoom, zoom);
              context.translate(-640, -360);
              drawCover(context, photo, 1280, 720);
              context.restore();
              context.fillStyle = dark
                ? "#07141b66"
                : light
                  ? "#fff2d52b"
                  : "#0b263038";
              context.fillRect(0, 0, 1280, 720);
            } else {
              gradient.addColorStop(
                0,
                `hsl(${(hue + progress * 18) % 360} 58% ${dark ? 14 : 34}%)`,
              );
              gradient.addColorStop(
                1,
                `hsl(${(hue2 + progress * 24) % 360} 70% ${dark ? 25 : 55}%)`,
              );
              context.fillStyle = gradient;
              context.fillRect(0, 0, 1280, 720);
              for (let index = 0; index < 7; index++) {
                context.beginPath();
                context.fillStyle = `hsla(${(hue + index * 42) % 360} 75% 65% / .16)`;
                context.arc(
                  180 + index * 190 + Math.sin(progress * 6.28 + index) * 55,
                  220 + Math.cos(progress * 6.28 + index) * 90,
                  120 + index * 12,
                  0,
                  Math.PI * 2,
                );
                context.fill();
              }
            }
            if (progress < 1) requestAnimationFrame(draw);
            else resolve();
          };
          requestAnimationFrame(draw);
        });
        recorder.stop();
        const blob = await finished,
          url = URL.createObjectURL(blob),
          asset: CloudMediaAsset = {
            id,
            name: `KI-Video · ${generatorPrompt.slice(0, 38)}`,
            path: "lokal-generiert",
            kind: "video",
            size: blob.size,
            checksum: id,
            downloadUrl: url,
            updatedAt: new Date().toISOString(),
            tags: [
              "KI-generiert",
              `${generatorDuration} Sekunden`,
              "Videohintergrund",
              generatorScenes.find(
                (entry) => entry[0] === generatorScene,
              )?.[1] ?? generatorScene,
            ],
            extension: "WEBM",
            visibility: "private",
          };
        setItems((current) => [asset, ...current]);
        setSelected(asset);
      } else {
        let url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          extension = "SVG",
          size = new Blob([svg]).size;
        const photoSource = generatorPhotoSources[generatorScene];
        if (photoSource) {
          const photo = await loadGeneratorPhoto(photoSource),
            canvas = document.createElement("canvas");
          canvas.width = 1920;
          canvas.height = 1080;
          const context = canvas.getContext("2d")!;
          drawCover(context, photo, 1920, 1080);
          context.fillStyle = dark
            ? "#07141b70"
            : light
              ? "#fff2d52b"
              : "#0b26302b";
          context.fillRect(0, 0, 1920, 1080);
          url = canvas.toDataURL("image/jpeg", 0.92);
          extension = "JPEG";
          size = Math.round(url.length * 0.75);
        }
        const asset: CloudMediaAsset = {
          id,
          name: `KI-Motiv · ${generatorPrompt.slice(0, 42)}`,
          path: "lokal-generiert",
          kind: "image",
          size,
          checksum: id,
          downloadUrl: url,
          updatedAt: new Date().toISOString(),
          tags: [
            "KI-generiert",
            generatorScenes.find((entry) => entry[0] === generatorScene)?.[1] ??
              generatorScene,
            generatorStyles.find((entry) => entry[0] === generatorStyle)?.[1] ??
              generatorStyle,
          ],
          extension,
          visibility: "private",
        };
        setItems((current) => [asset, ...current]);
        setSelected(asset);
      }
      setTab("cloud");
      setQuery("");
      setLibraryFilter("all");
      setGeneratorOpen(false);
    } catch (error) {
      setGeneratorError(
        `Das ${generatorOutput === "video" ? "Video" : "Motiv"} konnte nicht erstellt werden. Bitte versuche es erneut. (${error instanceof Error ? error.message : String(error)})`,
      );
    } finally {
      setGenerating(false);
    }
  }
  async function toggleFavorite(item: CloudMediaAsset) {
    const favorite = !item.favorite;
    setBusy(item.id);
    try {
      if (tab === "unsplash") await api?.setRemoteFavorite?.(item, favorite);
      else await api?.update?.(item.id, { favorite });
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, favorite } : entry,
        ),
      );
      setSelected((current) =>
        current?.id === item.id ? { ...current, favorite } : current,
      );
    } catch {
      alert(
        "Der Favorit konnte nicht gespeichert werden. Bitte versuche es erneut.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <main
      className={`cloud-media-browser ${isAudio ? "audio-browser" : ""} ${generatorOpen ? "generator-active" : ""}`}
      style={{ "--media-card-size": `${gridSize}px` } as any}
    >
      <header className="media-window-header">
        <div>
          <h1>{isAudio ? "Audiobrowser" : "Medienbibliothek"}</h1>
          <p>
            {isAudio
              ? "Musik aus dem Team-Cloudspeicher auswählen und als Playlist hinzufügen."
              : "Medien zentral suchen, verwalten und für Präsentationen verwenden."}
          </p>
        </div>
        <div
          className={`media-cloud-status ${cloudStatus?.online ? "online" : "offline"}`}
          title={cloudStatus?.message ?? "Cloudstatus wird geprüft"}
        >
          <Icon name={cloudStatus?.online ? "cloud_done" : "cloud_off"} />
        </div>
      </header>
      {!isAudio && (
        <nav className="media-tabs">
          <button
            className={!generatorOpen && tab === "cloud" ? "active" : ""}
            onClick={() => switchTab("cloud")}
          >
            CLOUD-MEDIEN
          </button>
          <button
            className={!generatorOpen && tab === "community" ? "active" : ""}
            onClick={() => switchTab("community")}
          >
            COMMUNITY
          </button>
          <button
            className={!generatorOpen && tab === "unsplash" ? "active" : ""}
            onClick={() => switchTab("unsplash")}
          >
            <span className="unsplash-mini-mark" aria-hidden="true">
              <i />
              <i />
            </span>{" "}
            UNSPLASH
          </button>
          {prefs.aiEnabled && (
            <button
              className={generatorOpen ? "active" : ""}
              onClick={() => setGeneratorOpen(true)}
            >
              <Icon name="auto_awesome" /> KI-MOTIVE
            </button>
          )}
        </nav>
      )}
      <div className="media-commandbar">
        <label className="media-search">
          <Icon name="search" />
          <input
            ref={searchRef}
            placeholder={
              tab === "unsplash"
                ? "Unsplash durchsuchen"
                : isAudio
                  ? "Audio durchsuchen"
                  : "Medien durchsuchen"
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && tab === "unsplash")
                void searchUnsplash();
            }}
          />
        </label>
        {tab === "unsplash" && (
          <button onClick={() => void searchUnsplash(query, 1, false)}>
            <Icon name="search" /> SUCHEN
          </button>
        )}
        {!isAudio && (
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">Alle Medien</option>
            <option value="image">Bilder</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="pdf">PDF</option>
          </select>
        )}
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Neueste zuerst</option>
          <option value="name">Name</option>
          <option value="size">Dateigröße</option>
        </select>
        <button className="primary" onClick={() => void beginUpload()}>
          <Icon name="cloud_upload" />{" "}
          {isAudio ? "AUDIO HOCHLADEN" : "MEDIEN HOCHLADEN"}
        </button>
      </div>
      <div className="media-viewbar">
        <span>
          <b>{totalMatches}</b> {totalMatches === 1 ? "Medium" : "Medien"}{" "}
          gefunden
        </span>
        <label title="Größe der Medienkacheln">
          <Icon name="photo_size_select_small" />
          <input
            type="range"
            min="140"
            max="280"
            step="20"
            value={gridSize}
            onChange={(event) => {
              const value = Number(event.target.value);
              setGridSize(value);
              localStorage.setItem(
                "gottesdienstregie.media-grid-size",
                String(value),
              );
            }}
          />
          <Icon name="photo_size_select_large" />
        </label>
        {selected && (
          <>
            <button
              onClick={() => void toggleFavorite(selected)}
              disabled={busy === selected.id}
            >
              <Icon name={selected.favorite ? "star" : "star_outline"} />{" "}
              {selected.favorite ? "FAVORIT ENTFERNEN" : "ALS FAVORIT"}
            </button>
            {tab !== "unsplash" && (
              <button
                className="danger"
                onClick={() => setDeleteTarget(selected)}
                disabled={busy === selected.id}
              >
                <Icon name="delete" /> MEDIUM LÖSCHEN
              </button>
            )}
          </>
        )}
      </div>
      <div className="media-browser-body">
        <aside className="media-navigation">
          <b>BIBLIOTHEK</b>
          <button
            className={libraryFilter === "all" ? "active" : ""}
            onClick={() => {
              setLibraryFilter("all");
              setVisibleCount(30);
            }}
          >
            <Icon name={isAudio ? "library_music" : "perm_media"} />{" "}
            {isAudio ? "Alle Audiodateien" : "Alle Medien"}
          </button>
          <button
            className={libraryFilter === "recent" ? "active" : ""}
            onClick={() => {
              setLibraryFilter("recent");
              setVisibleCount(30);
            }}
          >
            <Icon name="schedule" /> Zuletzt verwendet
          </button>
          <button
            className={libraryFilter === "favorites" ? "active" : ""}
            onClick={() => {
              setLibraryFilter("favorites");
              setVisibleCount(30);
            }}
          >
            <Icon name="star" /> Favoriten
          </button>
          {isAudio && (
            <>
              <b>PLAYLIST</b>
              <p>{audioSelection.length} Titel ausgewählt</p>
            </>
          )}
        </aside>
        <section className="media-content">
          {tab === "unsplash" && !loading && (
            <div className="unsplash-category-brand">
              <span className="unsplash-mini-mark" aria-hidden="true">
                <i />
                <i />
              </span>
              <b>Unsplash</b>
              <small>Kostenlose Fotos durchsuchen</small>
            </div>
          )}
          {loading ? (
            <div className="media-state">
              <span className="media-loading" />
              <h2>Medien werden geladen …</h2>
            </div>
          ) : offline ? (
            <div className="media-state">
              <Icon name="cloud_off" />
              <h2>
                {tab === "unsplash"
                  ? "Unsplash nicht erreichbar"
                  : "Cloud nicht erreichbar"}
              </h2>
              <button
                onClick={() =>
                  tab === "unsplash" ? void searchUnsplash() : void refresh()
                }
              >
                ERNEUT VERSUCHEN
              </button>
            </div>
          ) : shown.length ? (
            <>
              {isAudio ? (
                <div className="audio-media-list">
                  {shown.map((item) => {
                    const checked = audioSelection.some(
                      (entry) => entry.id === item.id,
                    );
                    return (
                      <button
                        key={item.id}
                        className={`${selected?.id === item.id ? "selected" : ""} ${checked ? "checked" : ""}`}
                        onClick={() => choose(item)}
                      >
                        <Icon
                          name={
                            checked ? "check_box" : "check_box_outline_blank"
                          }
                        />
                        <Icon name="audio_file" />
                        <span>
                          <b>{item.name}</b>
                          <small>
                            {item.tags?.join(" · ") || "Team-Audio"}
                          </small>
                        </span>
                        <small>
                          {(
                            item.extension ||
                            item.path.split(".").at(-1) ||
                            "Audio"
                          ).toUpperCase()}
                        </small>
                        <small>{bytes(item.size)}</small>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="cloud-media-grid">
                  {shown.map((item) => (
                    <button
                      key={item.id}
                      className={selected?.id === item.id ? "selected" : ""}
                      onClick={() => choose(item)}
                      onDoubleClick={() =>
                        context === "select" &&
                        void mediaWindow?.select(item, purpose)
                      }
                    >
                      {item.kind === "image" ? (
                        <img loading="lazy" src={item.downloadUrl} alt="" />
                      ) : (
                        <span className="media-kind">
                          <Icon
                            name={
                              item.kind === "video"
                                ? "movie"
                                : item.kind === "audio"
                                  ? "audio_file"
                                  : "picture_as_pdf"
                            }
                          />
                        </span>
                      )}
                      <strong>{item.name}</strong>
                      <small>
                        {typeName(item.kind)} · {bytes(item.size)}
                      </small>
                    </button>
                  ))}
                </div>
              )}
              <div className="media-load-controls">
                {totalMatches > visibleCount && (
                  <button
                    disabled={unsplashLoadingMore}
                    onClick={() => setVisibleCount((value) => value + 30)}
                  >
                    {unsplashLoadingMore ? "WIRD GELADEN …" : "MEHR LADEN"}
                  </button>
                )}
                {visibleCount > 30 && (
                  <button onClick={() => setVisibleCount(30)}>
                    WENIGER ANZEIGEN
                  </button>
                )}
              </div>
            </>
          ) : items.length > 0 ||
            query ||
            kind !== "all" ||
            libraryFilter !== "all" ? (
            <div className="media-state">
              <Icon name="filter_alt_off" />
              <h2>Keine passenden Medien gefunden</h2>
              <p>Bitte ändere den Suchbegriff oder setze die Filter zurück.</p>
              <button onClick={resetFilters}>FILTER ZURÜCKSETZEN</button>
            </div>
          ) : (
            <div className="media-state">
              <Icon name={tab === "community" ? "groups" : "cloud_upload"} />
              <h2>
                {tab === "community"
                  ? "Noch keine Community-Medien"
                  : isAudio
                    ? "Noch keine Audiodateien"
                    : "Noch keine Medien"}
              </h2>
              <p>
                {tab === "community"
                  ? "Freigegebene Medien werden hier getrennt von Unsplash und der Team-Cloud angezeigt."
                  : "Lade bitte Dateien hoch. Erst nach erfolgreichem Cloud-Upload können sie verwendet werden."}
              </p>
              {tab === "cloud" && (
                <button className="primary" onClick={() => void beginUpload()}>
                  HOCHLADEN
                </button>
              )}
            </div>
          )}
        </section>
        <aside className="media-details">
          {selected ? (
            <>
              <div className="detail-preview">
                {selected.kind === "image" ? (
                  <img src={selected.downloadUrl} alt="" />
                ) : selected.kind === "video" ? (
                  <video
                    controls
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    src={selected.downloadUrl}
                  />
                ) : selected.kind === "audio" ? (
                  <>
                    <Icon name="graphic_eq" />
                    <audio
                      controls
                      preload="metadata"
                      src={selected.downloadUrl}
                    />
                  </>
                ) : (
                  <Icon name="picture_as_pdf" />
                )}
              </div>
              <h2>{selected.name}</h2>
              <dl>
                <dt>Typ</dt>
                <dd>{typeName(selected.kind)}</dd>
                <dt>Dateigröße</dt>
                <dd>{bytes(selected.size)}</dd>
                <dt>Format</dt>
                <dd>
                  {selected.extension ||
                    selected.path.split(".").at(-1)?.toUpperCase()}
                </dd>
                <dt>Quelle</dt>
                <dd>{tab === "unsplash" ? "Unsplash" : "Team-Cloud"}</dd>
              </dl>
              <div className="detail-actions">
                <button
                  disabled={busy === selected.id}
                  className={selected.favorite ? "favorite active" : "favorite"}
                  onClick={() => void toggleFavorite(selected)}
                >
                  <Icon name={selected.favorite ? "star" : "star_outline"} />
                  {selected.favorite ? "FAVORIT ENTFERNEN" : "ALS FAVORIT"}
                </button>
                {context === "select" && !isAudio && (
                  <button className="primary" onClick={useSelected}>
                    VERWENDEN
                  </button>
                )}
                {tab !== "unsplash" && (
                  <button
                    className="danger"
                    disabled={busy === selected.id}
                    onClick={() => void remove()}
                  >
                    <Icon name="delete" /> LÖSCHEN
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <Icon name="info" />
              <span>Wähle bitte ein Medium aus.</span>
            </div>
          )}
        </aside>
      </div>
      {isAudio && context === "select" && (
        <footer className="audio-selection-tray">
          <div>
            <b>{audioSelection.length} Titel ausgewählt</b>
            <span>Reihenfolge durch Ziehen ändern</span>
          </div>
          <div className="audio-selection-chips">
            {audioSelection.map((item, index) => (
              <span
                key={item.id}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", String(index))
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) =>
                  reorder(
                    Number(event.dataTransfer.getData("text/plain")),
                    index,
                  )
                }
              >
                <Icon name="drag_indicator" />
                {item.name}
                <button
                  onClick={() =>
                    setAudioSelection((list) =>
                      list.filter((entry) => entry.id !== item.id),
                    )
                  }
                >
                  <Icon name="close" />
                </button>
              </span>
            ))}
          </div>
          <button onClick={() => setAudioSelection([])}>LEEREN</button>
          <button onClick={() => void mediaWindow?.close()}>ABBRECHEN</button>
          <button
            className="primary"
            disabled={!audioSelection.length || !targetId}
            onClick={useSelected}
          >
            HINZUFÜGEN
          </button>
        </footer>
      )}
      {staged.length > 0 && (
        <div className="media-upload-backdrop">
          <section className="media-upload-dialog">
            <header>
              <div>
                <h2>{isAudio ? "AUDIO HOCHLADEN" : "MEDIEN HOCHLADEN"}</h2>
                <p>
                  Nach erfolgreichem Upload steht die Datei im
                  Team-Cloudspeicher bereit.
                </p>
              </div>
              <button onClick={() => setStaged([])}>
                <Icon name="close" />
              </button>
            </header>
            <div className="upload-preview">
              <Icon name={isAudio ? "audio_file" : "cloud_upload"} />
              <span>{staged.map((item) => item.fileName).join(", ")}</span>
            </div>
            <label>
              Name
              <input
                value={uploadName}
                onChange={(event) => setUploadName(event.target.value)}
              />
            </label>
            <label>
              Interpret / Schlagwörter
              <input
                placeholder="z. B. Instrumental, Worship"
                value={uploadTags}
                onChange={(event) => setUploadTags(event.target.value)}
              />
            </label>
            <footer>
              <button onClick={() => setStaged([])}>ABBRECHEN</button>
              <button
                className="primary"
                disabled={busy === "upload"}
                onClick={() => void upload()}
              >
                {busy === "upload" ? "WIRD HOCHGELADEN …" : "JETZT HOCHLADEN"}
              </button>
            </footer>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div
          className="media-upload-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setDeleteTarget(null)
          }
        >
          <section
            className="media-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="media-delete-title"
          >
            <Icon name="delete_forever" />
            <h2 id="media-delete-title">MEDIUM LÖSCHEN?</h2>
            <p>
              <b>{deleteTarget.name}</b> wird dauerhaft aus der
              Team-Medienbibliothek entfernt. Cloud-Dateien, die noch in einer
              Präsentation verwendet werden, bleiben geschützt.
            </p>
            <footer>
              <button onClick={() => setDeleteTarget(null)}>ABBRECHEN</button>
              <button
                className="danger"
                disabled={busy === deleteTarget.id}
                onClick={() => void remove()}
              >
                {busy === deleteTarget.id
                  ? "WIRD GELÖSCHT …"
                  : "DAUERHAFT LÖSCHEN"}
              </button>
            </footer>
          </section>
        </div>
      )}
      {generatorOpen && (
        <section className="media-generator-workspace" aria-label="KI-Motive">
          <header>
            <div>
              <Icon name="auto_awesome" />
              <span>
                <h2>KI-MOTIVE</h2>
                <small>Bild oder Videohintergrund gestalten</small>
              </span>
            </div>
          </header>
          <div className="generator-output-tabs">
            <button
              className={generatorOutput === "image" ? "active" : ""}
              onClick={() => setGeneratorOutput("image")}
            >
              <Icon name="image" /> BILD
            </button>
            <button
              className={generatorOutput === "video" ? "active" : ""}
              onClick={() => setGeneratorOutput("video")}
            >
              <Icon name="movie" /> VIDEOHINTERGRUND
            </button>
          </div>
          <label>
            Motivbeschreibung
            <textarea
              rows={8}
              maxLength={1600}
              value={generatorPrompt}
              onChange={(event) => setGeneratorPrompt(event.target.value)}
              placeholder="Beschreibe bitte Landschaft oder Stadt, Tageszeit, Licht, Kameraperspektive, freie Textflächen, Farben und Atmosphäre möglichst genau."
            />
          </label>
          <div className="generator-prompt-actions">
            <small>{generatorPrompt.length} / 1600 Zeichen</small>
            <button
              onClick={() =>
                setGeneratorPrompt(
                  generatorIdeas[
                    Math.floor(Math.random() * generatorIdeas.length)
                  ],
                )
              }
            >
              <Icon name="casino" /> ANDERE BESCHREIBUNG
            </button>
          </div>
          <div className="generator-select-grid">
            <label>
              Szenenkategorie
              <select
                value={generatorScene}
                onChange={(event) => setGeneratorScene(event.target.value)}
              >
                {generatorScenes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gestaltungsstil
              <select
                value={generatorStyle}
                onChange={(event) => setGeneratorStyle(event.target.value)}
              >
                {generatorStyles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {generatorOutput === "video" && (
              <label className="generator-duration">
                Videolänge: <b>{generatorDuration} Sekunden</b>
                <input
                  type="range"
                  min="30"
                  max="60"
                  step="5"
                  value={generatorDuration}
                  onChange={(event) =>
                    setGeneratorDuration(Number(event.target.value))
                  }
                />
                <span>30 s</span>
                <span>60 s</span>
              </label>
            )}
          </div>
          <footer>
            {generatorError && (
              <p className="generator-error" role="alert">
                <Icon name="error" /> {generatorError}
              </p>
            )}
            <button
              className="primary"
              disabled={!generatorPrompt.trim() || generating}
              onClick={() => void generateLocal()}
            >
              {generating
                ? `WIRD ERSTELLT · ${generatorDuration} S …`
                : generatorOutput === "video"
                  ? "VIDEO ERSTELLEN"
                  : "MOTIV ERSTELLEN"}
            </button>
          </footer>
        </section>
      )}
    </main>
  );
}
