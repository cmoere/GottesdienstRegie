# PowerPoint: begrenzte native Bildverteilung statt doppelter Videokodierung

Status: Entwurf zur Nutzerprüfung, keine Implementierungsfreigabe. Der Nutzer
hat am 22.10.2026 die Fortsetzung nach dem Vorschlag einer grundlegenden
Überarbeitung verlangt. Das bestätigt die Untersuchung und den Entwurf, nicht
bereits diesen neuen technischen Vertrag oder dessen ungeprüfte Leistungsfähigkeit.

## Ziel und unveränderte Anforderungen

PowerPoint führt weiterhin die echte Originalpräsentation mit ihren regulären
Klickanimationen, Übergängen und Zeiten aus. GottesdienstRegie stellt das Bild
in seiner bestehenden Output-Komposition dar. Kein Videoexport, kein nativer
Nachbau der Originalanimationen und kein sichtbares Office-Fenster über MAIN.
Die getrennte bearbeitbare Kopie bleibt Bestandteil des Hybridimport-Plans.

Dieser Entwurf ersetzt ausschließlich den Capture-/Verteilungsteil des
[Hybridimport-Entwurfs vom 20.10.2026](2026-10-20-powerpoint-hybrid-import-design.md).
Import, Dokumentrevisionen, Office-Steuerung, Audio-Sperre und Live-Autorisierung
bleiben unverändert. Der bisherige [Umsetzungsplan](../plans/2026-10-20-powerpoint-hybrid-import.md)
ist für Aufgaben 1 und 7 entsprechend zu ergänzen, nicht pauschal abzuhaken.

Die Programmierung erfolgt durch den Hauptagenten. Nur Übersetzungsarbeit darf
delegiert werden. Keine Produktabhängigkeit, Electron-Aktualisierung oder Änderung
von Audio-/Monitorvoreinstellungen ist durch diesen Entwurf freigegeben.

## Nachgewiesener Ausgangspunkt

Die lokalen Befunde stehen in der
[Capture-Evidenz](../evidence/2026-10-21-powerpoint-capture-blocker.md):

- Die isolierte Office-Steuerung beherrscht zwei Klickschritte, Pause/Fortsetzung
  und den zeitgesteuerten Wechsel der eigenen Testdatei.
- Ein statischer 60-Sekunden-Lauf erreicht 50 ms p95 MAIN/Vorschau-Versatz,
  aber 401 ms p95 Befehl bis sichtbares Bild statt höchstens 250 ms.
- Beim bewegten Marker liefert die Quelle etwa 25 Bilder/s; beide kodierten
  Empfänger erhalten nur etwa 11 Bilder/s. Ein späterer Wechsel verfehlt sogar
  die bestehende Zwei-Sekunden-Beobachtungsfrist.
- Das lokal verwendete VP8-Verfahren kodiert getrennt für beide Empfänger.
  Das macht die Kodierungsgrenze zu einem sinnvollen Untersuchungsziel, beweist
  aber noch nicht, dass ihre Entfernung die gesamte Verzögerung behebt.

Installierte VS2022-BuildTools mit C++-Werkzeugen und Windows-SDK 10.0.26100.0
wurden nur lesend erkannt. Ein nativer Capture-Build ist noch nicht nachgewiesen.
Electron37 bietet laut installierten Typen keinen fertigen Renderer-Import der
Offscreen-Shared-Texture-Handles. Ein solcher Import wird nicht vorausgesetzt.

## Betrachtete Ansätze

1. **Empfohlen: native Fensteraufnahme plus begrenzte Rohbildverteilung.**
   Ein Windows-Helfer erfasst nur das eigene Show-Fenster. Ein gemeinsamer
   Speicher hält höchstens drei vollständig abgeschlossene Frames. Ein
   Main-Prozess-Broker verteilt nur den jeweils neuesten gültigen Frame an
   autorisierte Ausgaben. Keine Videokodierer, Decoder oder Jitterpuffer.
   Risiko: GPU-Readback und Speicher-/IPC-Kopien müssen die Leistungsprüfung
   bestehen; 1080p-BGRA mit 30 fps entspricht bereits rund 249 MB/s pro Bildpfad.
2. **Bisheriges WebRTC weiter optimieren.** Weniger neuer nativer Code, aber die
   bisherigen Messungen beweisen keine zuverlässige Bildrate oder Latenz.
   Weitere Codec-/Pufferexperimente sind keine Freigabe und nicht der gewählte Weg.
3. **GPU-Texturen direkt in Electron importieren.** Könnte Kopien reduzieren,
   benötigt hier jedoch zusätzliche, noch nicht geprüfte native Integration oder
   eine Electron-Änderung. Das wird nicht stillschweigend Teil dieses Vorhabens.

## Aufnahme und Besitz

Die vorhandene COM-Steuerung bleibt für Präsentationsbefehle zuständig. Ein
separater C++/WinRT-Helfer verwendet Windows Graphics Capture mit
`CreateForWindow` und einem `CreateFreeThreaded`-Framepool. Er erhält ausschließlich
die vom Main-Prozess bestätigte Fensteridentität der verwalteten Sitzung.

