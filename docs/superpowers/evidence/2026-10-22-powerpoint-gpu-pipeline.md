# Drei GPU-Puffer: laufender Prüfbericht

Stand22.10.2026. [Plan](../plans/2026-10-22-powerpoint-gpu-pipeline.md) und
[Entwurf](../specs/2026-10-22-powerpoint-gpu-pipeline-design.md) sind vom Nutzer
freigegeben. Nur isolierte Probe, keine installierte Anwendung verändert,
keine Produktveröffentlichung. Root-Eigenreview, keine unabhängige Zweitprüfung.

**Aktueller Ausgang:** Tasks1–5 bestanden. Die60s-Leistungsabnahme bleibt FAIL:
zuletzt29,495568/29,345591statt jeweils mindestens29,5nachgewiesenen geänderten
Bildern/s. Kein Office-Start, kein Original-Player aktiviert und kein Publish.
Task6/7 sind nicht als vollständig abgeschlossen markiert.

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

## Task3 — Main-only-Protokollclient

25 neue Tests verwenden echte Kindprozess-Pipes und prüfen den Client selbst,
einschließlich fragmentierter und gebündelter Nachrichten, ungültiger Daten,
Timeouts, Warteschlangengrenze, Stop und doppelter Antworten. Initiales RED:
`work/gpu-pipeline-task3-red.log`. Zwei zusätzliche Regressionstests fanden
einen bei voller Queue dauerhaft blockierten Release und eine doppelte
Fehlerbenachrichtigung bei Registrierung während der Zustellung. Beide REDs
in `work/gpu-pipeline-task3-review-red.log`, anschließend korrigiert.

Neue25 plus bestehende49 Node-Tests:74/74 PASS,
`work/gpu-pipeline-task3-node.log`. Echte native Integration PASS:
`work/gpu-pipeline-task3-native.log` und
`work/powerpoint-gpu-probe-OgU1p7/client-observations.json`.
Drei Claims, vierter EMPTY, unverfälschte native Zeitfelder und vorhandene
Leases nach Quellverlust kontrolliert freigegeben. Source-Loss bleibt ein
nichtterminales Ereignis; Protokollfehler bleiben terminal. Keine
Rendererkonfiguration und keine Handles im Page-Kontext.

Vollständige Regression183Dateien/756Tests PASS in237,19s,
`work/gpu-pipeline-task3-unit.log`. Autorreview nach der Review-Checkliste,
keine unabhängige Prüfung und weiterhin keine Kompositions-/FPS-Freigabe.

## Task4 — Lieferkredit getrennt von GPU-Lebensdauer

Elf Broker- und drei API-Grenztests PASS nach beobachtetem RED der fehlenden
Module. Nachweise: `work/gpu-pipeline-task4-red.log`,
`work/gpu-pipeline-task4-managed-red.log`,
`work/gpu-pipeline-task4-components.log`. ACK, Timeout und Revoke erfinden
keine native Freigabe. Verspätete/doppelte Callbacks, Sendfehler, sofortige
Callbacks,100überlappende Pumps und echte500ms-Empfängerfrist sind abgedeckt.
Maximal vier Empfänger/drei Imports/ein Claim; kein gemeinsames Send-Await.

