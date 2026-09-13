# Spezielle Loop-Elemente und Screenmeldung-Integration – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-/Post-Loop-Elemente mit zentralem Placement-Schutz, automatischer Rotation, sicherer Screenmeldung-Firebase-Integration, festem 20-Sekunden-Wetterscreen und den übrigen dynamischen Loop-Typen in GottesdienstRegie integrieren.

**Architecture:** Die bestehende Store-/Render-Architektur bleibt die einzige Präsentations- und Live-Engine. Eine reine Domain-Schicht (`loopDomain`) entscheidet über Sections, Placement, Dauer und Rotation; `loopData` normalisiert und validiert öffentliche dynamische Daten. Die vorhandene Screenmeldung bleibt als internes Renderer-Modul erhalten und wird für Editor-Preview/Preflight über eine kontrollierte Adapter-Schnittstelle eingebunden.

**Tech Stack:** React 19, TypeScript 5.9, Zustand, Firebase Realtime Database, Electron/Vite, bestehende `SlideRenderer`-/`LiveEngine`-Pfade.

**Spec:** `C:\Users\Mörchen\.codex\attachments\43ca33c9-97e4-4311-9b39-9cae0259da2e\pasted-text.txt` sowie `C:\Users\Mörchen\Downloads\screenmeldung-komplett.zip`.

## Global Constraints

- Loop-Only-Elemente dürfen ausschließlich in PRE-LOOP, POST-LOOP oder ausdrücklich automatischem VORPROGRAMM liegen.
- Normale Gottesdienstabschnitte dürfen niemals Loop-Only-Elemente aufnehmen.
- Wetter verwendet ausschließlich `https://weather.crbnm06.workers.dev`; 20 Sekunden sind die voreingestellte Empfehlung, die Dauer bleibt pro Element änderbar.
- Fehlende dynamische Daten überspringen das Element; es gibt keinen technischen Fehlerzustand auf MAIN.
- Sichtbare Live-Inhalte bleiben bis zur sicheren Wechselgrenze stabil.
- MAIN/STAGE/Audio/Recording haben Vorrang; Loop- und Datenaktualisierungen dürfen den Livebetrieb nicht blockieren.
- Keine zweite Live-, Transition- oder Firebase-Datenbanklogik erzeugen.

---

### Task 1: Loop-Domain und Placement-Schutz

**Files:**
- Create: `src/loopDomain.ts`
- Modify: `src/store.ts`
- Create: `scripts/loop-domain-test.ts`
- Create: `scripts/check-loop-domain.cjs`

**Interfaces:**
- `LoopSectionType`, `LoopItemType`, `LoopSectionCapabilities`
- `isLoopSection(section)` und `canPlaceItem(item, targetSection)`
- `loopDurationMs(item)` mit festem Wetterwert
- `LoopController` mit `start`, `stop`, `current`, `advance`, `snapshot`

- [ ] **Step 1: Write failing tests** für Section-Placement, Wetterdauer, leere Items und sichere Rotation in `scripts/loop-domain-test.ts`.
- [ ] **Step 2: Run `node --experimental-strip-types scripts/loop-domain-test.ts`** und bestätigen, dass die fehlenden Exporte/Regeln fehlschlagen.
- [ ] **Step 3: Implement `src/loopDomain.ts`** und erweitere `ServiceSection`/`ServiceItem` um `type`, `autoLoop`, `supportsLoopItems`, `itemCategory`, `placementPolicy`.
- [ ] **Step 4: Integriere `canPlaceItem` in `addItem`, `moveItemToSection`, Duplicate/Insert und Import-Normalisierung; blockierte Aktionen geben unverändert sicheren Store zurück.
- [ ] **Step 5: Run Domain-Tests und Typecheck; danach `scripts/check-loop-domain.cjs` als CI-freundlichen Runner ergänzen.**
- [ ] **Step 6: Commit `feat: add loop domain placement protection`.**

### Task 2: Screenmeldung-Adapter und Announcement-Service

