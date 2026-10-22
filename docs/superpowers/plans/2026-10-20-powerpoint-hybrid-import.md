# PowerPoint Hybrid Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PowerPoint-Präsentationen bevorzugt originalgetreu mit Animationen und Zeiten wiedergeben und daneben eine klar getrennte, bearbeitbare Kopie anbieten.

**Architecture:** Ein zentraler Windows-Adapter steuert ausschließlich eine verwaltete PowerPoint-Show. Ein einzelner Capture-Produzent verteilt deren Bild per lokalem WebRTC an die bestehenden Output-Kompositionen. Ein separater, begrenzter PPTX-Parser erstellt die native Kopie; Dokumentrevisionen und Live-Sitzungen bleiben getrennt.

**Tech Stack:** Bestehendes Electron37, React19, TypeScript, Zustand, JSZip3.10.1, Vitest und Playwright; Windows PowerShell im STA-Modus als eigener COM-Helper. Vorgesehene direkte zusätzliche Laufzeitabhängigkeit: `saxes: 6.0.0` (ISC, bereits transitiv vorhanden), ausschließlich für namespacebewusstes XML-Parsing. Diese Abhängigkeit wird mit der Planprüfung ausdrücklich zur Zustimmung gestellt, noch nicht installiert.

**Spec:** [Freigegebener Entwurf](../specs/2026-10-20-powerpoint-hybrid-import-design.md)

**22.10.2026 Prüfstatus:** Die separat freigegebene native Aufnahme-/Transportprobe
verfehlt bereits mit eigener Win32-Quelle die unveränderte Bildratenabnahme.
Keine Original-Player-Fähigkeit freigegeben; keine Produktintegration oder
Veröffentlichung. [Messwerte und offene Grenzen](../evidence/2026-10-22-powerpoint-native-frame-probe.md).

## Global Constraints

- Originaltreue vor Bearbeitbarkeit; keine vollständige PowerPoint-Kompatibilität behaupten.
- Originaldatei unverändert, native Kopie separat; SELECTED verändert niemals LIVE.
- Windows-exklusiver Original-Adapter; macOS/Linux/Web erhalten keine ungetestete Verfügbarkeitszusage.
- Ein maßgeblicher Original-Player, kein konkurrierender Folientimer.
- Testbetrieb und ON AIR unabhängig; Wasserzeichen, Banner und Schnellanzeigen bleiben über dem Inhalt.
- Lokaler1080p/30fps-Test über60Sekunden: p95 MAIN/Live-Vorschau-Versatz höchstens150ms; p95 Befehl bis sichtbarer Animationsbeginn höchstens250ms.
- Ton erst nach nachgewiesener Isolation/Routing/Synchronität freigeben; kein System-Loopback, keine globale Office-/Radio-Stummschaltung.
- Makros deaktivieren, schreibgeschützt öffnen, Trust Center/Protected View nicht umgehen. Keine beliebigen Befehle oder Pfade aus Renderern ausführen.
- Kein fremdes PowerPoint-Dokument schließen, kein PowerPoint-Prozess pauschal beenden, kein fremdes Fenster/Desktop erfassen.
- Die Umsetzung erfolgt gemäß vorhandener Nutzerpräferenz nativ durch den Hauptagenten. Keine Programmierungs- oder Review-Delegation; Eigenreview ist entsprechend als schwächer zu dokumentieren.
- Vor der Planfreigabe keine Produktänderungen, Office-Starts, Abhängigkeitsinstallation oder Veröffentlichung. Ein Probe-Fehlschlag erzwingt eine Rückmeldung statt einer heimlich vereinfachten Ersatzarchitektur.
- Bestehende Sprache-/Release-Prüfungen nicht abschalten. Keine Versionsanhebung, Lockerung des v84-Teilfreigabeumfangs oder Veröffentlichung in diesen Aufgaben.

## Review Focus

1. Eine Neuimport-/Take-Antwort trifft nach einem anderen Take ein: sie darf den neuen LIVE-Stand nicht überschreiben (Aufgaben3/6/8).
2. Zwei ZIP-Einträge normalisieren zum selben Pfad oder benutzen andere Namespace-Präfixe: keine Asset-Verwechslung und identische fachliche Interpretation (Aufgabe2).
3. PowerPoint läuft schon mit einem fremden Dokument: nur die eigene Präsentation steuern/schließen und keine fremde Audiowiedergabe verändern (Aufgaben1/5/10).
4. Ein Output wird während einer Animation neu geöffnet: aktueller Sessionstand statt Neustart der Show; fremde Capture-Anforderungen ablehnen (Aufgabe7).
5. Ein Backup wird auf einem anderen PC geöffnet: Original/Assets müssen vorhanden sein, Office-Fähigkeit neu geprüft werden, Runtime-IDs dürfen nicht wiederverwendet werden (Aufgaben3/10).

## Dateien und Zuständigkeiten

