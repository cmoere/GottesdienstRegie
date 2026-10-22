# Three-Texture PowerPoint GPU Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. User requires native implementation/review by the primary agent; only translation work may be delegated.

**Goal:** Drei begrenzte GPU-Ziele und unabhängige Empfänger als separate technische Probe nachweisen, bevor eine Produktintegration erwogen wird.

**Architecture:** Ein nativer Worker besitzt WGC, D3D und drei versionierte Zieltexturen. Main claimt ausschließlich fertige Slots, verteilt verwaltete Imports unabhängig je Empfänger und gibt native Slots nur nach dem tatsächlichen Ende aller Import-Referenzen frei. Ein separater Observer bewertet komponierte Bilder, nicht Liefer-ACKs.

**Tech Stack:** Vorhandene VS2022-BuildTools/WindowsSDK, C++17/C++/WinRT/D3D11, Node-Testwerkzeuge und die bereits separat geprüfte Electron45.0.0-Laufzeit. Keine Produktabhängigkeit oder Installation; installierte Electron37.10.3 bleibt unverändert.

**Spec:** [Freigegebener GPU-Entwurf](../specs/2026-10-22-powerpoint-gpu-pipeline-design.md), vom Nutzer am22.10.2026 nach schriftlicher Vorlage mit „ja“ bestätigt. Auch diesen Plan hat der Nutzer nach Vorlage mit „ja“ freigegeben; die native Ausführungsmethode bleibt bestehen. [Laufender Prüfbericht](../evidence/2026-10-22-powerpoint-gpu-pipeline.md).

## Global Constraints

- Nur isolierte Probe; keine AppShell-/MAIN-Integration, Versionsanhebung, Installer, Push/Tag oder Veröffentlichung.
- Genau drei1920×1080BGRA8-Ziele,8.294.400Pixelbytes je Ziel; nominell30Hz, keine FIFO alter Frames. Keine Aussage, dies sei das gesamte VRAM-Budget.
- Session/Generation128Bit; Slot0..2; sichere monotone Sequenz1..9007199254740991. Kein ABA-Claim nur nach Slotnummer.
- Maximal vier registrierte Abnehmer, je einer outstanding;500ms ACK-Frist trennt nur den betroffenen Probe-Abnehmer. Kein nativer Release allein durch ACK/Timeout.
- Private Eingangszeile höchstens1024Bytes, Ausgangsmetadaten höchstens2048Bytes, Befehlsqueue16; READY-Notice maximal einmal outstanding plus Dirty-Bit.
- HWND/PID/Prozessstartzeit, eigener Main-Prozess und Crop validieren; keine Titelauflösung, Fremdfenster oder Desktop-Aufnahme. Vorhandene Inputgrenze4096×2160 beibehalten.
- Context-Isolation/Sandboxtrue, nodeIntegrationfalse, keine OS-Handles oder generische IPC im Page-Kontext; Handles als uint64-Strings/8Byte-Buffer, nie Number.
- Nur eigene Testdateien/-fenster, ausdrücklich autorisierter Monitor1. Keine echten Audio-/Monitorrollen, Trust-Center-/Systemrichtlinien oder fremden Office-Dokumente ändern.
- Keine neue npm-/N-API-Abhängigkeit, kein weiterer Download. Separate Electron45.0.0 und bestehende Tools verwenden; bei Fehlen abbrechen.
- Warm-up höchstens10Sekunden, anschließend mindestens60Sekunden; beide Ausgaben mindestens29,5tatsächlich geänderte Quellbilder/s; keine Lücke größer150ms; p95MAIN/Mirror höchstens150ms.
- Eigene PowerPoint-Phase erst nach Transport-PASS; mindestens60Befehle, p95Befehl-bis-sichtbar höchstens250ms. Keine Grenze nach Fehlschlag ändern. Audio bleibt unsupported.
- WGC-sourceReportedQpc ist bis zur Klärung ungeprüft; acquiredQpc/copyDoneQpc getrennt halten. Keine Publikationszeit als Aufnahmezeit ausgeben.
- Vorhandene fremde Datei `tests/smoke/startup-diagnostic.cjs` nicht bearbeiten/stagen/löschen. Bisherige work/-Prototypen bleiben verworfene Experimente, keine ungeprüfte Codeübernahme.