Vor Start und nach einem Fensterwechsel prüft die Main-Seite Sitzung,
Generation, HWND, PID, Prozessstartzeit und die vom Office-Helfer bestätigte
Quelldatei. Ein wiederverwendetes HWND oder ein Fenster ohne gültige Zuordnung
darf nicht aufgenommen werden. Kein Desktop-/Monitor-Capture, keine Auflösung
über Fenstertitel und keine Renderer-Eingabe beliebiger Handles oder Pfade.

Zunächst werden ausschließlich eigene Testdateien verwendet; die bestehende
Erlaubnis für ein isoliertes Testfenster auf Monitor1 gilt weiter. Das ist noch
kein Nachweis einer unauffälligen Produktionsquelle. Minimierung, Überdeckung,
Sperrbildschirm und Fensterverlust werden gesondert geprüft. Eine Quelle, die
nur als störendes sichtbares Office-Fenster zuverlässig funktioniert, erfüllt
die Produktionsfreigabe nicht.

## Bildvertrag und begrenzter Transport

Der Helfer erzeugt fertig zugeschnittene, proportional eingebettete 1920×1080-
Frames in BGRA8 mit höchstens 30 Veröffentlichungen/s. Seitenverhältnis und
Letterboxing bleiben erhalten. Fensterrahmen und Operator-Flächen gehören
nicht zum öffentlichen Inhalt. Kein Stretching einer 16:9-Folie auf die
unterschiedliche Clientfläche eines Office-Fensters.

Ein sitzungsgebundener Shared-Memory-Ring umfasst genau drei Slots. Pro Slot
sind nur Protokollversion, Sitzung/Generation, Sequenz, monotone Aufnahmezeit,
Breite, Höhe, Stride, Byteanzahl und die begrenzten Pixelbytes zulässig. Maximal
8.294.400 Pixelbytes je Slot; Größen und Multiplikationen werden vor Zugriff
überlaufssicher geprüft. Veröffentlichung erst nach vollständig geschriebenem
Frame. Ein Reader kopiert einen konsistenten Slot unter atomarer Versionsprüfung;
bei parallel überschriebener Version verwirft er den Versuch, statt Teilbilder
darzustellen. Die unabhängige Ringprüfung wird auch unter Schreiblast getestet.

Mappingnamen und Steuerkanäle sind nicht erratbare, pro Sitzung neue interne
Fähigkeiten mit Windows-Zugriffsschutz für das aktuelle Benutzerkonto und SYSTEM.
Kein global beschreibbarer Mappingname. Ein neuer Helper erhält keine alte
Sitzung allein wegen eines gleichen Namens. Main bestätigt Protokollversion,
Generation und Start-Handshake vor einer Frame-Lieferung.

Nur Main beziehungsweise ein eigens von Main gestarteter Broker lädt den
begrenzten nativen Reader. Renderer laden keine nativen Module, öffnen keinen
gemeinsamen Speicher und bekommen weder Mappingnamen noch native Kennungen.
Die bestehende Context-Isolation und Renderer-Sandbox werden nicht abgesenkt.

Main gibt pro registriertem Ausgabe-WebContents höchstens einen Frame frei,
solange der vorherige nicht bestätigt oder verworfen wurde. Weitere Frames
werden ersetzt, nicht aufgereiht. Alte Frames und falsche Generationen werden
verworfen. Keine Base64-/PNG-/JSON-Pixelserialisierung, keine Dateischreibschleife
und keine Bildbytes im allgemeinen Live-Zustand. Maximal vier gleichzeitige
Bildabnehmer; zusätzliche Anforderungen werden im Operator als nicht verfügbar
gemeldet. Kompakte Steuerzustände bleiben getrennt von Pixelpaketen.

Die Übertragung der begrenzten Binärdaten über die bestehende Electron-Grenze
und ihre tatsächlichen Kopierkosten sind Teil der Probe, keine vorausgesetzte
Zero-Copy-Eigenschaft. Ein langsamer oder geschlossener Abnehmer darf Quelle,
MAIN, Radio oder die übrige Anwendung nicht blockieren. Jeder Abnehmer erhält
beim nächsten Abruf den neuesten Frame, keinen veralteten Rückstau.

## Komposition und Live-Semantik

Ein dedizierter Output-Content-Renderer lädt den Frame in eine Canvas-/WebGL-
Fläche. Er zeichnet nur bestätigte Frames der aktuellen Generation. Die
bestehenden Banner-, Transition-, Schnellanzeige- und Test-Overlay-Ebenen liegen
weiterhin darüber. Recording/Streaming verwenden das komponierte Ausgabebild.

MAIN und „Live auf MAIN“ konsumieren denselben Sequenzraum. Eine separat
ausgewählte Folie steuert die laufende Show niemals. Neue Fenster abonnieren
den aktuellen Stand und starten keine zweite Show oder Animation. Die bisherigen
Steuerbefehle und das geplante Pause/Fortsetzen bei Schnellanzeigen ändern sich
nicht. Audio bleibt ohne bestandenen separaten Isolations-/Routentest gesperrt.

