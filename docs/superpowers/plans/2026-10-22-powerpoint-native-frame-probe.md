# Native PowerPoint Frame Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. User requires native implementation by the primary agent, no programming or review delegation.

**Goal:** Die neue Windows-Aufnahme und Rohbildverteilung isoliert nachweisen, bevor der Original-Player in GottesdienstRegie integriert wird.

**Architecture:** Ein eigener C++/WinRT-Prozess erfasst das bestätigte Show-Fenster und veröffentlicht fertige BGRA-Frames in einem geschützten Drei-Slot-Ring. Ein separater nativer Reader-Prozess liest ausschließlich diesen Ring; ein Node/Electron-Broker verteilt Binärframes mit Rückstaugrenzen an isolierte MAIN-/Mirror-Testfenster. Die bestehende Office-Steuerung bleibt unverändert maßgeblich für Animationen und Zeiten.

**Tech Stack:** Installiertes Electron37.10.3, Node, VS2022 BuildTools14.44.35207 und Windows-SDK10.0.26100.0, C++17/C++/WinRT, Win32/D3D11, bestehende C#-COM-Probe. Keine neue npm-/Produktabhängigkeit, kein Electron-Upgrade, keine N-API-Header oder Node-ABI-Bindings: Der native Reader wird als begrenzter Kindprozess betrieben.

**Spec:** [Freigegebener Entwurf](../specs/2026-10-22-powerpoint-frame-transport-design.md), Nutzerfreigabe „ja umsetzen“ nach schriftlicher Vorlage. Dieser Umsetzungsplan benötigt noch eigene Nutzerprüfung vor Implementierung.

## Global Constraints

- Nur diese technische Probe, keine Produktintegration, Versionsanhebung, Installer, Push, Tag oder Veröffentlichung.
- Bestehende Originaldateien, Dokumentrevisionen und Audio-/Monitorzuordnungen unverändert; Audio weiterhin unsupported.
- Nur eigene Testdateien und deren bestätigtes Show-Fenster; sichtbarer Test ausschließlich auf dem autorisierten Monitor1, niemals eine Publikums-MAIN-Zuweisung ändern.
- Kein Desktop-Capture, keine Fremdfenster, kein globaler Office-Kill, keine Trust-Center-/Policy-Änderung.
- Genau drei Slots; maximal8.294.400Pixelbytes/Frame,1920×1080,BGRA8, proportional mit Letterbox, nominell30fps.
- Höchstens vier registrierte Abnehmer; maximal ein unbestätigter Frame je Abnehmer, kein alter Rückstau.
- Mindestens60Sekunden Messzeit nach separat protokolliertem Warm-up, mindestens29,5 tatsächlich veränderte Quellframes/s je Abnehmer; keine Darstellungs-Lücke größer150ms.
- p95 MAIN/Mirror höchstens150ms und p95 Befehl bis sichtbarer Animationsbeginn höchstens250ms; keine Anpassung nach einem Fehlschlag.
- Context-Isolation/Sandbox bleiben aktiv; keine nativen Kennungen, Pfade, Mappingnamen oder Node-Fähigkeiten im Renderer.
- Vorhandene fremde Datei `tests/smoke/startup-diagnostic.cjs` bleibt unberührt.
- Root implementiert und führt einen separaten Eigenreview durch; dieser ersetzt keine unabhängige Prüfung und wird als solche Einschränkung dokumentiert.

## Review Focus

1. Wiederverwendetes HWND nach Office-Neustart: Besitzprüfung einschließlich PID-Startzeit muss vor erneuter Aufnahme scheitern (Aufgabe2).
2. Gleichzeitige Slot-Wiederverwendung beim Kopieren: keine Teilbilder, keine gelesenen Pixel einer falschen Generation (Aufgabe1).
3. Langsamer oder geschlossener Renderer: keine globale Warteschlange, kein Blockieren des anderen Outputs oder Main-Eventloops (Aufgabe3).
4. Alte Bestätigung nach Reconnect: darf keinen neuen Frame freigeben oder frühere Session reaktivieren (Aufgabe3).
5. Lauf besteht anfangs, friert später ein: Gesamtlauf FAIL, keine p95-Auswertung nur günstiger Teilsamples (Aufgabe4).

## Gemeinsame Verträge