## Review Focus

1. READY wird nach Notice ersetzt: nur der native atomare claimLatest bestimmt die tatsächlich zu importierende Version; TestTask1/3.
2. RenderAck trifft vor dem letzten GPU-Release ein: Slot bleibt LEASED; verzögerter Callback darf keine neue Slot-Version freigeben; TestTask1/4.
3. Stop/Helper-Tod während Import/send: keine Wiederaufnahme mit unklaren Main-Handles, eigener isolierter Main endet kontrolliert; TestTask2/6.
4. Langsamer Empfänger oder Observer: gesunder Output bleibt versorgt, keine unbegrenzte Queue; ungemessene Frames zählen nicht; TestTask4/5.
5. Höhere Sequenz bei gleichem Standbild, fehlende Komposition oder zukünftiger WGC-Zeitstempel: kein falsches FPS-/Quelllatenz-PASS; TestTask5/6.

## Dateistruktur und gemeinsame Verträge

Neue Probe unter `scripts/powerpoint-gpu-probe/`; Smoke-Treiber unter `tests/smoke/`.
`*-tests.cjs` ausdrücklich mit node --test starten, nicht als Vitest-`*.test.cjs`
benennen. Keine neuen exports in Produktcode. Gemeinsame Verträge:

- `FrameKey={sessionId,generation,slotId,sequence}`; Tokens32Hexzeichen.
- `FrameTimes={sourceReportedQpc,acquiredQpc,copyDoneQpc,qpcFrequency}` als positive Dezimalstrings; nur sourceReportedQpc darf bei fehlender Angabe null sein.
- `FrameRecord={key,times,width:1920,height:1080,pixelFormat:'bgra'}`.
- `NativeClaim={record,ntHandle:Buffer(8)}` bleibt ausschließlich Main-intern.
- `RenderAck={key}` enthält weder Client-ID noch nativen Handle; Absender wird aus registrierter WebContents-Identität bestimmt.
- Pro Generation maximal drei native und drei Main-Import-Einträge. Keine neue Generation mit drei weiteren Texturen starten, solange alte Ressourcen noch offen sind; bei nicht drainbarer Generation isolierten Main beenden.
- `allReferencesReleased` gehört zum konkreten FrameKey/Importobjekt; kein globaler Callback für eine austauschbare Slotnummer.
- Ausgaben starten keinen eigenen Player. Last-valid-frame liegt in ihrem eigenen Renderziel, nicht als dauerhaft gepinnte Quellreferenz.

## Task 1: native Slotzustände und gemeinsame Build-Grundlage

**Files:** Create `scripts/native-probe-toolchain.cjs`; modify `scripts/powerpoint-native-probe/build.cjs` nur zur Extraktion der bestehenden Toolchain-Auflösung. Create `scripts/powerpoint-gpu-probe/{slot-pool.h,slot-pool.cpp,slot-pool-tests.cpp,build.cjs}` und `tests/smoke/powerpoint-gpu-slots.cjs`.

**Interfaces:** `resolveNativeToolchain():Promise<{compiler,env}>` verwendet vorhandene vswhere/VsDevCmd-Werkzeuge, hält Environmentwerte nur im Speicher. Bestehendes `buildProbe({root,target})` bleibt unverändert aufrufbar. Neues `buildGpuProbe({root,target})` liefert eigenes markiertes `{folder,executable}`, Targets nur `slot-tests|producer|gpu-pattern-tests`. `SlotPool(session,generation)` liefert `beginWrite():optional<FrameKey>`, `completeWrite(key,times):bool`, `claimLatest():optional<FrameRecord>`, `release(key):bool`, `revoke()`, `drained():bool`.

