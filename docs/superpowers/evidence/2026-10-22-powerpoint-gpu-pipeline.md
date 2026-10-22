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

## Offen

Task2–7 sind nicht vollständig: echter GPU-Produzent/Pixelmuster,
Main-only-Client, unabhängige Empfänger/Freigaben, tatsächliche Komposition,
60s-Cadence, Office-Befehle, Fehler-/Handle-Lebensdauer und Gesamtregression.
Zustandstests allein belegen weder GPU-Transport noch Original-PowerPoint.
Produktintegration, Originalaudio, Runtime-Upgrade und vollständige Regionaltexte
bleiben eigene Releasebedingungen. `productionReady` bleibt false.