- `shared/powerpoint/types.ts`: ausschließlich gemeinsame Dokument-, Diagnose- und Laufzeitverträge.
- `electron/powerpoint/`: begrenzter ZIP/XML-Import, Original-/Asset-Repository, Helper-Transport, Sitzungssteuerung und autorisierte Capture-Zuordnung.
- `src/powerpoint/`: native Kopien, unabhängige Import-UI, Capture-Host, lokal begrenzter Stream-Transport, Output-Fläche und Preflight.
- Bestehende `PresentationRepository`, `store`, `LiveEngine`, `OutputWindowManager`, `OutputComposition`, `MainLivePreview` weiterverwenden; keine zweite allgemeine Live-Engine.
- Änderungen in großen `App.tsx`/`ProductionWorkspace.tsx` auf Einhängepunkte begrenzen; keine allgemeine Umstrukturierung.
- `tests/smoke/startup-diagnostic.cjs` ist fremd/untracked und bleibt unberührt.

## Schnittstellen, die zwischen den Aufgaben gelten

Die folgenden Typen werden in Aufgabe2 in `shared/powerpoint/types.ts` definiert, nicht mehrfach kopiert:

```ts
type PowerPointMode = 'original' | 'editable';
type PowerPointTimingMode = 'source' | 'manual' | 'custom';
type PowerPointDiagnostic = {code:string;severity:'warning'|'error';sourceSlideId?:string};
type OfficeTiming = {advanceOnClick:boolean;advanceAfterMs:number|null;transitionMs:number;transitionType:string};
type OfficeObject =
 | {kind:'text';id:string;x:number;y:number;width:number;height:number;rotation:number;text:string;
    style:{fontFamily:string;fontSize:number;color:string;fontWeight:number;fontStyle:string;align:string}}
 | {kind:'image';id:string;x:number;y:number;width:number;height:number;rotation:number;assetId:string}
 | {kind:'unsupported';id:string;reason:string};
type OfficeSlide = {sourceSlideId:string;title:string;hidden:boolean;notes:string;timing:OfficeTiming;objects:OfficeObject[]};
type OfficeImport = {sourceHash:string;size:{width:number;height:number};slides:OfficeSlide[];
 assets:Array<{id:string;mime:string;bytes:Uint8Array}>;hasAudio:boolean;diagnostics:PowerPointDiagnostic[]};
type PowerPointDocument = {schemaVersion:1;bundleId:string;sourceHash:string;mode:PowerPointMode;
 timingMode:PowerPointTimingMode;silentOriginalConfirmed:boolean;copyRevision:number;
 sourceSlideIds:string[];hasAudio:boolean;diagnostics:PowerPointDiagnostic[]};
type PowerPointCapability = {visual:boolean;audio:'unsupported'|'routed';reason?:string};
type PowerPointPhase = 'preparing'|'ready'|'live'|'paused'|'ended'|'error';
type PowerPointPublicState = {sessionId:string;generation:number;revision:number;sourceHash:string;
 phase:PowerPointPhase;sourceSlideId:string;clickIndex:number;clickCount:number;hasFrame:boolean;errorCode?:string};
type PowerPointCommand = {sessionId:string;generation:number;requestId:string} &
 ({type:'play'|'pause'|'resume'|'next'|'previous'|'stop'}|{type:'goto';sourceSlideId:string});
type PowerPointBridge = {capability():Promise<PowerPointCapability>;
 prepare(input:{bundleId:string;sourceHash:string;silentOriginalConfirmed:boolean}):Promise<PowerPointPublicState>;
 command(input:PowerPointCommand):Promise<PowerPointPublicState>;
 subscribe(listener:(state:PowerPointPublicState)=>void):()=>void};
```

`OfficeImport` bleibt im Import-/Main-Prozess. `bytes`, lokale Pfade und native Fensterkennungen kommen niemals in öffentliche Output-Zustände. Geometrie ist auf1920×1080 normiert, bei anderem Seitenverhältnis mit proportionaler Letterbox-Transformation statt Verzerrung. `advanceAfterMs:null` bedeutet fehlende Originalzeit, nicht sieben Sekunden.

### Aufgabe1: Reproduzierbarer technischer Freigabe-Probe

**Files:** Create `scripts/probe-powerpoint.cjs`, `scripts/powerpoint-probe.ps1`, `tests/fixtures/powerpoint/createFixture.cjs`, `tests/smoke/powerpoint-probe.cjs`; evidence `docs/superpowers/evidence/2026-10-20-powerpoint-hybrid-import.md`.

**Interfaces:** `runProbe({root:string}):Promise<{visual:boolean;audio:'unsupported'|'routed';results:Record<string,unknown>}>`; Fixture-Modul exportiert `createFixture(scenario:string):Promise<Uint8Array>` mit benannten Szenarien `clicks-and-auto`, `with-audio`, `reordered-timed` und `hidden-format`. CLI legt ausschließlich unter `work/powerpoint-probe/` neue Testartefakte ab. Keine Produktionsfreigabe durch bloße Registry-Erkennung.