- [x] RED-Fälle schreiben: `initial_three_free`, `reclaim_ready_never_leased`, `claim_after_notice_uses_current`, `late_release_cannot_free_reused_slot`, `revoke_drains_without_new_generation`. Kernassertion: Nach drei LEASED-Claims ist `beginWrite()==nullopt`; nach falschem/doppeltem Release bleibt das unverändert.
- [x] `node tests/smoke/powerpoint-gpu-slots.cjs` ausführen; fehlende Implementierung als RED feststellen, keine absichtlich falschen Compilerflags.
- [x] Toolchain-Auflösung extrahieren, ohne Logs mit Environmentwerten; beide Builder nutzen sie. SlotPool implementieren: FREE→WRITING→READY→LEASED→FREE auf einem Besitzerthread; Reclaim nur READY; Revoke blockiert neue Claims/Writes, lässt alte exakte Releases und GPU-Abschluss zum Drain zu. Begrenzte Sequenz läuft nie über.
- [x] Mindestens10000deterministische Zustandsoperationen mit gemischter Schreib-/Claim-/Release-Reihenfolge prüfen, inklusive unsicherer Sequenz, falscher Tokens, ungültigem Slot und Rückwärtszeiten. GREEN: `GPU_SLOT_PASS`; zusätzlich bestehende `node tests/smoke/powerpoint-frame-ring.cjs` und49bestehende Node-Probetests unverändert grün, alte Builder-Signatur funktioniert.
- [x] Eigenreview und Commit `test: establish versioned three-slot GPU ownership`. Keine Fenster/Office/Audio in dieser Aufgabe.

## Task 2: echter nativer GPU-Produzent und begrenztes Protokoll

**Files:** Create `scripts/powerpoint-gpu-probe/{producer.cpp,producer-io.h,producer-io.cpp,gpu-pattern-tests.cpp,gpu-targets.h,gpu-targets.cpp}`; extend GPU builder Targets. Create `tests/smoke/powerpoint-gpu-producer.cjs`. Interne Ausführungsentscheidung: gemeinsame GPU-Ziele statt Test-Nachbildung; bestehende `owned-window-fixture.cpp`/`capture-client.cjs` nur um feste eigene Resize-/Minimize-Testaktionen ergänzt. Begründung und Nachweise im Prüfbericht.

**Interfaces:** Konsumiert SlotPool. Producer ist eigener stdin/stdout-Prozess. Native Hello-Antwort bestätigt tatsächlichen Parent-Main-PID, dessen GetProcessTimes-Startwert und zufällige Bootstrap-Nonce; Main sendet Start mit passender Nonce/Identität und SourceOwner. HELLO allein öffnet kein Quellfenster. `ready` liefert privat drei Slot-Handlewerte; Claims verweisen auf diese bestätigte Tabelle. Worker führt WGC/D3D aus, IO-Threads liefern nur begrenzte Befehle/Antworten.

Wireformat: Eingang feste ASCII-Wörter/Dezimal- bzw. Hexwerte, kein neuer JSON-Parser. Befehle `start`, `claim`, `release`, `notice`, `clock`, `stop` mit festen Feldzahlen; Antworten JSON mit `hello|ready|notice|claimed|empty|released|clock|source-lost|closed|error`. `claim <requestId> <sessionId> <generation>`; `release <requestId> <sessionId> <generation> <slotId> <sequence>`; `notice <sessionId> <generation> <noticeId>`; `clock <requestId>`; `stop`. Start lautet exakt `start <protocol> <nonce> <sessionId> <generation> <sourceHWND> <sourcePID> <sourceCreated> <x> <y> <width> <height> <outerWidth> <outerHeight> <parentPID> <parentCreated>`; protocol ist1. Request/Notice-IDs sichere positive Integer; Antworten spiegeln Request-ID und Schlüssel. Fehlercodes feste ASCII-Enums, keine beliebigen Exceptiontexte an Outputs.