Native interne Generation ist ein128-Bit-Token, Sitzung ebenfalls128Bit. Public-Pakete erhalten nur Sitzung, Generation, Sequenz und Bildmetadaten, keine OS-Kennungen. Die Probe arbeitet mit x64; unsupported Plattformen brechen vor Office-/Capture-Start ab.

- `FrameDescriptor`: `{sessionId:string,generation:string,sequence:number,width:1920,height:1080,stride:7680,byteLength:8294400,capturedQpc:string,qpcFrequency:string}`. QPC-Werte bleiben Dezimalstrings, um64-Bit-Präzision nicht durch JS-Number zu verlieren.
- `FramePacket`: `{descriptor:FrameDescriptor,pixels:Uint8Array}`. Sequenzen sind sichere positive JS-Integer; Überlauf beendet die Generation statt zu umbrechen.
- Native Reader-Protokoll: Main schreibt ein eng begrenztes `read`-Kommando mit Generation und letzter Sequenz. Reader antwortet mit einem16Byte-Binärpräfix (Magic GRFP, Protokoll1, JSON-Headerlänge, Pixellänge), UTF-8-Header höchstens1024Bytes und exakt begrenzten BGRA-Bytes. Kein unaufgeforderter Dauerstrom. `empty`/Fehler werden als Header ohne Pixel geliefert. Vor Allokation alle Längen begrenzen, pro Anfrage genau eine Antwort, Abbruch bei Zusatzbytes/Protokollbruch.
- `createFrameBroker({sessionId,generation,reader,now})`: liefert `register(client)`, `ack(clientId,generation,sequence)`, `pump()`, `revoke()`. `client={id,send(FramePacket),close()}` stammt ausschließlich aus dem Main-registrierten Testfenster, nie aus einer Renderer-ID-Eingabe. `reader.readLatest(afterSequence):Promise<FramePacket|null>` und `reader.close():Promise<void>` werden in Aufgabe2 bereitgestellt.
- Capture-Status enthält intern `ready|capturing|source-lost|error|closed`, QPC-Frequenz und den bestätigten Besitzer. Bild-/Readerfehler dürfen nie als `capturing` mit gültigem Frame gemeldet werden.

## Task 1: Begrenztes Ringprotokoll und native Sicherheitstests

**Files:** Create `scripts/powerpoint-native-probe/frame-ring.h`, `frame-ring.cpp`, `frame-ring-tests.cpp`, `build.cjs`, `tests/smoke/powerpoint-frame-ring.cjs`.

**Interfaces:** `FrameRing::create(config)`, `FrameRing::openReadOnly(config)`, `publish(descriptor,pixels)`, `readLatest(afterSequence)`, `close()`. Config enthält feste Protokollwerte, Sitzung/Generation und internen Mappingnamen. Methoden liefern geprüfte Fehlercodes, niemals nackte Pointer nach außen.

- [ ] Tests zuerst schreiben: gültige Grenzgröße, unzulässige Breite/Stride/Byteanzahl, Multiplikationsüberlauf, falsche Version/Generation, leeres Mapping, unvollständiger Publish, paralleler Schreiber und langsamer Leser. Assertion: Kein zurückgelieferter Pixelblock darf gemischte Muster verschiedener Sequenzen enthalten.

  Kernfälle `rejects_uncommitted_or_foreign_generation` und `never_returns_torn_pixels_under_load`:
  `assert(!reader.readLatest(0).has_value())` vor Commit/für falsche Generation;
  bei jedem Stress-Frame `assert(allPixelsMatchSequence(frame))`.
- [ ] `node tests/smoke/powerpoint-frame-ring.cjs` ausführen; RED muss fehlende Implementierung benennen. Tests dürfen nicht wegen einer fremden Datei oder absichtlich falscher Compilerflags scheitern.
- [ ] `build.cjs` findet die vorhandenen Tools über vswhere und feste SDK-Prüfung und startet die Compilerumgebung über `VsDevCmd.bat` ohne Policyänderung. Alle Ausgaben in ein neues, markiertes Verzeichnis unter `work/powerpoint-native-probe-*`; keine Installation/Downloads und kein Schreiben in Visual Studio/SDK-Verzeichnisse.
- [ ] Ring implementieren: drei feste Slots, konsistente atomare Veröffentlichung und Versionsprüfung, begrenztes Kopieren, höchstens drei Leseversuche ohne Warten auf einen Schreiber. ACL ausschließlich aktueller SID und SYSTEM; zufälliger `Local\\`-Name, Create-Kollision hart ablehnen, Reader nur Lesezugriff. Fehler in Mappinggröße/Protokoll/Token vor Pixelzugriff ablehnen.
- [ ] Native Cross-Process-Tests mit mindestens10000Publikationen unter konkurrierendem Lesen ausführen; Sequenzen dürfen übersprungen werden, Teilbilder niemals. ACL-Descriptor programmatisch prüfen, unpassendes Generationstoken ablehnen, alle eigenen Handles nach close freigeben.
- [ ] GREEN und Eigenreview; Commit `test: validate bounded native PowerPoint frame ring`. Kein Capture-/Office-Start in dieser Aufgabe.

