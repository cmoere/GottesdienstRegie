# PowerPoint: drei begrenzte GPU-Puffer mit unabhängiger Ausgabe

Status: Der Nutzer hat diesen schriftlichen Entwurf am22.10.2026 nach Vorlage
mit „ja“ bestätigt. Der daraus erstellte [Umsetzungsplan](../plans/2026-10-22-powerpoint-gpu-pipeline.md)
wurde anschließend ebenfalls mit „ja“ freigegeben. Die isolierte Umsetzung hat
begonnen; kein Produkt-Upgrade ist damit freigegeben. Native Umsetzung durch den
Hauptagenten; keine Programmierungs-/Review-Delegation.

## Ziel und Umfang

Die originalgetreue PowerPoint-Wiedergabe soll echte Animationen, Übergänge und
Zeiten behalten. Untersucht wird zunächst ausschließlich die technische
GPU-Aufnahme/-Verteilung in einer separaten Probe. Keine Produktintegration,
Versionsanhebung, Installation, Audio-/Monitoränderung, Veröffentlichung oder
automatische Übernahme von Electron45 in GottesdienstRegie.

Die vom Nutzer erlaubte separate Laufzeit Electron45.0.0 mit bereits geprüfter
Archiv-Prüfsumme wird weiterverwendet. Die installierte Laufzeit bleibt37.10.3.
Keine neue npm-/N-API-Abhängigkeit, kein weiterer Runtime-Download. Nur vorhandene
VS/SDK-Werkzeuge. Quellcode aus den bisherigen work/-Experimenten ist kein
freigegebener Produktcode; neue Module werden nach dem freizugebenden Plan mit
eigenen Tests aufgebaut.

### Ausgangspunkt und offene Befunde

[Messbericht](../evidence/2026-10-22-gpu-transfer-feasibility.md): Externe
1920×1080-D3D11-Texturen lassen sich in zwei geschützten Ausgaben darstellen und
freigeben. Die serielle bewegte Probe erreicht zuletzt19,079 statt mindestens
29,5 sichtbarer Quellbilder/s; alle1145Bildstände sind zwischen den Ausgaben
gepaart, p95Versatz22,905ms. Sie bleibt FAIL.

Die Abfolge Aufnahme → zwei Ausgaben → Kompositionsprüfung → Freigabe erzeugt
serielle Wartezeit. Drei Puffer können unabhängige Arbeit ermöglichen; dass dies
die geforderte Leistung tatsächlich erreicht, ist eine zu prüfende Hypothese.
Die gescheiterte WGC-Frame-Zwischenspeicherung wird nicht übernommen. Ihre genaue
Blockierungsursache ist ungeklärt. Ebenfalls ungeklärt: WGC-Quellzeitstempel lagen
16–29ms vor dem gleichzeitig gemessenen nativen Publikationszeitpunkt. Daraus
wird keine Quelllatenz abgeleitet.

### Alternativen

1. **Gewählt:** Drei native GPU-Ziele, neuester sicher verfügbarer Frame,
   unabhängige Empfänger und Messbeobachtung. Mehr explizite Ressourcenlogik,
   aber keine absichtliche Auflösungssenkung oder zusätzliche Videokodierung.
2. Ein-Textur-Verfahren weiter seriell betreiben: einfacher, unterschreitet
   jedoch die bisherige Abnahme. Kein veröffentlichungsfähiger Ersatz.
3. Eigener kompletter nativer Output-Compositor: könnte andere Transportgrenzen
   vermeiden, würde aber Websites, Videos, Banner, Overlays und Recording neu
   koppeln. Nicht Bestandteil dieses begrenzten Vorhabens.

## Komponenten und Verträge

Vier voneinander prüfbare Komponenten:

- `GpuCaptureProducer`: ausschließlich eigene bestätigte Quelle, Zuschnitt,
  Letterbox, drei Texturen und deren native Zustände. Kein Output-Renderer.
- `GpuFrameBroker`: Main-interne Sitzungs-/Empfängerprüfung, Frame-Claim,
  Electron-Import und Freigabe. Keine Office-Steuerlogik.
- `GpuOutputReceiver`: begrenzter isolierter Preload zum Zeichnen und Schließen
  von VideoFrame/Import. Kein Zugriff auf Quellfenster oder native Handles.
- `ComposedFrameObserver`: nur in der Probe; beobachtet tatsächliche Komposition
  unabhängig vom Liefer-ACK. Messung kann keinen Quellslot freigeben.