- [x] Tests zuerst: falscher PID/Startwert/Bootstrap, Crop außerhalb4096×2160,1025Byte-Befehl/NUL/fehlendes LF,17.Befehl bei voller Queue, eine unbestätigte Notice bei100Änderungen, Claim nach READY-Reclaim. Erwartung: kein Import-Handle vor gültigem Start/Claim, Worker blockiert nicht bei vollem Antwortkanal.
- [x] RED `node tests/smoke/powerpoint-gpu-producer.cjs --monitor=1` beobachten. Fixtures sind ausschließlich eigene Win32-Fenster oder synthetische GPU-Muster; keine freien HWND-CLI-Parameter anbieten.
- [x] Producer implementieren: Callbacks signalisieren nur Events, ein Worker nimmt Frames entgegen, kopiert/croppt/letterboxt und überprüft GPU-Queries ohne blockierende Bildwarteschleife. WGC-Frames bis Kopierabschluss nur auf diesem Worker halten/schließen, maximal drei. Nominelle30Hz-Zeitplanung mit absoluten Deadlines, ausgelassene Zeitfenster nicht nachholen. Keine alle33,33ms knapp unterschreitende Relativzeitprüfung wie im alten Producer.
- [x] Unbenannte nicht vererbbare NT-Handles nur zum bestätigten Parent duplizieren; SourceOwner vor Start und unabhängig alle100ms prüfen. READY erst nach GPU-Kopierabschluss; gültiger Claim hält Textur unveränderlich. Native-QPC-Felder getrennt erzeugen; GPU-Abschluss nicht als Quellaufnahme bezeichnen.
- [x] Echte GPU-Musterprüfung:1000Publikationen, geclaimter alter Slot bleibt unter schneller Weiterproduktion pixelgenau unverändert; komplette gelesene Muster dürfen keine gemischten Versionen enthalten. Regulärer Stop gibt WGC-Frames/Queries/Handles frei. SourceClose/Resize/Minimize meldet Verlust, keine neue Publikation danach. Worker-/IO-Blockade: fünf Sekunden ohne erwartete Protokollantwort ergeben FAIL; danach zwei Sekunden kooperativen eigenen Stop erlauben, anschließend nur den eigenen Testprozess begrenzt beenden. Kein hängender Test und keine zeitbasierte Slotfreigabe.
- [x] GREEN `GPU_PRODUCER_PASS`, Eigenreview und Commit `feat: publish claimed native GPU frames without CPU readback`. Muster-Readbacks dienen nur dem Test, nicht dem Transport.

## Task 3: Main-only Client und Protokollgrenzen

**Files:** Create `scripts/powerpoint-gpu-probe/{producer-client.cjs,producer-client-tests.cjs}` und `tests/smoke/powerpoint-gpu-protocol-fixture.cjs`.

**Interfaces:** `startGpuProducer({executable,cwd,owner,sessionId,generation}):Promise<Client>`; Client bietet `claimLatest():Promise<NativeClaim|null>`, `release(key):Promise<void>`, `subscribeLatest(callback):unsubscribe`, `clock():Promise<{qpcNow,qpcFrequency}>`, `onFault(callback):unsubscribe`, `stop():Promise<{exitCode,drained}>`. Parent-PID kommt intern aus process.pid, Startwert aus dem gebundenen nativen Hello; keine Rendererparameter. Höchstens16offene Requests, zwei Sekunden Antwortfrist, Startup zehn Sekunden. Stop/revoke verwirft wartende Calls mit festen Fehlercodes.