## Task 2: Bestätigte Fensteraufnahme und begrenzter Reader-Prozess

**Files:** Create `scripts/powerpoint-native-probe/capture.cpp`, `reader.cpp`, `reader-client.cjs`, `owned-window-fixture.cpp`, `tests/smoke/powerpoint-native-capture.cjs`; modify `build.cjs`, `scripts/powerpoint-probe/PowerPointProbe.cs` nur für internen Besitz-/Zeitnachweis.

**Interfaces:** Native Capture erhält über privaten Startkanal bestätigtes HWND,PID,Prozessstartzeit,Crop,Sitzung/Generation und Mappingtoken. `createNativeReader(config)` liefert den Vertrag `readLatest(afterSequence)`/`close()` aus dem gemeinsamen Block. Die native Reader-EXE lädt keinen Renderer-Code und akzeptiert keine beliebigen Datei-/Mappingpfade aus dem UI.

- [ ] RED: Eine eigene Win32-Testquelle zeichnet Farbfelder, Bewegung und ein Quellframe-Zählmuster; Capture muss diese Pixel tatsächlich liefern. Tests für falsche PID/Prozessstartzeit, ungültigen Crop, verlorenes Fenster, falsche Generation und zweite Mapping-Erstellung schreiben und laufen lassen.

  `rejects_reused_window_owner`: `assert.equal(result.errorCode,'SOURCE_OWNER_MISMATCH')`;
  `captures_owned_source_not_its_frame`: `assert.deepEqual(sampleRedPixel(frame),[0,0,255,255])` für BGRA und `assert.equal(containsWindowBorder(frame),false)`.
- [ ] WGC mit `CreateForWindow`, `CreateFreeThreaded`, D3D11 implementieren; Capture-Verfügbarkeit vor Start prüfen. Besitz bei Start und Fensterwechsel prüfen, Schließen der CaptureItem-Quelle als source-lost melden. Framepool/Surface-Größenänderung geordnet behandeln, nicht fremde Quelle auswählen.
- [ ] GPU-Crop und proportionale Letterbox-Transformation auf1920×1080,BGRA8 vor dem begrenzten Readback durchführen. Alpha deckend; Debugmuster prüft korrektes Rot/Blau, 16:9-/4:3-Geometrie, Ränder und abgeschnittene Fensterleisten. Höchstens30vollständige Publikationen/s, keine verschobene Office-Oberfläche als vermeintlicher Crop.
- [ ] `reader.cpp` liest ausschließlich den bestätigten Ring und liefert das begrenzte Binärprotokoll. Node-Client zuerst gegen fragmentierte Präfixe, zu große Header/Pixellängen, Extraantwort, EOF, hängenden Prozess, ungültiges UTF-8 und Tokenwechsel testen. Jede Anfrage höchstens2Sekunden; Reader bei Fehler nur als eigenen Kindprozess beenden.
- [ ] GREEN: `node tests/smoke/powerpoint-native-capture.cjs` mit eigener Quelle; Source-Exit hält letzten gültigen Frame und schließt Handles. COM-Helfer ergänzt ausschließlich PID-Startzeit/QPC und validierten eigenen Pfad, keine Änderung an Klick-/Timingsteuerung. Sentinel nicht verändern.
- [ ] Commit `feat: probe isolated Windows PowerPoint frame capture`. Noch keine Produktionsfähigkeit behaupten.

## Task 3: Autorisierter Broker und isolierte Output-Komposition

**Files:** Create `scripts/powerpoint-native-probe/frame-broker.cjs`, `frame-broker.test.cjs`, `output.html`, `output-preload.cjs`, `output-renderer.js`, `output-harness.cjs`, `tests/smoke/powerpoint-native-output.cjs`.