Die bestehende COM-Probe bleibt für Originaldatei, eigene Show, Klicks, Pause,
Fortsetzung und Zeiten verantwortlich. SELECTED steuert niemals die laufende
Show; neue Ausgaben starten keine zweite Show. Audio bleibt unsupported.

## Drei GPU-Ziele und Eigentum

Genau drei1920×1080BGRA8-Zieltexturen, jeweils8.294.400Pixelbytes; zusammen
24.883.200Bytes Ziel-Pixeldaten. Das ist **kein** Gesamt-VRAM-Limit: WGC-Pool,
Renderziele der Ausgaben und Chromium-interne GPU-Kopien kommen hinzu und werden
separat begrenzt/beobachtet. Keine Behauptung universellen Zero-Copy-Verhaltens.

| Zustand | Native Bedeutung | Überschreiben erlaubt? |
| --- | --- | --- |
| FREE | kein offener GPU-Schreibvorgang oder Import-Claim | ja |
| WRITING | Aufnahme/Kopie noch nicht GPU-bestätigt | nein |
| READY | GPU-Kopie abgeschlossen, noch kein Import-Claim | nur durch Producer-Reclaim |
| LEASED | Main hat genau diese Slot-Version bestätigt | niemals vor echter Freigabe |

Zustände und Slot-Versionen werden ausschließlich auf einem nativen Producer-
Worker geändert. Jeder veröffentlichte Frame hat eine sichere monotone Sequenz
und einen Schlüssel `{sessionId,generation,slotId,sequence}`; slotId ist0..2,
Sequenzen überschreiten niemals Number.MAX_SAFE_INTEGER. Keine ABA-Auflösung
allein über die Slotnummer. Session und Generation sind neue128-Bit-Tokens.

Die Aufnahme läuft nominell30Hz unabhängig vom Versand. Sind keine freien Ziele
verfügbar, darf der Producer einen **nicht geleasten** älteren READY-Slot
verwerfen. Sind alle Ziele WRITING/LEASED, wird ein Quellframe ausgelassen, nicht
die bestehende Textur überschrieben, blockierend gewartet oder ein vierter Slot
angelegt. „Neuester Stand“ ist eine Ersetzungsregel, keine FIFO-Warteschlange.

### Claim vor Import

Ein READY-Angebot ist noch keine Zugriffserlaubnis: Es könnte zwischen
Benachrichtigung und Verwendung durch einen neueren Frame ersetzt worden sein.
Main fordert deshalb `claimLatest` an. Der native Worker wählt atomar den dann
neuesten READY-Frame und setzt ihn vor Antwort auf LEASED. Erst die passende
Claim-Antwort erlaubt den Import des zugehörigen Handles. Leere Menge liefert
EMPTY; alte oder wiederholte Claim-/Release-Tokens werden abgelehnt.

Ein Slot ist für die genau beim Claim ausgewählten, lieferbereiten Empfänger
geleast. Weitere Empfänger werden nicht nachträglich an einen bereits
freigegebenen Import angehängt. Ein neu geöffnetes Fenster bekommt beim nächsten
sicheren Claim den neuesten Stand, niemals einen alten Start-Frame.

### Ein Worker für WGC und D3D

FrameArrived/Closed-Callbacks signalisieren nur ein Ereignis. Ein nativer
Producer-Worker besitzt Framepool-Zugriffe, D3D-Kontext, Zustand und Freigaben.
Der Steuerkanal führt keine WGC-/D3D-Operation im Pipe-Lesethread aus. Keine
threadübergreifende Aufbewahrung eines WGC-Frames wie im gescheiterten Versuch.

Ein aktiver WGC-Frame darf auf diesem Worker nur bis zum bestätigten Abschluss
seiner GPU-Kopie leben; diese kurzen WRITING-Leases sind ebenfalls auf drei
begrenzt. GPU-Abschluss wird ohne blockierende Warteschleife pro Bild geprüft.
Danach WGC-Frame schließen und READY veröffentlichen. Keine staging-Textur,
Map/Unmap-Readbacks oder vollständigen Pixelarrays auf dem Transportpfad.

## Native Grenze und Zugriffsschutz

Nur eigene, vom Testcontroller bestätigte HWND/PID/Prozessstartzeit und feste
Crop-Geometrie. Wiederverwendete HWNDs, falsche Prozessidentität, Größenwechsel,
Minimierung und Quellverlust widerrufen die Quelle. Keine Fenstertitel-Suche,
Desktop-Erfassung, Fremddatei oder pauschale Office-Prozessbeendigung.