- [x] RED-Tests: fragmentierte echte Kindprozess-Pipe,16aufeinanderfolgende gültige2048Byte-Zeilen in einem Chunk,2049Byte-Einzelzeile, falsches UTF-8/NUL, falsche Session/Generation, doppelter Key/Request, Handle oberhalbuint64 und übergroße Pixelmaße. Nur externe Prozessgrenze faken, Clientdecoder selbst real testen.
- [x] `node --test scripts/powerpoint-gpu-probe/producer-client-tests.cjs` RED für fehlendes Modul feststellen.
- [x] Client implementieren: vollständige Zeilen fortlaufend verarbeiten, nur verbleibende Teilzeile begrenzen; ein großer Stream-Chunk mit vielen gültigen Zeilen ist kein übergroßes Paket. Boot-/Handle-Tabelle und Claimantwort exakt validieren, keine unbounded values-Liste. uint64-Handle erst nach Prüfung in8Byte-Buffer umwandeln. Keine Pixel-/Base64-Daten, keine Environment-/Handle-Logs im öffentlichen UI.
- [x] GREEN Unitfälle plus realer Task2-Producer: READY→Claim→Release, EMPTY ohne fertigen Slot, EOF und Stop während offenem Claim/Release. Fehler ruft onFault einmal, stop beendet nur den eigenen Prozess. Commit `feat: validate Main-only GPU producer protocol` nach Eigenreview.

## Task 4: unabhängiger Broker ohne Freigabe durch RenderAck

**Files:** Create `scripts/powerpoint-gpu-probe/{frame-broker.cjs,frame-broker-tests.cjs,managed-texture.cjs}`.

**Interfaces:** `createGpuFrameBroker({producer,textureApi,now})` liefert `register({id,frame,close}):unregister`, `ack(id,key):bool`, `pumpLatest():Promise<void>`, `revoke():Promise<void>`, `status()`. IDs/frames stammen vom eigenen Window-Controller. `textureApi.import(claim,onAllReferencesReleased)` liefert `{send(frame,key):Promise<void>,releaseMain():void}`; reale Bindung in managed-texture.cjs verwendet Electron45-importSharedTexture/sendSharedTexture. Node-Tests ersetzen nur diese externe API-Grenze.

- [x] RED-Tests schreiben und ausführen: `ack_never_releases_slot`, `late_callback_does_not_release_new_key`, `slow_client_does_not_block_fast_client`, `four_clients_only`, `register_gets_latest_not_first`, `revoke_during_claim_or_send`, `all_clients_busy_does_not_spin`. Kernassertion: RenderAck allein ergibt0producer.release-Aufrufe; erst der passende allReferencesReleased-Callback genau1.
- [x] Broker implementieren: maximal ein laufender Claim, maximal drei Imports, je Client ein outstanding; Claim nur bei freiem Empfänger. Sends unabhängig starten, nicht auf den langsamen Abnehmer warten, bevor weiterer freier Abnehmer Fortschritt machen kann. Producer-Notices, Registrierung und ACK stoßen Arbeit ereignisgesteuert an. EMPTY wartet auf neue Notice statt sofortiger Claim-Schleife.
- [x] Main-Referenz nach Abschluss/Fehler der vorgesehenen Sends loslassen, native Version ausschließlich nach echtem Callback releasen. Pending Send bleibt entsprechend geclaimt,500ms-ACK-Frist macht keinen künstlichen GPU-Release. Revoke verwirft neue Arbeit, alte konkrete Referenzen werden geordnet abgebaut; neue Generation erst nach Drain. Importfehler vor vorhandener Referenz darf den nie importierten Claim explizit zurückgeben, keine Freigabe eines fremden Keys.
- [x] GREEN Node-Tests; Callback-Reihenfolgen einschließlich Sendfehler, sofortigem Callback, doppeltem Callback und Callback nach revoke prüfen. Commit `feat: separate GPU delivery credit from texture lifetime` nach Eigenreview. Reale API-/Pixelprüfung folgtTask5; reine Mocks sind dafür kein Nachweis.

## Task 5: geschützter Receiver und unabhängiger komponierter Nachweis

**Files:** Create `scripts/powerpoint-gpu-probe/{output.html,output.css,output-preload.cjs,frame-stamp.js,frame-stamp-tests.cjs,composed-observer.cjs,composed-observer-tests.cjs,output-harness.cjs}`; create `tests/smoke/powerpoint-gpu-output.cjs`.