- [ ] Testfixture mit drei Folien, unterschiedlich langer Klickfolge, automatischem Wechsel, bewegtem Frame-Marker und einer eingebetteten Tonprobe erstellen. In einem getrennten Test einen ebenfalls vom Test erzeugten fremden Office-Dokumentstand offen halten.
- [ ] Probe zunächst gegen den Ist-Zustand ausführen: `node tests/smoke/powerpoint-probe.cjs`; erwartetes RED ist fehlende geprüfte Show-/Capture-Unterstützung, nicht eine absichtlich beschädigte Fixture.

  Test `original_show_reaches_two_captured_outputs`: `assert.equal(result.visual,true)`; unabhängige Frame-Auswertung muss `assert.ok(metrics.mirrorSkewP95Ms<=150)` und `assert.ok(metrics.commandToFrameP95Ms<=250)` erfüllen. `metrics` stammt aus gemessenen, aufgezeichneten Markern, nicht aus Capability-Flags.
- [ ] Probe implementieren: eigener Helper ohne Shell-Stringverkettung; lokale COM-Show starten, reguläre Klicks/Zeiten prüfen, ausschließlich ihr Fenster erfassen, Rahmen/Schwarzframes sowie Pause/Resume prüfen. Keine Benutzerdatei öffnen und keine bestehende Präsentation schließen.
- [ ] Eine einzige Capture-Quelle an zwei Test-Outputs übertragen. Frame-Marker und Befehlszeiten für60Sekunden messen; rohe Messwerte und p95 speichern. Audio-Isolation/Routing gesondert prüfen. Nur bei nachgewiesenem Capture des eigenen Fensters und eingehaltenen150/250ms-Grenzen `visual:true`; Audio bleibt sonst `unsupported`.
- [ ] Resultat dokumentieren und selbst prüfen. Bei fehlender Aktivierung, Protected View, nicht sicher zuordenbarem Fenster oder verfehlter visueller Grenze STOP: konkrete Befunde melden, keine Aufgaben5–9 als funktionierend vortäuschen. Erfolgreiche Video-Probe erlaubt keinen ungeprüften Ton.
- [ ] Ausschließlich Probe, Fixture und Evidenz committen: `test: characterize isolated PowerPoint playback and capture`.

### Aufgabe2: Sicherer, strukturierter PPTX-Import

**Files:** Create `shared/powerpoint/types.ts`, `electron/powerpoint/readPptx.ts`, `electron/powerpoint/boundedArchive.ts`, `electron/powerpoint/readPptx.test.ts`; modify `package.json`, `package-lock.json` ausschließlich für den direkten Parser.

**Interfaces:** `readPptx(source:Uint8Array):Promise<OfficeImport>`; `readBoundedArchive(source:Uint8Array):Promise<Map<string,Uint8Array>>`. Fachliche Fehler haben stabile Codes, keine Benutzereingabe im MAIN-Text.

- [ ] Failing Tests mit echten JSZip-Fixtures schreiben: abweichende Dateinamen-/Beziehungsreihenfolge, umbenannte XML-Präfixe, versteckte Folie, Notizen,13:9-Format, Timing `advanceOnClick:false/advanceAfterMs:12500`, fehlende Zeit `null`, ungültige Beziehung und unbekannter Übergang als Diagnose.
- [ ] Sicherheitstests: Original-/normalisierter Pfad mit `..`, absolute Namen, doppelte normalisierte Namen, DTD/Entitäten, externe Relationships ohne Netzaufruf, Datei größer200MiB, mehr20000Einträge, XML größer8MiB, insgesamt entpackt größer512MiB. Grenzwerte inkl. exakt erlaubter Grenze prüfen.
- [ ] `node node_modules/vitest/vitest.mjs run electron/powerpoint/readPptx.test.ts --maxWorkers=2` ausführen und fachliches RED bestätigen.

  Test `uses_relationship_order_and_preserves_source_timing`:
  ```ts
  const parsed=await readPptx(await createFixture('reordered-timed'));
  expect(parsed.slides.map(slide=>slide.sourceSlideId)).toEqual(['256','258','257']);
  expect(parsed.slides[0].timing).toMatchObject({advanceOnClick:false,advanceAfterMs:12500});
  expect(parsed.slides[1].timing.advanceAfterMs).toBeNull();
  ```
- [ ] `saxes:6.0.0` direkt hinzufügen. ZIP nur mit begrenzt gestreamtem Entpacken lesen; Grenzen auch tatsächlich zählen, nicht nur ZIP-Header vertrauen. DTD ablehnen. Presentation-/Slide-/Master-/Theme-Beziehungen anhand Namespaces auflösen, unbekannte Inhalte diagnostizieren. Keine Regex als XML-Baum-Parser.
- [ ] Geometrie, Basistextstile und interne PNG/JPEG-Bilder erfassen; Diagramme/SmartArt/Trigger als nicht native editierbar markieren. Alle Tests GREEN; Commit `feat: parse bounded PowerPoint slide structure and timings`.

### Aufgabe3: Unverändertes Original und portable Assets speichern

**Files:** Create `electron/powerpoint/PowerPointAssetRepository.ts`, `electron/powerpoint/presentationBundle.ts` und jeweilige `.test.ts`; modify `electron/PresentationRepository.ts`, dessen `.test.ts`, `electron/main.ts`, `src/store.ts`, `src/presentationRecovery.ts`.