Private Startkonfiguration bindet Protokollversion, Session/Generation und den
eigenen empfangenden Main-Prozess einschließlich Prozessstartzeit. NT-Handles
sind unbenannt, nicht vererbbar und werden nur in diesen bestätigten Prozess
dupliziert. Keine nativen IDs/Handles, Pfade oder beliebigen Invoke-Befehle im
Output-Page-Kontext. Native64-Bit-Werte bleiben Strings/Buffer, nie JS-Number.

Metadaten enthalten feste Bildmaße/Format, Slot-Version und getrennt benannte
Zeitfelder; vor Nutzung werden Länge, Wertebereich, Identität und erwarteter
Zustand geprüft. Eingehende Befehle maximal1024Bytes, ausgehende Metadaten
maximal2048Bytes, Steuerwarteschlange maximal16Einträge. READY-Benachrichtigung
ist koalesziert: höchstens eine unbestätigte Meldung, weitere Änderungen setzen
nur ein Dirty-Bit. Keine Folge alter Angebote im IPC-Rückstau.

Pipe-Lesen/-Schreiben sind vom Producer getrennt. Ein voller Ausgabekanal darf
den GPU-Worker nicht blockieren. Sitzungsende beendet die eigenen Threads und
Handles; Protokollbruch stoppt die Generation, nicht die gesamte Anwendung.

## Versand, Rückstau und echte GPU-Freigabe

Main registriert höchstens vier eigene WebContents anhand wirklicher Identität.
Je Abnehmer maximal eine noch nicht bestätigte Lieferung; keine Bildwarteschlange
pro Fenster. Busy-Empfänger werden bei neuen Claims ausgelassen. Ein langsamer
Mirror hält den gesunden MAIN-Pfad nicht künstlich in einem gemeinsamen Await.
Metadaten-/ACK-Ereignisse werden direkt zugestellt, keine2-ms-Polling-Abfragen.

Main importiert nur erfolgreich geclaimte Texturen über die verwaltete
Electron45-sharedTexture-API. Die bei diesem Claim freien Empfänger erhalten
diesen Import; Renderer-Sandbox und Context-Isolation bleiben aktiv. Jeder
Receiver erzeugt daraus seinen VideoFrame, zeichnet in ein eigenes GPU-Ziel
und schließt Frame sowie Import-Referenz auch im Fehlerpfad.

Ein `RenderAck` nach GPU-Renderbestätigung gibt nur den Lieferkredit dieses
Empfängers zurück. Es beweist **nicht** die sichtbare Komposition und darf
**keinen** nativen Slot freigeben. Auch erfolgreiche sendSharedTexture-Promises
beweisen keine Anzeige oder Freigabe.

Main lässt nach Abschluss der vorgesehenen Sends seine Import-Referenz los.
Nur die zur exakten Claim-Version gehörende `allReferencesReleased`-Rückmeldung
darf einen nativen Release veranlassen. Der native Worker prüft nochmals
Session/Generation/Slot/Sequenz und LEASED. Veraltete ACKs und doppelte Callback-
Zustellung verändern keinen neuen Slot. Ausbleibender Callback ist ein Fehler,
niemals eine Erlaubnis zum zeitbasierten Überschreiben.

Ein Renderer schließt seine Referenzen, sobald seine eigene GPU-Verarbeitung
sie nicht mehr benötigt. Das bereits gezeichnete Ausgabebild gehört anschließend
seinem Renderziel. Die spätere Bildbeobachtung benötigt keine Quellreferenz und
darf deshalb die Wiederverwendung nicht seriell blockieren.

## Unabhängige Kompositionsprüfung

RenderAck und sichtbarer Nachweis bleiben verschiedene Messereignisse. Die Probe
zeichnet Sequenzstempel und Quellbild **im selben WebGL-Ausgabepass**; ein separat
fortgezähltes DOM-Etikett genügt nicht. Der diagnostische Stempel liegt direkt
oberhalb der geprüften Bewegungszeile, sodass eine einzelne schmale komponierte
Aufnahme beide enthält. Keine zwei zeitlich unabhängigen Screenshots als
angeblich atomarer Bildnachweis.

Der53-Bit-Sequenzstempel verwendet getrennte32-/21-Bit-Werte statt eines
präzisionsarmen einzelnen GLSL-float. Session-/Generationswechsel setzen die
Observer-Zuordnung kontrolliert zurück; Bilder einer alten Ausgabe dürfen
keine gleich nummerierte Sequenz einer neuen Generation bestätigen.