**Interfaces:** `createFrameBroker` aus gemeinsamem Block. Preload veröffentlicht ausschließlich `onFrame(listener)` und `ackFrame({generation,sequence})`; Main leitet Absender aus dem tatsächlichen WebContents ab. Keine generischen IPC-Kanäle, Invoke-Funktion oder Native-Bridge im Fenster.

- [ ] RED-Unitfälle über `node --test scripts/powerpoint-native-probe/frame-broker.test.cjs`: vier Clients erlaubt/fünfter abgelehnt; je Client ein outstanding; langsamer A blockiert B nicht; alte/gefälschte ACK, send-Fehler, unregister/reconnect und revoke während read ignorieren alte Daten. Readerfehler beendet Pump ohne unhandled rejection.

  `slow_client_does_not_queue_or_block_fast_client`: nach drei pump/ACK-Zyklen
  `assert.equal(slowFrames.length,1)` und `assert.equal(fastFrames.at(-1).descriptor.sequence,3)`;
  `late_old_generation_ack_is_ignored`: `assert.equal(newSessionOutstanding,true)`.
- [ ] Broker implementieren mit gemeinsamem neuesten Frame, maximal einer laufenden readLatest-Anfrage und Timer30Hz; keine pro-Client-Reader oder per-Frame-Generalzustände. ACK-Deadline500ms trennt nur betroffenen Client, Operator-Status merkt Fehler. Bestätigter Sequenzraum und Generation vor Lieferung/ACK prüfen.
- [ ] Renderer zeichnet unveränderte BGRA-Pixel mit expliziter Kanalumordnung in Canvas/WebGL und bestätigt die tatsächliche Komposition über Folgetakt plus Pixelprüfung; Empfang allein ist kein sichtbares Frame. Notwendige Bitmap-/GPU-Ressourcen bei Ersatz/Stop freigeben. Sandboxtrue,contextIsolationtrue,nodeIntegrationfalse, lokale CSP ohne externe Ressourcen.
- [ ] Native Harness sendet eigene Binär-Testbilder an zwei Fenster; Bildprüfung auf Farben, Crop, Größe, Sequenzen und ruhendes `TESTBETRIEB` über Bild/Schwarz. Ein Fenster absichtlich ohne ACK, zweites muss weiterlaufen. Anschließend neues Fenster bekommt neuesten, nicht ersten Frame.
- [ ] `node --test scripts/powerpoint-native-probe/frame-broker.test.cjs` und `node tests/smoke/powerpoint-native-output.cjs` GREEN; Commit `feat: bound native frame delivery to authorized output probes`. Kein Einhängen in AppShell, MAIN oder echte Ausgabefenster.

## Task 4: PowerPoint-Gesamtprobe und unveränderte Freigabegrenzen

**Files:** Create `scripts/powerpoint-native-probe/run.cjs`, `metrics.cjs`, `metrics.test.cjs`, `tests/smoke/powerpoint-native-probe.cjs`; modify `scripts/probe-powerpoint.cjs` ausschließlich für injizierbaren Capture-Probe-Adapter, bisherigen WebRTC-Test weiter ausführbar halten.

**Interfaces:** `runNativeProbe({root,monitor:1})` liefert `{visual:boolean,audio:'unsupported',results}`. `evaluateRun(observations)` liefert vollständige Metriken/Fehler; es öffnet keine Dateien/Fenster. Eine injizierte Probe benutzt dieselben COM-Kommandos und dieselbe eigene Fixture wie bisher.

- [ ] RED-Metriktests:59Sekunden,Lücke151ms,Cadence29,49fps,Skew151ms,Latenz251ms,fehlender Client und nachträgliches Freeze ergebenFAIL; Grenzen60Sekunden,29,5fps,150ms,250ms exakt akzeptieren. Durchschnittswerte/p95 aus Rohdaten berechnen, nicht aus Erfolgsschaltern.

  `rejects_late_freeze_without_discarding_samples`: `assert.equal(evaluateRun(frozenRun).visual,false)`;
  `accepts_exact_declared_limits`: `assert.equal(evaluateRun(exactBoundaryRun).visual,true)`;
  je Grenzverletzung `assert.equal(evaluateRun(violatingRun).visual,false)`.