**Interfaces:** Preload empfängt ausschließlich verwaltete Imports und FrameKey, zeichnet und schließt Referenzen; an Main nur `RenderAck={key}`. `createComposedObserver({captureStrip,rememberedRecords,now,onObservation})` liefert `remember(record,expectedMotionHash)`, `request()`, `reset(generation)`, `close()`. captureStrip liefert eine einzelne komponierte BGRA-Aufnahme; bekanntes Frame-/Hash-Register maximal16. Observer hat keine producer.release-/Broker-ACK-Fähigkeit.

- [x] Tests zuerst:53-Bit-Stempelroundtrip1/2^32/MAX_SAFE_INTEGER, beschädigter Stempel, gleicher Quellhash bei steigendem Stempel zählt nicht; stale Generation, fehlender Record,17.Record verwirft ältesten; ein langsamer captureStrip bei100requests erzeugt höchstens einen laufenden plus Dirty-Bit. Node-RED vor Implementierung ausführen.
- [x] Receiver implementieren: sandbox/contextIsolationtrue, nodeIntegrationfalse, lokale CSP ohne Netz/Frames, Navigation/Popups sperren. Native Importobjekte bleiben im isolierten Preload; Page bekommt weder handle/getVideoFrame noch generische IPC. Renderziel1920×1080, Kanalordnung/Crop unverändert. GPU-Renderbestätigung schließt VideoFrame und Import, RenderAck meldet nur Lieferkredit.
- [x] Quelle und Stempel in demselben WebGL-Pass rendern, Sequenz als32-/21-Bit-Uniformwerte. Diagnosemarker276×8Pixel beix0,y953, Bewegungszeiley961 unverdeckt. Observer erfasst **einmal** `{x:0,y:953,width:1920,height:9}`; dekodiert Stempel und prüft Quellhash aus demselben Bitmap. Kein getrennter DOM-Stempel und keine Pixel-Kombination aus zwei verschiedenen Zeitpunkten.
- [x] Ereignisgetriebener Observer arbeitet unabhängig von Slotfreigabe und RenderAck; weitere Anfragen koaleszieren. Keine ungemessene Sequenz zählt als sichtbar. Beim Reset alte Ergebnisse/Zuordnungen verwerfen. Temporäre Bildbuffer nach Prüfung loslassen, keine vollständigen Frames in allgemeinem Live-State.
- [x] RED `node tests/smoke/powerpoint-gpu-output.cjs --electron=work/gpu-runtime-v45.0.0/runtime/electron.exe` vor Implementierung. Danach echter GPU-Import aus Task2 in zwei getrennte Renderer: Rot/Blau/Schwarz, volle1920×1080-Geometrie, vier verteilte Pixelstellen, sichtbarer TESTBETRIEB-Overlay, importierte Version bei schnellem Reclaim unverändert, Quelle normal beenden und letzte gezeichnete Ausgabe erhalten.
- [x] Hängenden Probe-Abnehmer gezielt schließen; gesunder Abnehmer bleibt korrekt. Neuer Mirror erhält aktuellen Stand. Page-`typeof require` bleibt undefined; dort kein OS-Handle sichtbar. GREEN Node-/native Ausgabetests, repräsentative PNGs visuell prüfen, Eigenreview und Commit `test: verify composed GPU frames independently of delivery ACKs`.

## Task 6: Gesamtmessung, getrennte Uhren und Fehler-Supervisor

**Files:** Create `scripts/powerpoint-gpu-probe/{clock-domain.cjs,clock-domain-tests.cjs,benchmark.cjs,run.cjs,run-tests.cjs}`; create `tests/smoke/powerpoint-gpu-probe.cjs`. Reuse unverändert `scripts/powerpoint-native-probe/metrics.cjs`, vorhandene eigene Win32-Fixture und `scripts/probe-powerpoint.cjs` mit Capture-Adapter. Keine freie Übernahme von work/-Benchmarkcode ohne Tests.