Je Ausgabe höchstens eine Observer-Anfrage gleichzeitig, keine Observer-FIFO.
Nach Abschluss wird bei neuem Stand erneut beobachtet. Der Stempel wird aus den
tatsächlich komponierten Pixeln dekodiert und einer bekannten Session-/Sequenz
zugeordnet; nur ein veränderter Quellpixel-Hash zählt als Bewegung. Stempel-
Änderungen allein zählen nicht. Maximal16kurze Framebeschreibungen/Hashes je
Messabnehmer; keine unbeschränkte Historie kompletter Bilder.

Die Beobachtung ist asynchron zum Lieferkredit und zum Producer. Langsame
Beobachtung darf keine höhere Bildrate vortäuschen: nicht nachgewiesene Frames
bleiben ungezählt. Erreicht die tatsächliche Kompositionsbeobachtung die Grenze
nicht, lautet das Ergebnis FAIL/UNPROVEN – kein Ersatz durch RenderAck-Zahlen.
Statische vollständige Bilder prüfen zusätzlich Größe, Kanalordnung, Crop,
Letterbox und TESTBETRIEB über Schwarz. Diagnosemarker gehören niemals ins
Produkt oder eine Besucherpräsentation.

## Uhren und PowerPoint-Befehle

Native Metadaten trennen `sourceReportedQpc` (ungeprüfte WGC-Angabe),
`acquiredQpc` (eigene QPC-Messung beim Übernehmen des Frames) und `copyDoneQpc`
(eigene QPC-Messung nach GPU-Abschluss). Keine Umbenennung einer Publikationszeit
in eine vermeintliche Aufnahmezeit. Frequenz, Monotonie und Reihenfolge werden
geprüft. Der bekannte WGC-Widerspruch wird diagnostiziert, nicht herausgerechnet.

Main/QPC-Kalibrierung: drei Roundtrips vor/nach Lauf, minimale RTT und Unsicherheit
protokollieren, Drift prüfen. Nicht vergleichbare Zeitwerte führen zu ausdrücklich
unverfügbaren Quelllatenzen. Erst unabhängig aufgeklärte WGC-Zeitsemantik erlaubt
eine Aussage zur tatsächlichen Quelle-bis-Ausgabe-Latenz; das bleibt ein
zusätzliches Produktionsgate.

Cadence, MAIN/Mirror-Versatz und Befehl-bis-sichtbar verwenden dieselbe monotone
Main-Messuhr. Kompositionsbilder werden Sequenzen zugeordnet, nicht ungesehenen
Native-ACKs. Nach bestandenem bewegtem Win32-Test: eigene PowerPoint-Datei mit
Originalanimationen und Zeiten, Pause/Fortsetzen und Sentinel testen. Mindestens
60reguläre Klick-/Wechselbefehle mit unabhängig sichtbaren erwarteten Änderungen;
fehlende Änderung ist Gesamt-FAIL. Keine automatische Office-Phase bei zuvor
fehlgeschlagener Transportprüfung.

## Fehler und begrenzte Lebensdauer

500ms ohne gültige Lieferbestätigung trennt nur den betroffenen Probe-Abnehmer.
Ein Pin auf einer Quelltextur wird dabei nicht einfach gelöscht. Die übrigen
freien Slots bleiben verwendbar; bei Erschöpfung wird Aufnahme ausgelassen und
der Zustand als Fehler ausgewiesen. Eigene hängende Probe-Fenster dürfen gezielt
beendet werden, um ihre tatsächlichen GPU-Referenzen freizugeben. Das ist keine
freigegebene Produktions-Fensterwiederherstellung und kein erfolgreiches Ergebnis
eines normalen Zweiausgaben-Dauerlaufs.

Bei kooperativem Quellverlust bleibt das letzte gültige Bild im eigenen
Output-Renderziel erhalten, Systemoverlay/Fehlerstatus liegen darüber. Quelle
wird nicht still neu gestartet. Generationswechsel verwirft Angebote und alte
ACKs; freigegeben wird weiterhin nur nach wirklichem Referenzende. Ein Import
der alten Generation darf nie einer neuen Slot-Version zugeordnet werden.