**Interfaces:** `new PowerPointAssetRepository(root:string)`; `import(sourcePath:string,parsed:OfficeImport):Promise<{bundleId:string;sourceHash:string}>`; `resolveOriginal(bundleId:string,sourceHash:string):Promise<string>` nur Main-intern; `readPublicAsset(bundleId:string,assetId:string):Promise<{mime:string;bytes:Uint8Array}|null>`. `writePresentationBundle(document:PresentationDocument):Promise<Uint8Array>` / `readPresentationBundle(bytes:Uint8Array):Promise<PresentationDocument>` inklusive Originals/Assets. `PresentationRepository.reimportPowerPoint(presentationId:string,itemId:string,sourcePath:string):Promise<PresentationDocument>` liefert eine neue Dokumentrevision, keine Session-Änderung.

- [ ] RED: Quelldatei nach Import verschieben, Original weiter auflösbar; native Bearbeitung ändert Original-Hash nicht; Save/Load/Duplicate/Recovery erhalten `ServiceItem.powerPoint?:PowerPointDocument` und `Slide.powerPoint?:{sourceSlideId:string}`. Keine Session-/HWND-/Stream-Daten persistieren.
- [ ] RED: Export/Backup in frischem Repository öffnen, Bytes und Hash gleich; alte JSON-`.grpresentation`/`.grbackup` weiter lesbar. Manipulierte Assetnamen/Hashes und Pfadtraversierung ablehnen. Ein fehlgeschlagener neuer Import zerstört keinen zuvor gültigen Stand.
- [ ] `node node_modules/vitest/vitest.mjs run electron/powerpoint/PowerPointAssetRepository.test.ts electron/powerpoint/presentationBundle.test.ts electron/PresentationRepository.test.ts src/presentationRecovery.test.ts --maxWorkers=2` ausführen.
- [ ] Contentadressierte, atomar geschriebene Assets unter Repository-eigenem `powerpoint-assets/<sha256>/` speichern. Portables ZIP-Bundle enthält `manifest.json`, Dokument und relative Assets; bisheriges JSON durch Magic-/Schema-Erkennung weiter unterstützen. Bundle-Limits aus Aufgabe2 übernehmen. Neue Felder in Normalisierung, Clone und Recovery ausdrücklich erhalten.
  Vor Commit des Imports Original-Bytes erneut hashen und mit `parsed.sourceHash` vergleichen; bei inzwischen veränderter Quelldatei Import abbrechen und keinen gemischten Original-/Kopienstand speichern.

  Test `restores_original_bytes_without_runtime_state`: `expect(restoredOriginalBytes).toEqual(sourceBytes)` und `expect(restoredItem.powerPoint).toEqual(savedItem.powerPoint)` nach Backup-Import in ein frisches Root. `expect(serializedDocument).not.toContain('sessionId')`; fremde Originalpfade/HWNDs ebenso ausschließen.
- [ ] Öffentliches Asset-Protokoll `gottesdienst-powerpoint://assets/<bundleId>/<assetId>` vor App-Start registrieren. Handler liest nur manifestierte PNG/JPEG-Vorschau-/Bildassets über `readPublicAsset`, niemals Original-PPTX, Verzeichnisse oder beliebige Pfade; unzulässige IDs geben404. Native Bild-Elemente referenzieren dieses Protokoll, keine absoluten Dateien.
- [ ] GREEN und Commit `feat: preserve original PowerPoint assets across document roundtrips`.

### Aufgabe4: Bearbeitbare native Kopie mit nachvollziehbaren Grenzen

**Files:** Create `src/powerpoint/editableCopy.ts`, `.test.ts`, `src/powerpoint/timing.ts`, `.test.ts`; modify `electron/PresentationRepository.ts`, `src/store.ts`.

**Interfaces:** `createEditableCopy(parsed:OfficeImport,document:PowerPointDocument):ServiceItem`; `getPowerPointTiming(item:ServiceItem,slide:Slide):{owner:'native'|'powerpoint';advanceAfterMs:number|null;advanceOnClick:boolean}`. Erweiterung `SlideTiming` um `sourceAdvanceOnClick?:boolean`, `sourceAdvanceAfterMs?:number|null`; `durationSeconds` bleibt benutzerdefinierte Zeit.

- [ ] RED: Text/Bild-Geometrie im Seitenformat proportional, Titel/Notizen/unsichtbare Folien korrekt, Unsupported-Diagnose erhalten; fehlende Originalzeit produziert keinen7-Sekunden-Autowechsel.
- [ ] RED: Modi `source/manual/custom` mit `12500/null/0` und Klickfreigabe prüfen; Originalmodus liefert `owner:'powerpoint'`, keine native Deadline. Eigene Zeit verändert gespeicherte Originalzeit nicht.
- [ ] Fokus-Suite der beiden neuen Testdateien ausführen; danach minimale Konvertierung zu vorhandenen `SlideElement`s und unterstützten `SlideTransition`s implementieren. Keine zweite native Animation-Engine hinzufügen.

  Test `does_not_invent_seven_second_source_timing`: `expect(getPowerPointTiming(sourceItem,untimedSlide)).toEqual({owner:'native',advanceAfterMs:null,advanceOnClick:true})`; im Originalmodus `expect(getPowerPointTiming(originalItem,untimedSlide).owner).toBe('powerpoint')`. Fixtures benutzen denselben gespeicherten Source-Stand, unterschiedliche explizite Modi.