**Interfaces:** `assessClockSamples({startSamples,endSamples,frameTimes})` liefert `{mapping,uncertaintyMs,sourceLatencyAvailable,diagnostics}`. `runGpuProbe({root,electronPath,monitor:1}):Promise<{transport,office,technicalPass,productionReady:false,audio:'unsupported',artifacts}>`. `technicalPass` erfordert tatsächliches Gesamt-PASS von Transport, eigener Office-Phase und Dokumentintegrität; unvollständige Phasen sind false. productionReady bleibt in diesem Probeplan immerfalse.

- [ ] RED-Unitfälle: falsche Runtime, fehlendes Archiv/Marker,59s,fehlender Empfänger,29,49fps,151msLücke,151msSkew,251msBefehlslatenz, später Freeze, fehlender Kompositionsnachweis. Exakte60s/29,5fps/150ms/250ms akzeptieren. Zusätzlich WGC-Zeitpunkt29ms nachcopyDone bleibt als Diagnose sichtbar und ergibt sourceLatencyAvailable=false, niemals negative Quelllatenz oder automatisch korrigierten Source-Zeitstempel.
- [ ] Runner prüft existierendes freigegebenes Runtime-Archiv SHA256 `ae53887a23bb640369c93dbd38c408a2af5c0deb86f2fa76c6c244cb444b7f47` und tatsächliches45.0.0 im isolierten Kindprozess. Kein require('electron')-Pfad der installierten37 zum Starten benutzen, kein Download/Installer. Nur eigener markierter neuer work/-Ordner und eigener userData-Pfad.
- [ ] Benchmark implementieren: KomponentenTask1–5 verbinden, drei Clock-Roundtrips vor/nach Lauf mit minimaler RTT/Drift, alle tatsächlichen Beobachtungen auf Main-performance-Uhr. Native-Quelle-/Publikationstimes getrennt roh erhalten. Beobachtung darf Capture/Render-ACK nicht seriell halten. Maximal16Records pro Observer; Timing-/Fehlerdaten ohne native Handles im Prüfbericht.
- [ ] `node tests/smoke/powerpoint-gpu-probe.cjs --monitor=1 --electron=work/gpu-runtime-v45.0.0/runtime/electron.exe` ohne schwere parallele Builds starten. Win32-Warm-up≤10s, danach≥60s; gesamte Rohdaten einschließlich aller Auslassungen speichern. Nominale30Hz allein ist kein PASS. Nicht erfüllte Observer-Cadence bleibt FAIL/UNPROVEN.
- [ ] Nur bei bestandenem Transport eigene COM-Fixture starten. Vorhandene Klick0→1→2-, Auto-Zeit-, Pause-/Fortsetzungsprüfungen erhalten. Mindestens60normale Klick-/Wechselbefehle über60s; sichtbare erwartete Effekte unabhängig aus komponierten Bildern prüfen, bei Bedarf während Befehlen eine vollständige komponierte Aufnahme statt des schmalen Dauerstreifens. Diese Messkosten ausweisen. Original-/Sentinelhash und Saved-Zustände nach regulärem Close unabhängig prüfen; ein fehlender Befehl oder geändertes Dokument macht Gesamt-FAIL.
- [ ] Separate Fehlerläufe nach normaler Messung: Quelle schließen/minimieren/resizen, falsche Startzeit/HWND, hängender/geschlossener Receiver, alte ACKs nach Reconnect, Stop im Import-Callback, Helper hart beenden. Supervisor beendet bei unklaren Main-Handles den **eigenen** Electron-Probeprozess, prüft dessen Ende und alle eigenen Kinder, nie fremdes Office/globalen Prozessnamen killen. Fehlerlauf wird nicht als normaler FPS-PASS ausgegeben. Kooperativer Quellverlust zeigt letzten Frame plus eigenes Systemoverlay.
- [ ] GREEN bedeutet erfüllte Tests, nicht zwangsläufig bestandene Leistungsabnahme. Ergebnisse/FAILs erhalten, Eigenreview; Commit `test: characterize three-texture GPU capture end to end`. Wenn Architektur/Beobachtung erneut nicht reicht, Grenze berichten statt Werte lockern oder einen vierten unfreigegebenen Ansatz stapeln.

