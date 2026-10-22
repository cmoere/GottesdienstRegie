# Drei GPU-Puffer: laufender Prüfbericht

Stand22.10.2026. [Plan](../plans/2026-10-22-powerpoint-gpu-pipeline.md) und
[Entwurf](../specs/2026-10-22-powerpoint-gpu-pipeline-design.md) sind vom Nutzer
freigegeben. Nur isolierte Probe, keine installierte Anwendung verändert,
keine Produktveröffentlichung. Root-Eigenreview, keine unabhängige Zweitprüfung.

## Task1: begrenzte native Eigentumszustände

Implementiert: drei Slots, FREE/WRITING/READY/LEASED, versionierte Claims und
exakte Releases, Workerbindung und Widerruf mit kontrolliertem Drain. Ältere
READY-Bilder werden beim neuesten Claim verworfen; eine verspätete ältere
GPU-Fertigmeldung darf keinen Rücksprung erzeugen. Gemeinsame vorhandene
VS/SDK-Auflösung extrahiert; alte Builder-Signatur und Flags unverändert.

RED vor Implementierung: `node tests/smoke/powerpoint-gpu-slots.cjs` scheiterte
mit „GPU slot implementation/build is missing“.

Geprüfte Ergebnisse:

- Neuer nativer Slot-Test:9Fälle PASS, einschließlich10000deterministischer
  gemischter Zustandsoperationen. `work/powerpoint-gpu-probe-lI2Eqz/slot-tests.log`;
  C++-Build ohne Warnungen.
- Bestehende Node-Probetests:49/49 PASS,
  `work/gpu-pipeline-task1-node.log`.
- Alter Rohbild-Ring:10000vollständige1080p-Bilder PASS,
  `work/powerpoint-native-probe-SHPFXT/frame-ring-tests.log`.
- Vollständiger Ausgangslauf:183Dateien/756Tests PASS,336,36s,
  `work/gpu-pipeline-baseline-unit.log`.
- Vollständiger abschließender Lauf:183Dateien/756Tests PASS,255,81s,
  `work/gpu-pipeline-task1-unit-serial.log`.

Fehlversuche bleiben dokumentiert: Während paralleler umfangreicher Testläufe
überschritt der alte Ring-Stress seine60s-Frist; das Kindprotokoll enthält
„stress reader timed out“, keinen Torn-Pixel-Befund
(`work/powerpoint-native-probe-1ArUPC/stress-reader-failure.log`). Ein zweiter
Vitest-Lauf hatte755PASS/1Timeout bei
`src/regional/inventory.test.ts` / „inventories assembled current help and
canonical native dialogs rather than retired raw help“:5515ms statt5000ms.
Dieser Test bestand danach allein in3623ms,14/14Inventartests PASS
(`work/gpu-pipeline-inventory-isolated.log`); der vollständige letzte Lauf
bestand ebenfalls. Das stützt einen Lastbezug, beweist keine genaue
Windows-Scheduling-Ursache. Keine Testfrist, Behauptung oder Bildprüfung gelockert.

## Task2: nativer Produzent und private Steuerung

Implementiert: ein Besitzerthread für WGC/D3D, drei gemeinsam nutzbare GPU-Ziele,
GPU-bestätigte Fertigstellung vor einem Claim, private Parent-PID-/Startzeit-/Nonce-
Bindung, SourceOwner-/Geometrieprüfung und unabhängige100ms-Quellprüfung.
Frame-/Closed-Callbacks signalisieren ausschließlich Ereignisse. Pipe-Threads
verwenden begrenzte Queues; Metadaten/Befehle bleiben2048/1024Bytes, Queues16,
Notice maximal einmal outstanding plus Dirty-Bit. Keine CPU-Pixelarrays oder
Staging-Readbacks im Producer. Native Worker-Queries sind von Main-Liefer-ACKs
unabhängig; die komplette Main-Integration ist noch offen.

Die GPU-Ressourcen stehen in `gpu-targets.h/cpp`, gemeinsam für Producer und
echte GPU-Tests, statt einer getrennten Test-Nachbildung. Die vorhandene eigene
Win32-Fixture erhielt ausschließlich die zwei eigenen Fensteraktionen
`resize`/`minimize` mit begrenzten Nachrichten. Kein frei wählbares fremdes HWND.
Das sind interne Dateiaufteilungs-/Fixture-Ergänzungen, keine zusätzliche
Produktfunktion oder Abhängigkeit.