- [ ] GREEN und Commit `feat: create editable PowerPoint copies with explicit timing ownership`.

### Aufgabe5: Abgesicherter Office-Helper und Capability-Erkennung

**Files:** Create `electron/powerpoint/PowerPointHelperTransport.ts`, `.test.ts`, `electron/powerpoint/powerpoint-helper.ps1`, `scripts/copy-powerpoint-assets.cjs`, `tests/smoke/native-powerpoint-helper.cjs`; modify `package.json` für Kopieren/Bündeln des Helpers nach dem Build.

**Interfaces:** `PowerPointHelperTransport.request(command:unknown,timeoutMs:number):Promise<unknown>` / `close():Promise<void>`; interne Befehle sind feste validierte JSON-Objekte, keine PowerShell-Fragmente. Capability erzeugt `PowerPointCapability` und übernimmt nur belegte Probe-Fähigkeiten.

Interne Helper-Whitelist: `open {originalPath,sourceHash}`, `status`, `run`, `pause`, `resume`, `gotoClick {index}`, `gotoSlide {sourceSlideId}` und `close`. Jede Zeile enthält eine Request-ID; erlaubte Antwort ist `{requestId,status:{sourceSlideId,clickIndex,clickCount,phase,windowHandle,processId}}` oder `{requestId,errorCode}`. Native Kennungen und Pfade bleiben in diesem Main-/Helper-Vertrag. Alle unbekannten Felder, nicht endliche/negative Indizes und nicht verwalteten Pfade werden verworfen.

- [ ] RED: serialisierte Aufrufe, doppelte Request-IDs, verspätete Antwort, Prozessende, ungültige JSON-Zeile, Ausgabeflut über1MiB und Timeout. Bei einem Timeout keine weiteren Office-Kommandos an dieselbe beschädigte Sitzung schicken.
- [ ] Helper über `spawn` mit separaten Argumenten, `windowsHide:true`, STA und restriktivem Protokoll starten. Makros unmittelbar vor Öffnen deaktivieren, schreibgeschützt öffnen, nur verwaltete Bundlepfade akzeptieren. Maximal10Sekunden für Steuerbefehle und30Sekunden fürs Öffnen; währenddessen UI responsiv.
- [ ] Zugeordnete Presentation-/Window-Identität prüfen; beim Schließen ausschließlich eigene Präsentation schließen. Keine `GetActiveObject`-Übernahme fremder Dokumente, keine pauschalen Taskkills, keine Trust-Center-/Execution-Policy-Umgehung. Nur den eigenen Helper-Prozess bei Protokollbruch beenden; eine eventuell nicht aufräumbare Office-Sitzung diagnostizieren.
- [ ] Unit-Tests GREEN. Nach `npm run build` echten Helper-Smoke gegen die eigenen Fixtures aus Aufgabe1 ausführen; fremden Test-Dokumentstand unverändert prüfen. Auf Nicht-Windows: explizit unavailable statt Startversuch.

  Test `times_out_one_owned_helper_without_killing_office`: nach einem tatsächlich hängenden kontrollierten Child `await expect(transport.request({type:'status'},20)).rejects.toMatchObject({code:'POWERPOINT_TIMEOUT'})`; paralleler fremder Test-Child bleibt lebend. Echter Office-Smoke vergleicht den fremden Dokumentstand zusätzlich vor/nach Close.
- [ ] Commit `feat: isolate and validate the native PowerPoint helper`.

### Aufgabe6: Eine revisionierte Player-Sitzung und autorisierte IPC

**Files:** Create `electron/powerpoint/PowerPointSessionService.ts`, `.test.ts`, `electron/powerpoint/ipc.ts`, `.test.ts`; modify `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`, `src/platform/types.ts`, `src/platform/capabilities.ts`, `src/platform/PlatformServices.ts`, `src/platform/electron/createElectronServices.ts`, `src/platform/web/createWebServices.ts`.

**Interfaces:** `PowerPointSessionService` implementiert `PowerPointBridge` unter Verwendung der Aufgaben3/5. Desktop-Bridge heißt `window.desktop.powerPoint`; Plattformservice `powerPoint`; Capability-Key `powerPointOriginal`. Web liefert unavailable und führt keine IPC aus.