## Task 7: Regression, belegte Übergabe und keine Veröffentlichung

**Files:** Create `docs/superpowers/evidence/2026-10-22-powerpoint-gpu-pipeline.md`; modify den freigegebenen GPU-Entwurf und bisherigen Hybridplan nur um verifizierten Status/Verweis, keine pauschalen Fertig-Markierungen.

**Interfaces:** Evidenz trennt Zustandstests, tatsächliche statische GPU-Prüfung, gemessene Cadence, PowerPoint-Befehle, Quellzeit-Vertrauen und Produktionsfreigabe. Ein reines GPU-/Transport-PASS erfüllt weder regionale Vollständigkeit noch Produktintegration/Audio.

- [ ] Root-Eigenreview gegen alle fünf Review-Focus-Klassen und neue Slot-/Handle-/Observer-Grenzen; wichtige Funde zuerst als RED reproduzieren, minimal korrigieren, betroffene Tests erneut ausführen. Keine Review-Delegation; schwächeren Autorreview ausdrücklich protokollieren.
- [ ] Einzeln, außerhalb von Leistungsproben: `node --test scripts/powerpoint-gpu-probe/*-tests.cjs scripts/powerpoint-native-probe/*-tests.cjs`; neue Slot/Producer/Output-Smokes gemäß Tasks1/2/5; `node tests/smoke/powerpoint-frame-ring.cjs`; `node tests/smoke/powerpoint-native-reader.cjs`; `node tests/smoke/powerpoint-native-capture.cjs --monitor=1`; `node node_modules/vitest/vitest.mjs run --maxWorkers=2`; `npm run build`; `npm run build:web`; `npm run test:web`; `node scripts/test-v86-native.cjs`. Exitcodes und echte Ergebnisse lesen. Vorhandene Warnungen nicht als behoben ausgeben.
- [ ] Eigene Prozess-/Handle-Bereinigung, bytegleiche Audio-/Monitorpräferenzen und unveränderte package/lockfile prüfen; fremde startup-diagnostic-Datei erhalten. Keine Test-Sicherheitslockerung oder automatische Änderung von Produkt-Updatemetadaten.
- [ ] Evidenz mit exakten Artefakten, gepaarten/ungepaarten Frames, vollen Grenzwerten, Uhrfehlern und Grenzen schreiben. Bei technischem FAIL keinen Original-Player einhängen. Auch bei technischem PASS bleibt ein gesonderter Produkt-Upgrade-/Handle-Recovery-/Audio-/Hybridimport-Plan erforderlich; vollständige Regionaltexte bleiben eigenes Releasegate.
- [ ] `git diff --check`, Eigenreview und Commit des Prüfberichts. Kein Publish/Tag/Installer aus diesem Plan. Plan/Ledger nur bei tatsächlich erledigtem Umfang abschließen; bei Blockade getesteten Stand und konkrete nötige Richtungsentscheidung übergeben.

## Selbstprüfung und Ausführung

Spec-Abdeckung: Slot-/Claim-ZuständeTask1; Worker/GPU/IO/IdentitätTask2; Decoder/
GrenzenTask3; echte Freigabe und Client-RückstauTask4; atomare Komposition und
Observer-RückstauTask5; Uhren, echte Bewegung, Office und Absturz-SupervisorTask6;
Regression/ReleasegrenzenTask7. Interfaces zwischen Tasks stimmen mit den oben
definierten FrameKey/Record/NativeClaim/RenderAck überein. Keine Implementierung
dieses Plans erfolgt vor separater Nutzerprüfung.
