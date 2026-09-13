// screenmeldung.js – FINAL (Fixpack++++++)
// Stand: 2026-02-26
// Wichtige Fixes:
// - Saalscreen-Startzeit: wenn saalscreenUseShowFrom=true UND showFrom gesetzt ist,
//   dann zählt showFrom als Start, auch wenn showFrom < giltAb.
// - Ende bleibt giltBis, außer „Bis auf Weiteres“.
// - Robust: falls Start > Ende, wird die Meldung NICHT gezeigt.
// - Updates werden nur beim Wechsel angewandt.
// - Zeit-Recheck setzt nur dirty.
// - Scroll: Titel scrollt nur bei echtem Overflow + >= TITLE_SCROLL_MIN_LINES.
// - Sonst wird der Titelbereich erweitert.
// - Keine „Titel == Beschreibung -> löschen“-Logik.
// - QR: Fallback + Empty-State QR zur Übersicht.
// - Firebase: neues Projekt philippusgemeindebie.

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ---------- Konfiguration ----------
  const qrBaseUrl = "https://pgbielefeld.neocities.org/meldungen";
  const infoUrl   = "https://pgbielefeld.neocities.org/meldungen.html";

  const MIN_SCREEN_MS = 12_000;
  const MAX_SCREEN_MS = 180_000;
  const CHAR_MS       = 80;
  const EXTRA_MS      = 4_000;

  const EMPTY_TITLE = "Aktuell liegen keine Meldungen vor";
  const EMPTY_TEXT =
    `Aktuell liegen keine Meldungen vor.<br><br><br>` +
    `Mehr Infos findest du auf unserer Website:<br><strong>${infoUrl}</strong><br>` +
    `Oder scanne den QR-Code unten rechts, um die Übersicht zu öffnen.<br>` +
    `Dort findest du auch ältere Hinweise und weitere aktuelle Informationen.`;

  const TIME_RECHECK_MS = 30_000;

  // ---------- Scroll-System ----------
  const TITLE_MAX_FRACTION = 0.28;
  const TITLE_SCROLL_FALLBACK = true;
  const TITLE_SCROLL_MIN_LINES = 5;
  const TITLE_EXPAND_MAX_FRACTION = 0.70;
  const TITLE_EXPAND_PADDING_PX = 24;

  const SCROLL_SPEED_PX_PER_SEC = 40;
  const SCROLL_START_PAUSE_MS   = 2200;
  const SCROLL_END_PAUSE_MS     = 2200;
  const SCROLL_RETURN_PAUSE_MS  = 1800;
  const SCROLL_PINGPONG         = true;

  const APPLY_UPDATES_ONLY_ON_SWITCH = true;

  // Seite alle 20 Minuten neu laden, nur wenn sichtbar.
  setInterval(() => {
    if (!document.hidden) location.reload();
  }, 20 * 60 * 1000);

  // ---------- DOM ----------
  const container = document.getElementById("meldung-container");
  const topbar    = document.getElementById("topbar");
  const main      = document.getElementById("main");

  if (!container || !main) return;

  container.style.position = "relative";

  // ---------- Styles ----------
  (() => {
    const style = document.createElement("style");
    style.textContent = `
      .pgb-scrollbox{
        scrollbar-width:none;
        -ms-overflow-style:none;
      }

      .pgb-scrollbox::-webkit-scrollbar{
        display:none;
      }

      .pgb-scrollbox{
        overflow:auto;
      }

      .meldung__titlewrap{
        overflow:hidden;
      }
    `;
    document.head.appendChild(style);
  })();

  // ---------- State ----------
  let list = [];
  let index = 0;
  let playTimer = null;

  const byId = new Map();
  let dirty = false;

  let scrollStops = [];
  let scrollDonePromises = [];

  const stopAllScrolls = () => {
    scrollStops.forEach((fn) => {
      try { fn(); } catch {}
    });

    scrollStops = [];
    scrollDonePromises = [];

    document.body.classList.remove("pgb-scrolling");
  };

  const setScrollingActive = () => {};

  const clearPlayTimer = () => {
    if (playTimer) clearTimeout(playTimer);
    playTimer = null;
  };

  // ---------- Utils ----------
  const hasFlag = (v) => {
    if (v === true) return true;
    if (typeof v === "number") return v > 0;

    if (typeof v === "string") {
      const s = v.trim().toLowerCase();

      return (
        s === "1" ||
        s === "x" ||
        s === "true" ||
        s === "ja" ||
        s === "yes" ||
        s === "on"
      );
    }

    return false;
  };

  const toDate = (v) => {
    if (!v) return null;

    const raw = String(v).trim();
    if (!raw) return null;

    const d = new Date(raw);

    return isNaN(+d) ? null : d;
  };

  const now = () => new Date();

  const isPublic = (m) => {
    const s = String(m?.status || "").trim().toLowerCase();

    return (
      s === "öffentlich" ||
      s === "oeffentlich" ||
      s === "public"
    );
  };

  const isTrashed = (m) => {
    if (!m) return false;

    if (
      hasFlag(m.trash) ||
      hasFlag(m.isTrashed) ||
      hasFlag(m.papierkorb) ||
      hasFlag(m.Papierkorb) ||
      hasFlag(m.deleted) ||
      hasFlag(m.geloescht) ||
      hasFlag(m["gelöscht"])
    ) {
      return true;
    }

    const status = String(m.status || m.state || m.zustand || "")
      .trim()
      .toLowerCase();

    return (
      status === "trash" ||
      status === "papierkorb" ||
      status === "deleted" ||
      status === "gelöscht" ||
      status === "geloescht"
    );
  };

  const getEndForScreen = (m) => {
    const bisRaw = String(m?.giltBis || "").trim();

    if (!bisRaw) return null;
    if (bisRaw.toLowerCase() === "bis auf weiteres") return null;

    return toDate(bisRaw);
  };

  const getStartForScreen = (m) => {
    const use = hasFlag(m?.saalscreenUseShowFrom);
    const sf = toDate(m?.showFrom);

    if (use && sf) return sf;

    return toDate(m?.giltAb);
  };

  const eligible = (m, t = now()) => {
    if (!m) return false;
    if (isTrashed(m)) return false;
    if (!isPublic(m)) return false;
    if (!hasFlag(m.messageScreen)) return false;

    const start = getStartForScreen(m);
    const end = getEndForScreen(m);

    if (start && end && start > end) return false;

    if (start && t < start) return false;
    if (end && t > end) return false;

    return true;
  };

  const plainText = (htmlOrText) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = String(htmlOrText || "");

    return (tmp.textContent || tmp.innerText || "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const plainLen = (htmlOrText) => plainText(htmlOrText).length;

  const calcDuration = (tit, body) => {
    const len = plainLen(tit) + plainLen(body);
    const ms = len * CHAR_MS + EXTRA_MS;

    return Math.min(Math.max(ms, MIN_SCREEN_MS), MAX_SCREEN_MS);
  };

  const isOverflowing = (el) => {
    return !!el && el.scrollHeight > el.clientHeight + 2;
  };

  const countLines = (el) => {
    if (!el) return 0;

    const cs = getComputedStyle(el);

    let lh = parseFloat(cs.lineHeight);

    if (!Number.isFinite(lh)) {
      const fs = parseFloat(cs.fontSize) || 16;
      lh = fs * 1.2;
    }

    const h = el.scrollHeight || el.clientHeight || 0;

    return lh > 0 ? Math.round(h / lh) : 0;
  };

  // ---------- Auto-Scroller ----------
  const startAutoScroll = (el, opts = {}) => {
    if (!el) return null;

    const speedPxPerSec = opts.speedPxPerSec ?? SCROLL_SPEED_PX_PER_SEC;
    const startPauseMs  = opts.startPauseMs  ?? SCROLL_START_PAUSE_MS;
    const endPauseMs    = opts.endPauseMs    ?? SCROLL_END_PAUSE_MS;
    const returnPauseMs = opts.returnPauseMs ?? SCROLL_RETURN_PAUSE_MS;
    const pingpong      = opts.pingpong      ?? SCROLL_PINGPONG;

    let stopped = false;
    let rafId = 0;
    let phase = "startPause";
    let dir = 1;
    let lastTs = 0;
    let phaseUntil = 0;

    let resolveDone;

    const donePromise = new Promise((res) => {
      resolveDone = res;
    });

    const maxScroll = () => Math.max(0, el.scrollHeight - el.clientHeight);

    const setPhase = (p, nowTs) => {
      phase = p;
      lastTs = nowTs || 0;

      if (p === "startPause")  phaseUntil = performance.now() + startPauseMs;
      if (p === "endPause")    phaseUntil = performance.now() + endPauseMs;
      if (p === "returnPause") phaseUntil = performance.now() + returnPauseMs;
    };

    const step = (ts) => {
      if (stopped) return;

      const max = maxScroll();

      if (max <= 1) {
        try { resolveDone(); } catch {}
        return;
      }

      if (!lastTs) lastTs = ts;

      const dt = Math.min(64, ts - lastTs);
      lastTs = ts;

      if (
        phase === "startPause" ||
        phase === "endPause" ||
        phase === "returnPause"
      ) {
        if (performance.now() >= phaseUntil) {
          if (phase === "startPause") {
            dir = 1;
            setPhase("down", ts);
          } else if (phase === "endPause") {
            if (pingpong) {
              dir = -1;
              setPhase("up", ts);
            } else {
              el.scrollTop = 0;
              setPhase("startPause", ts);
            }
          } else if (phase === "returnPause") {
            try { resolveDone(); } catch {}
            setPhase("startPause", ts);
          }
        }

        rafId = requestAnimationFrame(step);
        return;
      }

      const pxPerMs = speedPxPerSec / 1000;
      const delta = dir * pxPerMs * dt;
      const next = el.scrollTop + delta;

      if (dir === 1 && next >= max) {
        el.scrollTop = max;
        setPhase("endPause", ts);
        rafId = requestAnimationFrame(step);
        return;
      }

      if (dir === -1 && next <= 0) {
        el.scrollTop = 0;
        setPhase("returnPause", ts);
        rafId = requestAnimationFrame(step);
        return;
      }

      el.scrollTop = next;
      rafId = requestAnimationFrame(step);
    };

    setPhase("startPause");
    rafId = requestAnimationFrame(step);

    const stop = () => {
      stopped = true;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    return {
      stop,
      donePromise
    };
  };

  // ---------- QR ----------
  const buildQrImg = (url) => {
    const img = document.createElement("img");

    img.className = "qr-code";
    img.alt = "QR-Code";
    img.width = 140;
    img.height = 140;
    img.decoding = "async";
    img.loading = "lazy";

    const primary =
      `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`;

    const fallback =
      `https://chart.googleapis.com/chart?chs=140x140&cht=qr&chl=${encodeURIComponent(url)}`;

    img.onerror = () => {
      img.src = fallback;
    };

    img.src = primary;

    return img;
  };

  const renderQRForMessage = (m) => {
    if (!hasFlag(m?.qrCode)) return null;

    const id = m?._id || m?.id;
    if (!id) return null;

    const url = `${qrBaseUrl.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;

    return buildQrImg(url);
  };

  const renderInfoQR = () => {
    const url = String(infoUrl || "").trim();

    if (!url) return null;

    return buildQrImg(url);
  };

  // ---------- Anzeige ----------
  const leaveBlack = () => {
    document.body.classList.remove("schwarz");

    if (topbar) topbar.style.display = "";
    if (main) main.style.display = "";
  };

  const layoutTitleWrap = (titleWrap) => {
    const mainH = main.clientHeight || (window.innerHeight - 100);
    const baseMax = Math.max(160, Math.floor(mainH * TITLE_MAX_FRACTION));

    titleWrap.style.maxHeight = `${baseMax}px`;
  };

  const fitTitleIfNeeded = (titleWrap) => {
    const h2 = titleWrap?.querySelector(".meldung__titel");
    const titleLines = countLines(h2);

    const mainH = main.clientHeight || (window.innerHeight - 100);
    const baseMax = Math.max(160, Math.floor(mainH * TITLE_MAX_FRACTION));
    const capExpand = Math.floor(mainH * TITLE_EXPAND_MAX_FRACTION);

    const need =
      (h2?.scrollHeight || titleWrap.scrollHeight || baseMax) +
      TITLE_EXPAND_PADDING_PX;

    if (titleLines > 0 && titleLines < TITLE_SCROLL_MIN_LINES) {
      const newMax = Math.min(capExpand, Math.max(baseMax, need));

      titleWrap.style.maxHeight = `${newMax}px`;
      titleWrap.style.overflow = "hidden";

      if (TITLE_SCROLL_FALLBACK && isOverflowing(titleWrap)) {
        titleWrap.style.overflow = "auto";
      }

      return;
    }

    titleWrap.style.maxHeight = `${baseMax}px`;
    titleWrap.style.overflow = "hidden";

    if (
      TITLE_SCROLL_FALLBACK &&
      titleLines >= TITLE_SCROLL_MIN_LINES &&
      isOverflowing(titleWrap)
    ) {
      titleWrap.style.overflow = "auto";
    }
  };

  const maybeStartScrolling = (titleWrap, descEl, hasBody) => {
    const scrollers = [];

    fitTitleIfNeeded(titleWrap);

    if (hasBody) {
      descEl.style.overflow = "auto";
    } else {
      descEl.style.overflow = "hidden";
    }

    if (
      titleWrap &&
      titleWrap.style.overflow === "auto" &&
      isOverflowing(titleWrap)
    ) {
      const ctrl = startAutoScroll(titleWrap);
      if (ctrl) scrollers.push(ctrl);
    }

    if (hasBody && isOverflowing(descEl)) {
      const ctrl = startAutoScroll(descEl);
      if (ctrl) scrollers.push(ctrl);
    }

    setScrollingActive(scrollers.length > 0);

    scrollers.forEach((c) => {
      scrollStops.push(c.stop);
      scrollDonePromises.push(c.donePromise);
    });
  };

  const scheduleNext = async (baseDur) => {
    clearPlayTimer();

    const dur = Math.min(Math.max(baseDur, MIN_SCREEN_MS), MAX_SCREEN_MS);

    if (!scrollDonePromises.length) {
      playTimer = setTimeout(next, dur);
      return;
    }

    const waitMs = (ms) => new Promise((res) => setTimeout(res, ms));

    const waitDur = waitMs(dur);
    const waitScroll = Promise.allSettled(scrollDonePromises);
    const hardCap = waitMs(MAX_SCREEN_MS);

    await Promise.race([
      (async () => {
        await waitDur;
        await waitScroll;
      })(),
      hardCap
    ]);

    await waitMs(1200);
    next();
  };

  const renderFrame = (titleText, bodyHtml, qrImgOrNull) => {
    container.innerHTML = `
      <div class="meldung">
        <div class="pgb-scrollbox meldung__titlewrap">
          <h2 class="meldung__titel"></h2>
        </div>

        <div class="trennlinie" aria-hidden="true"></div>

        <div class="pgb-scrollbox beschreibung"></div>
      </div>
    `;

    const titleWrap = container.querySelector(".meldung__titlewrap");
    const h2 = container.querySelector(".meldung__titel");
    const line = container.querySelector(".trennlinie");
    const desc = container.querySelector(".beschreibung");

    h2.textContent = String(titleText || "").trim();

    try {
      desc.innerHTML = String(bodyHtml || "");
    } catch {
      desc.textContent = String(bodyHtml || "");
    }

    const hasBody = plainText(bodyHtml).length > 0;

    if (line) line.style.display = "";

    if (!hasBody) {
      desc.style.display = "none";
      desc.textContent = "";
    } else {
      desc.style.display = "";
    }

    layoutTitleWrap(titleWrap);

    if (qrImgOrNull) container.appendChild(qrImgOrNull);

    container.classList.remove("flash");
    void container.offsetWidth;
    container.classList.add("flash");

    requestAnimationFrame(() => {
      stopAllScrolls();
      maybeStartScrolling(titleWrap, desc, hasBody);
    });
  };

  const showEmptyInfo = () => {
    stopAllScrolls();
    leaveBlack();
    renderFrame(EMPTY_TITLE, EMPTY_TEXT, renderInfoQR());
  };

  const showCurrent = () => {
    stopAllScrolls();

    if (!list.length) {
      showEmptyInfo();
      return;
    }

    leaveBlack();

    if (index >= list.length) index = 0;

    let m = list[index];

    if (!m) {
      index = 0;
      m = list[index];

      if (!m) {
        showEmptyInfo();
        return;
      }
    }

    const titel = String(m?.titel || "").trim();

    const bodyRaw =
      (m?.textMeldung && String(m.textMeldung).trim())
        ? m.textMeldung
        : (m?.beschreibung || "");

    renderFrame(titel, String(bodyRaw || ""), renderQRForMessage(m));
    scheduleNext(calcDuration(titel, bodyRaw));
  };

  // ---------- Daten / Sortierung ----------
  const rebuildList = ({ preserveCurrent = true } = {}) => {
    const tNow = now();
    const all = [...byId.values()];

    const filtered = all.filter((m) => eligible(m, tNow));

    filtered.sort((a, b) => {
      const aS = getStartForScreen(a)?.getTime() ?? 0;
      const bS = getStartForScreen(b)?.getTime() ?? 0;

      if (aS !== bS) return aS - bS;

      const aE = getEndForScreen(a)?.getTime() ?? 0;
      const bE = getEndForScreen(b)?.getTime() ?? 0;

      if (aE !== bE) return aE - bE;

      return String(a.titel || "").localeCompare(
        String(b.titel || ""),
        "de",
        { sensitivity: "base" }
      );
    });

    const currentId =
      preserveCurrent && list.length && index < list.length
        ? list[index]?._id
        : null;

    list = filtered;

    if (!list.length) {
      index = 0;
      return;
    }

    if (currentId) {
      const keep = list.findIndex((x) => x._id === currentId);
      index = keep >= 0 ? keep : 0;
    } else {
      index = Math.floor(Math.random() * list.length);
    }
  };

  const applyIfDirtyNow = () => {
    if (!dirty) return false;

    dirty = false;
    rebuildList({ preserveCurrent: true });

    return true;
  };

  const next = () => {
    stopAllScrolls();
    clearPlayTimer();

    if (APPLY_UPDATES_ONLY_ON_SWITCH && dirty) {
      applyIfDirtyNow();
    }

    if (!list.length) {
      showEmptyInfo();
      return;
    }

    index = (index + 1) % list.length;
    showCurrent();
  };

  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyB0fmfjqC8aPyOEZxLjk1TfQal_s5xZFAM",
    authDomain: "philippusgemeindebie.firebaseapp.com",
    databaseURL: "https://philippusgemeindebie-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "philippusgemeindebie",
    storageBucket: "philippusgemeindebie.firebasestorage.app",
    messagingSenderId: "429968461937",
    appId: "1:429968461937:web:3c0f654404ec5d0e24cbd0",
    measurementId: "G-0Y54ZJ9WJK"
  };

  try {
    if (!firebase.apps?.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.warn("Firebase init failed", e);
  }

  try {
    firebase.database.INTERNAL.forceLongPolling();
  } catch {}

  const db = firebase.database();
  const ref = db.ref("meldungen");

  const markDirty = () => {
    dirty = true;

    if (!list.length) {
      applyIfDirtyNow();
      showCurrent();
    }
  };

  // Initial laden
  ref.once("value").then((snap) => {
    const data = snap.val() || {};

    byId.clear();

    Object.entries(data).forEach(([id, m]) => {
      byId.set(id, {
        ...(m || {}),
        _id: id
      });
    });

    rebuildList({ preserveCurrent: false });
    showCurrent();

    // Realtime: neue Meldung
    ref.on("child_added", (snap2) => {
      const id = snap2.key;
      const m = snap2.val() || {};

      byId.set(id, {
        ...m,
        _id: id
      });

      if (APPLY_UPDATES_ONLY_ON_SWITCH) {
        markDirty();
      } else {
        rebuildList({ preserveCurrent: true });
        showCurrent();
      }
    });

    // Realtime: geänderte Meldung
    ref.on("child_changed", (snap2) => {
      const id = snap2.key;
      const m = snap2.val() || {};

      byId.set(id, {
        ...m,
        _id: id
      });

      if (APPLY_UPDATES_ONLY_ON_SWITCH) {
        markDirty();
      } else {
        rebuildList({ preserveCurrent: true });
        showCurrent();
      }
    });

    // Realtime: entfernte Meldung
    ref.on("child_removed", (snap2) => {
      const id = snap2.key;

      byId.delete(id);

      if (APPLY_UPDATES_ONLY_ON_SWITCH) {
        markDirty();
      } else {
        rebuildList({ preserveCurrent: true });
        showCurrent();
      }
    });
  }).catch((err) => {
    console.warn("Meldungen konnten nicht geladen werden:", err);
    list = [];
    showEmptyInfo();
  });

  // Zeitbasierte Eligibility neu prüfen
  setInterval(() => {
    if (APPLY_UPDATES_ONLY_ON_SWITCH) {
      dirty = true;

      if (!list.length) {
        applyIfDirtyNow();
        showCurrent();
      }
    } else {
      rebuildList({ preserveCurrent: true });
      showCurrent();
    }
  }, TIME_RECHECK_MS);

  // Cleanup
  window.addEventListener("beforeunload", () => {
    try { ref.off(); } catch {}
    stopAllScrolls();
    clearPlayTimer();
  });
});