**Files:**
- Create: `src/loopData.ts`
- Create: `src/screenmeldungAdapter.ts`
- Add: `public/screenmeldung/screenmeldung.html`, `public/screenmeldung/screenmeldung.css`, `public/screenmeldung/screenmeldung.js`
- Create: `scripts/loop-data-test.ts`
- Create: `scripts/check-loop-data.cjs`

**Interfaces:**
- `Announcement`, `PublicAnnouncement`, `normalizeAnnouncement`, `validateAnnouncement`
- `filterAnnouncements(records, now, placement)` mit Public-/Zeit-/Placement-Schutz
- `ScreenmeldungSnapshot` und `createScreenmeldungPreview(snapshot)`

- [ ] **Step 1: Write failing tests** für bestehende Feldnamen, stabile Firebase-ID, Zeitfenster, Public-Filter, Placement und Skip bei leerem Datensatz.
- [ ] **Step 2: Run tests and observe RED.**
- [ ] **Step 3: Implement normalization/validation without changing Firebase data.**
- [ ] **Step 4: Copy the supplied Screenmeldung files into `public/screenmeldung` and wrap them through the adapter; preserve IDs/classes, existing scrolling and QR placement.**
- [ ] **Step 5: Ensure empty announcements produce `EMPTY` for the loop, while the standalone screen keeps its existing empty presentation.**
- [ ] **Step 6: Run tests and commit `feat: integrate screenmeldung announcement service`.**

### Task 3: Zustand, Add-Item-UI, Preview und LoopController-Anbindung

**Files:**
- Modify: `src/store.ts`
- Modify: `src/App.tsx`
- Modify: `src/SlideRenderer.tsx`
- Modify: `src/shared-device.css`
- Create: `src/LoopElementEditor.tsx`
- Create: `src/LoopPreview.tsx`

- [ ] **Step 1: Add failing UI/domain assertions** for Loop-Elemente visibility only in allowed Sections and read-only weather duration/source.
- [ ] **Step 2: Run checks and confirm RED.**
- [ ] **Step 3: Add Loop-Elemente group to AddPopover for announcement, birthday, event, weather, quiz, countdown, clock, bibleVerse, qr, infoCard, today, nextEvents.**
- [ ] **Step 4: Add editor settings with duration presets for normal items and an editable weather duration with a 20-second recommendation; use local QR generation through existing `qrcode` dependency.**
- [ ] **Step 5: Add internal preview/diagnosis without mutating MAIN or live state.**
- [ ] **Step 6: Wire LoopController to existing auto-advance path with cancellation on OFF AIR/service start; preserve background audio independence.**
- [ ] **Step 7: Run UI checks, typecheck and commit `feat: expose loop elements in editor and live flow`.**

### Task 4: Weather Controller, Providers, Preflight and Abnahmetests

**Files:**
- Modify: `src/loopData.ts`
- Modify: `src/LiveEngine.ts`
- Modify: `src/App.tsx`
- Create: `src/weatherController.ts`
- Create: `scripts/loop-acceptance-test.cjs`
- Modify: `RELEASE_NOTES.md`, `CHANGELOG.md`

- [ ] **Step 1: Write failing acceptance checks** for fixed URL/duration, preload-before-visible timer, READY-only display, cancellation and offline skip.
- [ ] **Step 2: Run acceptance checks and confirm RED.**
- [ ] **Step 3: Implement `WeatherScreenController` with monotonic deadline, cancellation token and no configurable presentation value.**
- [ ] **Step 4: Add BirthdayProvider, EventProvider using existing `events.ts`, QuizLoop data, Clock/Bible/QR/Info adapters; all return public DTOs only.**
- [ ] **Step 5: Extend LiveEngine preflight with loop diagnostics as warnings, never blocking optional loop elements.**
- [ ] **Step 6: Run all checks, typecheck and production build.**
- [ ] **Step 7: Commit `feat: complete dynamic loop elements and weather preflight`.**

## Verification

- `node --experimental-strip-types scripts/loop-domain-test.ts`
- `node --experimental-strip-types scripts/loop-data-test.ts`
- `node scripts/check-loop-domain.cjs`
- `node scripts/check-loop-data.cjs`
- `node scripts/loop-acceptance-test.cjs`
- `npm run typecheck`
- `npm run build`