- [ ] Harness zuerst mit eigener Win32-Quelle, dann mit eigener PowerPoint-Quelle ausführen. Jeweils höchstens10Sekunden Warm-up, danach mindestens60Sekunden ohne parallele schwere Build-/Tests. Sichtbarer Test nur explizit `--monitor=1`, fehlenderDISPLAY1/aktive fremde Office-Präsentation führt vor Fensterbewegung zum Abbruch.
- [ ] Klick0→1→2, automatischer Wechsel, Pause/Fortsetzung unverändert prüfen. Quellzeit/QPC, Ringpublikation, Brokerannahme und komponierte Renderer-Sequenzen erfassen. FPS nur aus tatsächlich geänderten Quellpixeln/Markerpositionen, nicht aus weitergezählten Capture-IDs oder wiederholten Kopien. Identische Sequenzen zwischen Clients für Skew paaren und fehlende Folgen separat zählen.
- [ ] Befehlslatenz mit mind.60normalen Klick-/Wechselbefehlen über die Messung beobachten; Quelle/Kommandobestätigung und tatsächlich sichtbare Änderung unabhängig aufzeichnen. Ein fehlender Wechsel macht den gesamten TestFAIL, nicht nur einen Datenpunkt unsichtbar. Mono-/QPC-Uhren kalibrieren; Zeitdomänen nicht ungeprüft mischen.
- [ ] Gemäß Entwurf auch Overlap/Offscreen/Minimierung testen, eigene Quelle schließen, Reader/Capture gezielt als eigene Prozesse ausfallen lassen, Output reconnecten. Letzter Frame bleibt mit Systemoverlay, Fehlerstatus statt stiller Wiederaufnahme. Keine Aussage „Produktionsquelle geeignet“, wenn nur der sichtbareMonitor1-Test funktioniert.
- [ ] Original-/Sentinelhash und Saved-Status prüfen. In finally nur eigene Quellen/Show/Helper schließen; bei fremden Dokumenten App nicht beenden. Vorherige Audio-/Display-Präferenzen bytegleich, keine Abspiel-/Aufnahme-/Streaming-Nebenwirkung.
- [ ] `node --test scripts/powerpoint-native-probe/metrics.test.cjs` und `node tests/smoke/powerpoint-native-probe.cjs --monitor=1` ausführen. Rohdaten, Fehler und vollständige Aufräumprüfung in eigenem Artefaktverzeichnis erhalten, auch beiFAIL.
- [ ] Evidenz `docs/superpowers/evidence/2026-10-22-powerpoint-native-frame-probe.md` mit Tatsachen/Restgrenzen schreiben, Eigenreview und Commit `test: characterize native PowerPoint frame distribution`. Task nur als technisch freigegeben markieren, wenn alle Kriterien tatsächlich bestanden sind.

## Task 5: Regression und begrenzte Übergabe an Hybridimport

**Files:** Modify evidence above, `docs/superpowers/plans/2026-10-20-powerpoint-hybrid-import.md` nur als expliziter Prüfstatus/Verweis, keine pauschalen Erledigt-Haken.

- [ ] Unit-Suite `node node_modules/vitest/vitest.mjs run --maxWorkers=2`, Desktop-Build `npm run build`, Browser-Suite `npm run test:web` und bisherige native Regressionsharness `node scripts/test-v86-native.cjs` einzeln ausführen, Ergebnisse lesen/protokollieren. Nicht gleichzeitig mit der Latenzmessung starten.
- [ ] Separater Root-Eigenreview gegen Besitz, IPC-Längen, Ringkonkurrenz, Generationswechsel, Ressourcen, Limits und alle fünf Review-Focus-Fälle. Wichtige Funde zuerst mit RED-Test belegen, minimal korrigieren, betroffene und volle Suite erneutGREEN. Autor-Eigenreview ausdrücklich als schwächer festhalten.
- [ ] BeiPASS: genaue geprüfte Fähigkeit an den bestehenden Hybridplan übergeben; Original-Audio und Produktintegration bleiben getrennt offen. BeiFAIL: konkrete Grenze/Artefakt benennen, keine Lockerung/Videoersatz, keine Produkteinbindung. Regionalprüfung ebenfalls nicht als erledigt behandeln.
- [ ] Abschließenden Prüfbericht committen. Kein Publish aus diesem Probeplan; erst vollständige übrige v86-Anforderungen ermöglichen den bereits gewünschten normalen Release.