- [ ] RED: prepare bleibt pausiert/ohne Publikumswiedergabe; NEXT `clickIndex0→1→2` bleibt auf derselben Folie, erst danach nächste Folie; PREV geht einen Aufbauzustand zurück, bei Index0 zur vorherigen Folie mit letztem regulären Aufbau; GOTO startet gewählte Folie im definierten Zustand vor ihren automatischen Animationen.
- [ ] RED: letzter NEXT emittiert genau einmal `phase:'ended'`, kein Restart; doppelte Stop-/Next-Anfragen sind idempotent pro Request-ID. Eine Antwort von Generation1 darf Generation2 niemals überschreiben. Editor-Auswahl sendet kein Player-Kommando.
- [ ] RED: nur registriertes Operator-Control-WebContents darf prepare/command; Output-/Web-/unbekannte Sender werden abgewiesen. Öffentliche Zustände enthalten weder Pfade noch HWNDs; max64KiB/Message und nur bekannte Befehlsfelder.
- [ ] `node node_modules/vitest/vitest.mjs run electron/powerpoint/PowerPointSessionService.test.ts electron/powerpoint/ipc.test.ts --maxWorkers=2` vor/nach minimaler Implementation ausführen. State revisions zentral im Main vergeben, Fehler nur als Codes publizieren, unsubscribe bei Fensterende.

  Test `next_consumes_clicks_before_advancing_source_slide` erwartet nach drei realen Service-Kommandos die Zustände `[{sourceSlideId:'256',clickIndex:1},{sourceSlideId:'256',clickIndex:2},{sourceSlideId:'258',clickIndex:0}]`; Transport-Double liefert nur deterministische Office-Antworten, Assertions gelten dem echten Session-Service und werden durch den nativen Smoke ergänzt. Test `stale_generation_cannot_replace_live` erwartet nach später Generation1-Antwort weiterhin `generation:2` und deren Source-Hash.
- [ ] Neuimport-IPC nimmt nur Präsentations-/Item-ID entgegen, zeigt die bestehende lokale Dateiauswahl und übergibt den gewählten Pfad intern an das Repository. Keine frei übergebene Dateipfad- oder Shell-Operation aus dem Renderer.
- [ ] Commit `feat: coordinate authorized PowerPoint sessions and animation steps`.

### Aufgabe7: Ein Capture-Produzent, lokale Verteilung, sichere Output-Fläche

**Files:** Create `electron/powerpoint/PowerPointCaptureService.ts`, `.test.ts`, `src/powerpoint/PowerPointCaptureHost.tsx`, `src/powerpoint/streamTransport.ts`, `.test.ts`, `src/powerpoint/PowerPointSurface.tsx`, `.test.tsx`; modify `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`, `src/App.tsx` nur für internen Host-Einstieg, `src/outputState.ts`, `electron/OutputWindowManager.ts`.

**Interfaces:** `PowerPointCaptureService.start(sessionId:string,generation:number):Promise<void>` / `stop():Promise<void>`; `connectPowerPointStream({sessionId,generation,role}):Promise<{stream:MediaStream;close():void}>`; `<PowerPointSurface state={PowerPointPublicState}/>` rendert nur den validierten eigenen Stream bzw. den letzten gültigen Frame.

- [ ] RED: Quellenzuordnung an die vom Helper bestätigte eigene Fensteridentität statt Namenssuche; Vollbildschirm-/fremde Fensteranforderung abweisen. Host und Konsumenten erhalten nur für ihre Rolle kurzlebige, nicht persistierte Signalisierungsberechtigung.
- [ ] RED: genau ein Produzent bei mehreren Output-Fenstern; neues Fenster erhält aktuelle Generation, kein neuer Office-Start. Veraltetes ICE/SDP, fremde Session, mehr64KiB Signalisierung und Wiederholung nach Stop ablehnen.
- [ ] Dediziertes, verborgenes Capture-Host-BrowserWindow mit deaktiviertem Background-Throttling verwenden. WebRTC ausschließlich lokal (`iceServers:[]`), Main relayed nur autorisierte SDP/ICE zwischen Host und registrierten lokalen Konsumenten. Kein HTTP-Server, STUN, TURN oder WAN-Verbindung. Keine global erlaubte Display-Capture-Anfrage.
- [ ] Unterhalb bestehender Komposition rendern, nicht oberhalb oder außerhalb. Bei Capture-Verlust letzten gültigen Frame einfrieren und Fehler melden. Wenn noch kein Frame existiert, sichere leere Content-Fläche mit weiterhin bestehendem Test-Overlay; keine Fehlermeldung auf MAIN.
  `OutputStateSnapshot` und `changedOutputLayers` erhalten dafür ein separat revisioniertes `powerPoint:PowerPointPublicState|null`; nur dieser kleine Zustand geht über Output-State-IPC. Bildframes und `MediaStream` niemals per JSON oder im Dokument speichern.
- [ ] Unit-/Komponenten-Tests GREEN; echten Zwei-Output-Smoke mit den Latenzgrenzen ausführen. Commit `feat: compose isolated PowerPoint capture inside managed outputs`.

  Test `output_reconnect_does_not_restart_original_show`: Test-Output schließen/öffnen, `expect(reconnectedState.sessionId).toBe(initialSessionId)` und `expect(reconnectedState.sourceSlideId).toBe('258')` statt Folie256. Test `rejects_non_owned_window_capture` erwartet `CAPTURE_SOURCE_NOT_OWNED` für ein zusätzliches fremdes Testfenster.

### Aufgabe8: Live-Navigation, Zeiten, Schnellanzeigen und Preflight verbinden

**Files:** Create `src/powerpoint/liveAdapter.ts`, `.test.ts`, `src/powerpoint/preflight.ts`, `.test.ts`; modify `src/LiveEngine.ts`, `src/store.ts`, `src/ProductionWorkspace.tsx`, `src/App.tsx`, `src/live/quickOverlayState.ts` nur bei nötigem Einhängepunkt.