Die Main-only-Bindung nutzt ausschließlich die separat geprüfte
[Electron45-API](https://raw.githubusercontent.com/electron/electron/v45.0.0/docs/api/shared-texture.md),
ohne Transportfallback. Ein Import-Throw bleibt konservativ unklar und hält
den Lease; eine möglicherweise teilweise erstellte Referenz darf nicht
zeitbasiert freigegeben werden. Revoke-Rückkehr ist kein Drain-Nachweis:
der isolierte Supervisor muss den tatsächlichen Zustand prüfen.

88/88 Node-Tests PASS (`work/gpu-pipeline-task4-node.log`), vollständige
Regression183Dateien/756Tests PASS244,88s
(`work/gpu-pipeline-task4-unit.log`). Autorreview, keine unabhängige Prüfung.
Die API-Grenztests ersetzen noch nicht den echten Renderer-/Kompositionsnachweis.

## Task5 — zwei echte geschützte GPU-Ausgaben

Source und53Bit-Sequenzstempel werden im selben WebGL-Pass gezeichnet,
einschließlich Prüfsumme. GPU-Fence vor RenderAck; keinerlei Pixelreadback im
Receiver. Ein unabhängiger Observer erfasst einen einzigen1920×9-Streifen
mit Stempel und unverdeckter Quellbewegungszeile. Nur geänderte Quellhashes
zählen, nicht steigende Stempel. Maximal16Zuordnungen, ein Capture plus Dirty-Bit.

RED fehlender Module/Outputharness beobachtet. Zusätzlicher Autorreview-Test
fand eine ausgefallene Importfreigabe bei VideoFrame.close-Fehler;
`work/gpu-pipeline-task5-release-red.log` und `release-green.log` belegen die
Korrektur durch voneinander unabhängige Cleanup-Schritte.

Echter abschließender Output-Smoke PASS:
`work/gpu-pipeline-task5-output-verified.log`,
`work/powerpoint-gpu-probe-P5qydI/output-report.json`.
Getrennte Renderer,1920×1080, korrekte Kanäle/Toolbar-Crop,4:3-Seitenränder,
Wasserzeichen auch über Schwarz, bewegte Quellbilder, eigener hängender
Empfänger kontrolliert geschlossen, gesunder Empfänger weiter versorgt,
Reconnect erhält aktuellen Stand. Page-require und Page-Electron undefined.
Nach Quellverlust erst Drain und tatsächlich komponierten letzten ACK-Stempel
bestätigt; danach gesamter Bildstreifen unverändert. Keine bloße ACK-Annahme.

Die absichtlich hängende Ausgabe löste eine Electron-Warnung zur Freigabe ihrer
beim Fensterschluss noch vorhandenen Referenz aus. Diese ist Teil dieses
Fehlerfalls, kein normaler Dauerlauf. Beide Generationen regulär drained.
Wide-/Standard-PNGs unter IdcSqz visuell geprüft; roter/blauer Quellbereich,
gelber Bewegungsmarker, schwarze Seitenränder und lesbares TESTBETRIEB korrekt.
Eine zunächst falsche Testpunkt-Erwartung bei x1700 wurde nicht durch andere
Geometrie umgangen: Dieser Punkt liegt bei4:3 korrekt im schwarzen Seitenrand.

107/107 Node-Fälle PASS (`work/gpu-pipeline-task5-node-verified.log`, enthält
bereits fünf vorbereitende Task6-Fälle und wiederholte Stempel-Fälle).
Vollständige Regression183Dateien/756Tests PASS243,86s
(`work/gpu-pipeline-task5-unit.log`). Prüfung durch den Autor, nicht unabhängig.
Diese kurzen Bild-/Fehlerprüfungen belegen noch nicht die60s-Cadence.

## Task6 — gemessene Grenze, keine Freigabe

Vier getrennte60s-Läufe ohne parallele schwere Tests; keine Grenzwerte
verändert. Alle Laufzeiten/Zuordnungen und native Rohzeitfelder stehen in
den jeweiligen `benchmark-report.json` unter `work/powerpoint-gpu-probe-*`.
Dies sind aufeinanderfolgende Einzelmessungen, kein allgemeines
Leistungsversprechen und keine30Hz-Freigabe.

| Artefaktordner | MAIN geänderte Bilder/s | Mirror geänderte Bilder/s | Gepaarte / ungepaarte Bilder | p95Versatz | Ergebnis |
| --- | ---: | ---: | ---: | ---: | --- |
| TuVJP4 | 19,616052 | 19,682717 | 1150 / 58 | 10,902ms | FAIL |
| 6vrsRD | 24,061199 | 24,111188 | 1431 / 29 | 13,7651ms | FAIL |
| 80mTji | 27,332921 | 27,582917 | 1623 / 49 | 15,186ms | FAIL |
| SavMho | 29,495568 | 29,345591 | 1736 / 59 | 16,1681ms | FAIL |

Die letzte Messung dauerte60009,0153ms. MAIN1770, Mirror1761 unabhängig
beobachtete geänderte Quellbilder; größte Lücken70,2492/74,0813ms.
**Auch29,495568 ist kleiner als29,5 und wird nicht auf PASS gerundet.**
Gute Lücken-/Versatzwerte ersetzen nicht die fehlende Bildrate beider Outputs.

### Diagnose und begrenzte Änderungen

Der native Client claimte je Lauf1811Frames einschließlich Vor-/Nachlauf.
In der profilierten Phase bestätigten beide Renderer1800Zeichenvorgänge
innerhalb der Messzeit. Dennoch enthielten358/353der1810/1805Bildaufnahmen
einen bereits gesehenen Stempel. Kein unbekannter Stempel, kein unveränderter
Quellhash bei neuem Stempel in diesem Lauf. Die Lieferung allein ist daher
nicht der fehlende Nachweis; die Kompositions-/Beobachtungsgrenze bleibt
entscheidend. Daraus folgt ausdrücklich nicht, dass30Bilder/s sichtbar waren.

Observerkosten und Gründe für nicht gezählte Bilder werden nun getrennt
erfasst. Tests dafür zuerst RED, dann GREEN:
`work/gpu-pipeline-task6-{cost,counters}-{red,green}.log`.
Weitere Änderung innerhalb derselben Drei-Textur-Probe: unabhängiger,
RAF-geplanter Beobachtungshinweis statt sofortiger Aufnahme beim RenderAck.
Nur ein Hinweis outstanding; Main gibt ausschließlich Beobachtungskredit
zurück. Eine weitere RAF-Vorbereitung und ein neuester fertiger Schlüssel
dürfen parallel zur Aufnahme bestehen, keine Pixel-/Frame-FIFO. FrameKey ist
weiterhin der einzige IPC-Inhalt. Hint und ACK beweisen keine Komposition und
geben niemals native Slots frei. Sichtbare Pixel bleiben die einzige Abnahme.
Tests mit100weiterlaufenden RenderAck bei nur einem offenen Hinweis sowie
überlappender Vorbereitung zuerst RED, dann GREEN;110Node-Fälle bestanden.

Damit sanken im letzten Lauf die alten Stempel auf31/40, die Abnahme ist
dennoch nicht erfüllt. Keine vierte Transportarchitektur ergänzt und keine
PowerPoint-Phase gestartet. Ein weiterer Ansatz braucht eine neu bewertete
Beobachtungs-/Kompositionsstrategie, nicht andere PASS-Kriterien.

### Uhren und Lebensdauer

Jeweils drei Clock-Roundtrips vor/nach dem Lauf, minimale RTT ausgewertet.
Zuletzt Drift0,0724ms, Unsicherheit0,2569ms. Der bekannte zukünftige
WGC-sourceReportedQpc bleibt unverändert als Diagnose erhalten;
`sourceLatencyAvailable:false`. Keine negative oder korrigierte Quelllatenz.
Alle normalen Messläufe endeten native `drained:true`, Exit0, ohne
aufgezeichneten Runtimefehler.

Autorreview fand trotzdem eine Cleanup-Warnung beim normalen Fensterschluss:
Der Controller zerstörte einen noch gesunden Receiver zu früh. Der eigene
`--drain-only`-Test hält eine echte Importreferenz150ms, während die Quelle
weiterläuft; er reproduzierte die Warnung
(`work/gpu-pipeline-task6-drain-red.log`). Jetzt wird neue Arbeit widerrufen,
aber der gesunde Receiver erst **nach echtem Broker-Drain** zerstört.
Keine Freigabe durch ACK oder Timeout. GREEN:
`work/gpu-pipeline-task6-drain-green.log`, Ordner `cbSzev`, ohne Dangling-Warnung.
Vollständiger eigener Output-Smoke anschließend PASS, Ordner `xCV1J5`;
absichtlich hängende/geschlossene Testempfänger bleiben getrennte Fehlerfälle.

### Weitere Regression, noch keine Gesamtfertigstellung

Desktop-Build PASS13,93s; Web-Build PASS11,77s;
Browser-Smoke5/5PASS; native UI-Prüfungen für Desktop-Selektion,
Meldungsdesigns und17Sprachvarianten PASS. Logs:
`work/gpu-pipeline-final-{build,build-web,web-tests,native-ui}.log`.
Bekannte große Bundle-/Entwicklungs-CSP-/NO_COLOR-Warnungen nicht behoben.
Dies bestätigt weder vollständige regionale Prosa noch Original-PowerPoint.
Nach dem letzten Cleanup110/110Node-Fälle PASS
(`work/gpu-pipeline-task6-node-final.log`) und vollständige
Anwendungsregression183Dateien/756Tests PASS243,70s
(`work/gpu-pipeline-task6-unit-final.log`). Das schließt die fehlende
Leistungs-/Office-/Supervisorabnahme nicht ein; Task6/7 bleiben ausdrücklich offen.

Weitere native Regressionen abschließend seriell PASS: Slots
(`work/gpu-pipeline-final-slots.log`, `ozHmMq`), erweiterter Producer mit
Owner-/Replay-/Resize-/Minimize-Fällen und GPU-Musterprüfung
(`final-producer.log`, `whXtcS`), alter10000Full-HD-Frame-Ring
(`final-ring.log`, `NnHMV7`), Reader (`final-reader.log`, `4f1SM0`) und
WGC-Capture wide/standard (`final-capture.log`, `kOqBND`). Alle genannten
Logs unter `work/gpu-pipeline-*`. Produktmanifest/Lockfile unverändert:
0.85.0 und installierte Electron37.10.3; fremde startup-diagnostic-Datei
unverändert und nicht gestaged. Keine eigene GPU-Probe mehr aktiv.

Abschließendes Autorreview: READY/Claim-Versionen, Kredit versus GPU-Referenzen,
Rückstau, tatsächlicher Pixelnachweis und zukünftige Quellzeiten geprüft.
Wichtige Cleanup- und Beobachtungskopplungsbefunde sind mit RED→GREEN behandelt;
die Bildrate bleibt trotzdem FAIL. Nicht als geprüft ausgegeben werden die
gesperrte Office-Phase, harte Helper-Tod-Wiederherstellung und Produktintegration.
Keine unabhängige Review-Delegation. Dieser Commit ist ein geprüfter
Zwischenstand mit gemessener Grenze, kein vollständiger Planabschluss.

## Offen

Task6–7 sind nicht vollständig: belastbare60s-Cadence-Abnahme beider Outputs,
Office-Adapter/-Befehle, kompletter harter Helper-Tod-/Handle-Supervisor,
restliche Lebensdauerfälle und vollständige Gesamtabschlussprüfung.
Statische GPU-/Kompositionsprüfungen sind bestanden, die Leistungsabnahme nicht.
Produktintegration, Originalaudio, Runtime-Upgrade und vollständige Regionaltexte
bleiben eigene Releasebedingungen. `productionReady` bleibt false.