Tests zuerst fehlgeschlagen: fehlende Producer-/IO-/GPU-Implementierung;
danach fehlende Fixture-Aktionen und ausbleibende Ablehnung wiederholter Befehle
(`work/gpu-pipeline-task2-extra-red.log`,
`work/gpu-pipeline-task2-replay-red.log`). Nach Implementierung bestanden:

- `GPU_IO_PASS`: Parser, Boot-Bindung, Fragmente, ungültige Zahlen/Tokens,
  NUL/Überlänge/fehlendes LF,16/17Queue-Grenze, nicht blockierende Antwortqueue
  und100koaleszierte Änderungen.
- `GPU_PATTERN_PASS`:1000vollständig gelesene1080p-GPU-Muster, während eine
  ältere geleaste Textur über den gesamten Lauf unverändert blieb.
  Readbacks ausschließlich im Test, nicht im Capture-Transport.
- `GPU_PRODUCER_PASS`: echte Aufnahme der generierten eigenen Quelle,
  Boot-/Owner-/Crop-Ablehnung, drei Claims/kein vierter, kontrollierter
  Quellschluss, Request-Replay-Ablehnung, Größenänderung und Minimierung,
  bestätigter Drain beim normalen Stop.
- Bisheriger nativer Capture-Smoke weiterhin PASS mit beiden Seitenverhältnissen,
  `work/gpu-pipeline-task2-old-capture.log` und
  `work/powerpoint-native-probe-mRiY5V/owned-capture-observations.json`.
- Bisheriger nativer Reader-Smoke PASS,
  `work/gpu-pipeline-task2-old-reader.log`;
  alte49Node-Probetests PASS, `work/gpu-pipeline-task2-node.log`;
  Slot-Test weiterhin PASS, `work/gpu-pipeline-task2-slots.log`.
- Vollständige Regression:183Dateien/756Tests PASS,300,13s,
  `work/gpu-pipeline-task2-unit.log`. Schwere Prüfungen für diesen Abschluss
  seriell ausgeführt, nicht gleichzeitig mit GPU-/Aufnahmetests.

### Sicherheitsfund im Autorreview

Ein fehlerhafter Handle-Schließversuch durfte nicht den alten Handlewert für
einen weiteren Versuch behalten. Laut
[Microsoft: DuplicateHandle](https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-duplicatehandle)
schließt `DUPLICATE_CLOSE_SOURCE` die Quelle auch bei Fehler-Rückgabe. Der
eigene native Regressionstest schloss absichtlich nur einen eigenen Duplikat-
Handle vorab und reproduzierte den Fehler
(`work/powerpoint-gpu-probe-xCdD9R/gpu-pattern-tests.log`).
Jetzt wird die Eigentumsmarkierung vor dem einmaligen Schließen verbraucht.
Fehler bleiben gemeldet, alte Werte werden nicht erneut benutzt.
`GPU_HANDLE_FAILURE_PASS` bestätigt diesen Fall. Das ist keine Freigabe einer
Produkt-Handle-Wiederherstellung: Bei hartem Helper-Tod muss der zukünftige
isolierte Main-Supervisor weiterhin seinen eigenen Prozess beenden.

Abschließender erweiterter Real-Smoke mit expliziten Fallmarkierungen:
`work/gpu-pipeline-task2-producer-verified.log` PASS; nativer Producer unter
`work/powerpoint-gpu-probe-62JwZk`, Musterprüfung unter
`work/powerpoint-gpu-probe-KXuoSi/gpu-pattern-tests.log`.
Alle sechs Owner-/Bootstrap-Ablehnungen lieferten die erwarteten spezifischen
Fehlercodes; nach Quellverlust und Freigabe aller Claims entstand kein neuer
Frame. Resize/Minimize jeweils mit erwarteter Ursache bestätigt. Native Builds
ohne Compilerwarnungen. Keine eigenen Probeprozesse übrig; package/lockfile
unverändert und fremde startup-diagnostic-Datei unverändert/unstaged.
Autorreview fand und korrigierte die oben beschriebenen Replay-/Handle-Fälle;
keine unabhängige Codeprüfung. Task2 ist damit als native Komponentenprüfung
abgeschlossen, ausdrücklich nicht als Produktions- oder Leistungsfreigabe.

## Offen

Task3–7 sind nicht vollständig: Main-only-Client,
unabhängige Empfänger/Freigaben, tatsächliche Komposition,
60s-Cadence, Office-Befehle, Fehler-/Handle-Lebensdauer und Gesamtregression.
Zustandstests allein belegen weder GPU-Transport noch Original-PowerPoint.
Produktintegration, Originalaudio, Runtime-Upgrade und vollständige Regionaltexte
bleiben eigene Releasebedingungen. `productionReady` bleibt false.