**Interfaces:** `createPowerPointLiveAdapter(bridge:PowerPointBridge):{take(item:ServiceItem,slide:Slide):Promise<void>;next():Promise<void>;previous():Promise<void>;setCovered(value:boolean):Promise<void>;stop():Promise<void>}`; `powerPointPreflight(item:ServiceItem,capability:PowerPointCapability):{errors:string[];warnings:string[]}`.

- [ ] RED: Original-Take nur nach ready plus gültigem ersten Frame committen; während Prepare bleibt bisherige MAIN-Ausgabe stehen. Zweiter Take überholt ersten ohne Zwischen-Commit. Fehlgeschlagener Take wechselt nicht still auf native Kopie.
- [ ] RED: NEXT/PREV über Tastatur, Buttons und bereits vorhandene Remote-Wege benutzen denselben Adapter. Native Dauer-Timer sind für `owner:'powerpoint'` aus, für Kopie weiter aktiv. Automatischer letzter Folienwechsel geht genau einmal in bestehende nächste Item-/Nachprogramm-Navigation.
- [ ] RED: ausgewählte andere Folie/Bearbeiten/Moduswechsel ohne TAKE verändert den Live-Player nicht; Live-Mirror erhält aktuelle Stream-Session, Einzelvorschau nur vorbereiteten Stand. Schnellanzeige pausiert/resumiert genau einmal, verschachtelte Overlays führen nicht zu vorzeitigem Resume.
- [ ] RED: fehlendes Office, fehlendes Asset, defekte Capture-Quelle oder Audio-Fähigkeit sperren Original korrekt; explizit erlaubte, nachweislich isolierte lautlose Wiedergabe nur für die aktuelle Quelldatei. Kein implizites ON-AIR-Aktivieren und kein Verlassen des Testbetriebs.
- [ ] Adapter an vorhandene `LiveEngine`/Store-Navigation anbinden; keine neue allgemeine Live-Steuerung. Fokus-Suite und vorhandene `liveFlowRegression`, `postProgramNavigation`, `LiveTakeMetadata`, `OutputComposition`, `TestModeWatermark` ausführen. Commit `feat: integrate PowerPoint takes with live navigation and quick screens`.

  Test `selection_does_not_mutate_committed_original`: nach `store.select(otherItemId,otherSlideId)` bleibt der über `bridge.subscribe` erfasste Zustand `expect(current.sourceSlideId).toBe('256')`. Test `failed_prepare_keeps_previous_take`: `expect(useLiveOutputPreview.getState().slide?.id).toBe(previousSlideId)` nach fehlgeschlagenem prepare, keine behauptete Original-Fähigkeit. Test `original_step_ack_does_not_start_new_take`: eine Statusbestätigung aus der laufenden Sitzung aktualisiert den Spiegelstand, erzeugt aber keine neue Generation oder Rücksetzung auf Klick0; Store-/Show-Effekte dürfen keine Rückkopplungsschleife bilden.

### Aufgabe9: Import-/Bearbeiten-UI und originale Vorschauen

**Files:** Create `src/powerpoint/PowerPointImportPanel.tsx`, `.test.tsx`, `src/powerpoint/importModel.ts`, `.test.ts`, `tests/smoke/powerpoint-import.spec.ts`; modify `src/FileMenu.tsx`, `src/ProductionWorkspace.tsx`, `src/App.tsx`, `src/i18nBase.ts`.

**Interfaces:** `PowerPointImportPanel(props:{item:ServiceItem;onTake:(mode:PowerPointMode)=>Promise<void>;onReimport:()=>Promise<void>})`; `setPowerPointCopyMode(item:ServiceItem,mode:PowerPointMode):ServiceItem`; `reimportPowerPoint(presentationId:string,itemId:string):Promise<void>` delegiert zur autorisierten Neuimport-IPC aus Aufgabe6, niemals beliebigem Pfadzugriff.

- [ ] RED: sichtbare Modi „Originalwiedergabe“/„Bearbeitbare Kopie“, unverändertes Original nach Textänderung, kopienspezifische Änderungsmarkierung, folienbezogene Unsupported-Hinweise und Zeitwahl `source/manual/custom`. Moduswechsel während LIVE verlangt TAKE, nicht direkte Session-Mutation.
- [ ] RED: Office nicht vorhanden → Original klar gesperrt, Kopie weiterhin nutzbar. Neuimport übernimmt neue Revision erst nach ausdrücklicher Bestätigung; vorheriger LIVE-Stand bleibt bestehen. Kamera-/Audio-/Display-Präferenzen werden nicht verändert.
- [ ] Eigene Vorschau nur aus dem Original-Asset/Export der verwalteten Präsentation erzeugen; keine zweite laufende Show für Auswahl. Fehlende Exportvorschau als solche kenntlich machen, nicht native Kopie als Original tarnen.
- [ ] Neue Operator-Texte über bestehende i18n-Struktur führen, DE/EN vollständig, übrige Sprachen sichtbar mit bestehendem Fallback. Regionalumfang nicht als vollständig behaupten. Inventar mit dessen Generator neu erstellen; einen dadurch ausgelösten v84-Pin-/Freigabekonflikt berichten statt still eine neue Release-Freigabe zu konstruieren.
- [ ] Komponenten-/Modelltests und echten Browser-Smoke auf Desktop-/Tabletbreite ausführen. Beispielansichten visuell prüfen. Commit `feat: expose original and editable PowerPoint import modes`.

  Test `unavailable_original_keeps_editable_copy_usable`: `expect(screen.getByRole('button',{name:'Originalwiedergabe'})).toBeDisabled()` bei `visual:false`, aber `expect(screen.getByRole('button',{name:'Bearbeitbare Kopie'})).toBeEnabled()`. UI bestätigt Modi eindeutig, ohne den Capability-Mock selbst als getesteten Erfolg zu werten.