## Fehler, Ressourcen und Rückbau

Ein veralteter, ungültiger oder ausbleibender Frame ist kein „läuft“. Der Operator
erhält eine lokalisierbare Diagnose; die Besucherausgabe behält den letzten
gültigen Frame mit ihren System-Overlays. Sichere Schnellanzeigen bleiben
bedienbar. Kein stiller Wechsel zur bearbeitbaren Kopie, kein automatischer
Neustart einer bereits sichtbaren Präsentation.

Stop, Importwechsel oder Absturz widerrufen die Generation, schließen die
eigenen Streams/Port-Verbindungen und geben Framepool, Texturen und Mappings
frei. Unbestätigte Lieferungen werden annulliert. Ein Output-Reconnect darf
keinen alten Speicherstand reaktivieren. Fremde Office-Dokumente und Prozesse
werden weder geschlossen noch pauschal beendet.

## Nachweis vor Produktintegration

Zuerst entsteht eine isolierte Probe, kein aktivierter Produkt-Player:

1. Native Toolchain und WGC-Verfügbarkeit tatsächlich bauen/prüfen. Kein
   Nachinstallieren, Ändern der Ausführungsrichtlinie oder Trust-Center-Bypass.
2. Ringprotokoll mit fehlerhaften Größen, Überlauf, Teilveröffentlichung,
   Generationstausch, parallelem Schreiber und zu langsamem Leser testen.
3. Eigene PowerPoint-Datei mit Bewegung, Klickschritten, automatischen Zeiten,
   Pause/Fortsetzung und einer unabhängigen Sentinel-Datei verwenden.
4. Über mindestens 60 Sekunden 1080p/30-fps-Verteilung mit echten wechselnden
   Framekennungen messen. Konfiguration oder wiederholte Kopien eines alten
   Frames gelten nicht als Bewegungsnachweis. Rohdaten enthalten Aufnahme,
   Broker-Annahme und tatsächliche Renderer-Darstellung.
5. Die unveränderten Grenzen bleiben p95 MAIN/Vorschau höchstens150 ms und
   p95 Befehl bis sichtbarer Animationsbeginn höchstens250 ms. Ein Timeout
   beendet die Probe als Fehler; keine günstigen Teilsamples als Gesamt-PASS.
6. Byteidentisches Original/Sentinel, falsche Fensteridentität, Fensterverlust,
   langsamer Abnehmer, Schließen/Neuöffnen und Absturzbereinigung prüfen.
7. Erst bei bestandenem technischem Nachweis die ergänzte Produktintegration
   planen. Radio, Output-Overlays, Live-Steuerung und gewählte Audio-/Monitorrollen
   müssen unverändert funktionieren. Audio benötigt weiterhin einen eigenen Test.

Die 30-fps-Cadence wird anhand der tatsächlich beobachteten Sequenzen und
Auslassungen berichtet, nicht aus einem angeforderten Timer abgeleitet. Eine
zusätzliche feste Abnahmeregel dieses Entwurfs lautet: Nach separat protokollierter
Aufwärmphase müssen beide Abnehmer über die vollen 60 Sekunden mindestens
29,5 unterschiedliche, aus der bewegten Quelle stammende Frames/s darstellen;
keine Lücke zwischen dargestellten Quellframes darf größer als150 ms sein.
Der Produzent arbeitet mit nominell30 fps. Diese explizite Mess-/Rundungstoleranz
ist neu zur Nutzerprüfung vorgelegt; die bestehenden150/250-ms-Latenzgrenzen
werden nicht verändert. Keine nachträgliche Anpassung an einen misslungenen Lauf.

## Veröffentlichung und nächste Freigabe

Keine Versionsanhebung, kein Installer und kein Push/Tag sind Bestandteil dieses
Entwurfs. v86 bleibt von vollständigen Regionalressourcen und bestandener
PowerPoint-Prüfung abhängig. Der Entwurf wird zunächst vom Nutzer geprüft;
danach folgt ein kleiner eigener Umsetzungsplan für die native technische Probe,
weiterhin mit nativer Umsetzung durch den Hauptagenten. Ein gescheiterter Versuch
begründet keinen stillen Video-Fallback oder gelockerten Freigabewert.

## Primärreferenzen

- [Microsoft: CreateForWindow](https://learn.microsoft.com/en-us/windows/win32/api/windows.graphics.capture.interop/nf-windows-graphics-capture-interop-igraphicscaptureiteminterop-createforwindow)
- [Microsoft: CreateFreeThreaded](https://learn.microsoft.com/en-us/uwp/api/windows.graphics.capture.direct3d11captureframepool.createfreethreaded?view=winrt-26100)
- [Microsoft: Sharing Files and Memory](https://learn.microsoft.com/en-us/windows/win32/memory/sharing-files-and-memory)
- [Microsoft: File Mapping Security and Access Rights](https://learn.microsoft.com/en-us/windows/win32/memory/file-mapping-security-and-access-rights)
- [Electron: Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

Diese APIs begründen den Entwurf, nicht dessen Funktions- oder Leistungsnachweis.