Besondere Probe-Grenze: Bei hartem Tod des nativen Helpers können seine in Main
duplizierten Originalhandles nicht durch bloßes JS-Release geschlossen werden.
Die separate Probe beendet dann ihren eigenen Electron-Main samt eigenen
Outputs; das OS schließt dessen Handles. Supervisor prüft alle eigenen Prozesse.
Keine Wiederaufnahme in demselben Main nach ungeklärter Handle-Identität.
Ein zukünftiges Produkt benötigt dafür separat geprüfte native Handle-Verwaltung;
dieses Problem wird weder verschwiegen noch mit willkürlichem Close fremder
Handlewerte gelöst. Keine solche neue Produktabhängigkeit in dieser Probe.

## Abnahme und nächste Freigabe

1. Deterministische Zustands-/Protokolltests: drei Slots, Claim/Reclaim-Rennen,
   Claim nur auf READY, keine Wiederverwendung bei GPU-Pin, alte Generation,
   ungültige Größen/Handles, doppelte Freigabe, volle Queues und vier/fünf Clients.
2. Native GPU-Prüfung mit schnellen/absichtlich langsamen Empfängern: jeweils
   eigene Quellbilder mit eindeutigen Bildmustern, niemals gemischte Slot-Versionen.
   Import-/Handle-/Frame-Ressourcen nach regulärem Stop vollständig freigeben.
3. Tatsächliche zwei getrennte geschützte Renderer; komponierte Bildprüfung,
   neue Ausgabe erhält aktuellen Stand, Overlays bleiben auf Bild/Schwarz sichtbar.
4. Separates Warm-up höchstens10Sekunden; danach mindestens60Sekunden1920×1080
   bewegte Quelle, jeder Abnehmer mindestens29,5nachgewiesene geänderte Quellbilder/s,
   keine Lücke größer150ms, p95MAIN/Mirror höchstens150ms. Alle Rohdaten,
   gepaarte/ungepaarte Bilder und Messkosten berichten. Keine schweren Paralleltests.
5. Nur anschließend eigene PowerPoint-Phase: dieselbe Dauer/Cadence, mindestens
   60Befehle, p95Befehl-bis-sichtbar höchstens250ms, byteidentisches Original/
   Sentinel und unveränderte Saved-Zustände. Audio weiterhin gesondert gesperrt.
6. Fehlerfälle: HWND/PID-Reuse, Resize/Minimize, Quellschluss, Helper-Absturz,
   stalled/geschlossener Empfänger, Reconnect, alte Callbacks und GPU-Freigabe
   während Stop. Kein Source-Capture außerhalb der bestätigten eigenen Fenster.
7. Bereits vorhandene App-/Browser-/Native-Regressionen getrennt von Messläufen.
   Autor-Eigenreview ausdrücklich schwächer als unabhängige Prüfung; nur
   Übersetzungsdelegation bleibt erlaubt. Ungeklärte Uhren/Handle-Wiederherstellung
   erlauben trotz einzelner Leistungs-PASS keine Produktfreigabe.

Dieser Entwurf lockert keine bestehenden Freigabewerte. Bei Fehlschlag konkrete
Grenze berichten und keine vereinfachte Ersatzwiedergabe einschalten. Produkt-
Runtime-Upgrade, Original-Audio, komplette Hybridimport-Integration und die
vollständigen Regionaltexte bleiben eigene offene Release-Bedingungen. Kein
v86-Publish aus diesem Probeentwurf.

## Quellen und Überprüfung

- [Lokale GPU-Messungen und Grenzen](../evidence/2026-10-22-gpu-transfer-feasibility.md)
- [Vorgängerentwurf: Rohbildtransport](2026-10-22-powerpoint-frame-transport-design.md)
- [Electron45: verwaltete sharedTexture-API](https://raw.githubusercontent.com/electron/electron/v45.0.0/docs/api/shared-texture.md)
- [Electron45: Prozesshandles, SyncTokens und Referenzende](https://raw.githubusercontent.com/electron/electron/v45.0.0/shell/common/api/shared_texture/README.md)

Die Quellen definieren API-Verträge, nicht den Nachweis dieses neuen Aufbaus.
Eigenprüfung vor Vorlage: Slot-/Claim-Zustände, RenderAck vs Freigabe vs sichtbare
Beobachtung, Observer-Rückstau, Handle-Absturzgrenze und unveränderte Abnahme
aufeinander abgestimmt. Der freigegebene Umsetzungsplan wird ausgeführt;
[Prüfstand](../evidence/2026-10-22-powerpoint-gpu-pipeline.md) trennt erledigte
Zustandstests von weiterhin offenen GPU-/PowerPoint-Nachweisen.