### Aufgabe10: Native Gesamtprüfung, Fehlertoleranz und dokumentierte Grenzen

**Files:** Create `tests/smoke/native-powerpoint-live.cjs`, `tests/smoke/powerpoint-portability.cjs`; modify Evidenz aus Aufgabe1 und Hilfekatalog-Artikel zum Import in `src/help/base.ts` bzw. vorhandenen zugehörigen Sprachressourcen.

**Interfaces:** Smoke-Bericht unter `work/powerpoint-verification/` enthält Versionen, Capability, Messwerte, Fehlerfälle und Screenshots. Keine Erfolgsmeldung für übersprungene native Tests; jede nicht bestandene Capability bleibt aus.

- [ ] Echte eigene Beispielpräsentation mit verschiedenen Schriftgrößen, Bildern, Klick-/Autoanimation, Wechselzeiten und separat geprüfter Tonprobe importieren. PowerPoint selbst mit MAIN/Live-Mirror vergleichen; nicht nur Textinhalt oder Mock-Aufruf prüfen.

  Test `full_output_keeps_test_marker_over_original_and_black`: tatsächliche Output-Screenshots vor/nach Animationswechsel und Schwarz-Quick-Screen erfassen, Test-Markierung jeweils im finalen Bild nachweisen; im Normalbetrieb `await expect(output.getByTestId('test-mode-watermark')).toHaveCount(0)`. Der Selektor existiert bereits in `TestModeWatermark.tsx`; kein neuer Produktions-Testschalter.
- [ ] Testbetrieb OFF/ON AIR, Schwarz, Logo, OSB, Banner oben/unten, Quick-Screen-Pause und Rückkehr prüfen. Wasserzeichen bleibt im tatsächlichen Ausgabebild und fadet nicht mit.
- [ ] Eigenen Helper beenden, Capture-Fenster verlieren lassen, Quelle verschieben, Output neu öffnen, Präsentation mehrfach starten/stoppen, Backup in frischem Repository öffnen; fremdes Testdokument und seine Audioeinstellungen unverändert.
- [ ] Erneut60Sekunden1080p/30fps messen; p95≤150ms Versatz und≤250ms Befehlslatenz anhand aufgezeichneter Frame-Marker bestätigen. Radio vor/nach Probe unverändert hörbar; Ton nie doppelt oder über einen ungeprüften Standardausgang. Fehlender Audio-Nachweis heißt unsupported, nicht PASS.
- [ ] `node node_modules/vitest/vitest.mjs run --maxWorkers=2`, `npm run build`, `npm run build:web`, `npm run test:web`, neue native Smokes und vorhandene `npm run verify:release` ausführen; alle Ergebnisse einschließlich eines ggf. weiterhin blockierenden Freigabe-/Inventar-Gates dokumentieren. Keine Assertions, Timeouts oder Release-Gates zum Erzwingen von Grün abschwächen.
- [ ] Hilfe um echte aktuelle Screenshots, Original-vs-Kopie, Animationen/Zeiten, Plattformgrenzen und Preflight-Hinweise ergänzen. Keine Vollkompatibilität oder bestandene Audio-Unterstützung suggerieren.
- [ ] Hauptagent prüft gesamten Diff, Asset-Lebenszyklus, IPC/Source-Zuordnung, Runtime-Persistenz, Audio und Regressionen selbst; die nicht unabhängige Review-Qualität nennen. Commit `test: verify hybrid PowerPoint playback and document supported scope`.

## Abschluss und Veröffentlichung

Nach den Aufgaben ist eine getestete Implementierung mit ausgewiesenen Grenzen das Ergebnis, kein automatisches Release. Nutzer erhält bestandene Tests, fehlgeschlagene/gesperrte Fähigkeiten und den offenen Release-Gate-Status. Eine Versionsanhebung, Änderung der v84-Teilfreigabe oder Veröffentlichung benötigt eine neue passende Nutzeranweisung. Worktree und fremdes untracked Diagnose-Skript bleiben erhalten.

## Planprüfung und Ausführung

Der Entwurf wurde vom Nutzer bestätigt. Dieser konkrete Plan einschließlich der direkten `saxes:6.0.0`-Abhängigkeit und der Probe-Grenzen wartet noch auf Nutzerprüfung. Vorhandene Ausführungspräferenz: Hauptagent nativ, keine Programmierungsdelegation. Nach Bestätigung mit `superpowers:executing-plans` beginnen; als Erstes Aufgabe1, nicht bereits voraussetzen, dass die Office-/Capture-Integration funktioniert.
