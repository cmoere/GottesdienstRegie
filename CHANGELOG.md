# Versionshinweise / Release notes

## 0.11.1 – 2026-09-02

- Helles Farbschema auf die gesamte Produktionsoberfläche erweitert
- Kontrast von Titeln, Überschriften und Schließen-Schaltfläche im Einstellungsfenster korrigiert
- Dunkles Farbschema unverändert beibehalten

## 0.11.0 – 2026-09-02

- Funktionales Hintergrund-Menü mit Medienwahl, Import, Farbpalette, Unschärfe, Rotation, Anpassung und Positionierung
- Ein- und ausschaltbare Smart Guides, Randhilfen und Drittelregel ausschließlich im Editor
- Anordnen-Menü für Ebenen, sechs Ausrichtungen, Drehen, Spiegeln und Sperren
- Identische Darstellung der neuen Eigenschaften in Editor, Vorschau, Miniaturen und Live-Ausgabe
- Hintergrundwahl aus der Medienbibliothek ohne zusätzliches Ablauf-Element
- Wirksamer Miniaturgrößen-Regler in der Folienübersicht
- Responsive-Ausblendung einzelner Menübefehle behoben
- Kursivformatierung im zentralen Renderer behoben

## 0.10.0 – 2026-09-02

- Dunkler, dichter Produktionsarbeitsbereich mit Output-Tabs, Formatleiste, Kontexteditor und großer Vorschau
- Spezialisierter Songeditor für Arrangement, Tonart, Lyrics, Metadaten und CCLI
- Aufklappbare Timeline mit Elementdauern und Liveposition
- Exakt eine Servicezeit mit VORM./NACHM.-Darstellung
- Full-Bleed-Startbildschirm mit echten Ladephasen
- Geglättete, aus echten Downloadwerten berechnete Update-Restzeit
- Buildziele für Windows, macOS (Intel/Apple Silicon) und Linux

## 0.6.0 – 2026-09-01

### Deutsch

- Einstellung für wechselnde Login-Hintergründe von Barrierefreiheit nach Allgemein verschoben
- Sprachen werden immer mit ihrem Eigennamen angezeigt, beispielsweise Deutsch, Dansk und Türkçe
- zuverlässige, in CSS gezeichnete Flaggen statt länderabhängiger Buchstaben-Ersatzdarstellung
- nicht anklickbare Fotodetails mit Motiv und Aufnahmeort direkt auf dem Login
- komplette aufklappbare Versionshistorie von 0.1.0 bis 0.6.0; neueste Version standardmäßig geöffnet
- deutlich erweiterter Hilfe- und Supportbereich für Benutzeroberfläche, Vorschau, ON AIR, Anzeigen, Updates, Audio, Sicherheit und Barrierefreiheit
- echter Initialisierungsladescreen mit Sitzungs-, Display-, Präsentations-, Update- und Verbindungstests
- Mindestanzeigezeit des Startbildschirms von zehn Sekunden mit echtem Fortschritt
- grüner Updatefortschritt direkt als Hintergrund der Statusbox bei weiterhin gut lesbarem Text

### English

- changing sign-in backgrounds moved from Accessibility to General
- language names always remain in their native form
- reliable CSS-rendered flags instead of operating-system letter fallbacks
- non-clickable scene and location details on the sign-in screen
- expandable complete version history with the newest version open by default
- substantially expanded Help and Support documentation
- real ten-second startup initialization with session, display, presentation, update and connection checks
- green update progress rendered behind the readable status text

## 0.5.0 – 2026-08-31

### Deutsch

- professionelle Folienübersicht nach Vorprogramm, Ankommen, Gottesdienst und Nachprogramm
- echte, lazy gerenderte Thumbnails mit derselben SlideRenderer-Engine wie Editor, Einzelvorschau und MAIN
- lokal gespeicherte Thumbnailgröße sowie getrennte Preview- und Live-Markierungen
- Hover-Aktionen für Vorschau und direktes Bearbeiten, ohne laufende MAIN-Ausgabe zu verändern
- unabhängige Preview- und Live-Auswahl; Thumbnail-Klick schaltet nur bei aktivem ON AIR live
- DisplayManager mit Monitorname, Auflösung, Position, Skalierung, Rotation und Primärstatus
- frei zuordenbare Rollen für Bedienoberfläche, MAIN, STAGE, NOTES, LIVESTREAM und LOBBY
- Bildschirmidentifizierung mit großer Nummer und zugeordneter Rolle auf jedem Monitor
- Preflight-Prüfung und echte rahmenlose Vollbild-Ausgabefenster mit schwarzem Startbild
- sichere Hotplug-Behandlung: fehlende Ausgaben werden markiert und niemals auf den Bedienmonitor verschoben
- Online-Versionshinweise werden als lesbarer Text statt als HTML-Quelltext angezeigt

### English

- professional slide grid grouped by pre-show, arrival, service and post-show
- lazy real thumbnails using the same SlideRenderer engine as editor, single preview and MAIN
- locally persisted thumbnail size and independent preview/live indicators
- hover actions for preview and edit without changing the current live output
- real display role mapping, identification overlays, preflight checks and borderless fullscreen outputs
- safe display hotplug handling without ever falling back to the operator monitor
- online release notes are converted into readable text instead of exposing HTML source

## 0.4.0 – 2026-08-31

### Deutsch

- 30 lokal mitgelieferte Login-Motive aus Bielefeld, deutschen Städten und Landschaften
- Versionsdetails mit Installationszeit, Dateidatum, Programmdatei und Dateigröße
- grüner, echter Download-Fortschrittsbalken für Updates und Rückkehr zu einer früheren Version
- Lautsprecher- und Mikrofon-Auswahl mit Gerätetest, Pegel, Lautstärke, Eingangsverstärkung, Rausch- und Echo-Unterdrückung
- zusätzliche Barrierefreiheit: hoher Kontrast, größere Oberfläche, deutlicher Tastaturfokus und lesefreundliche Schrift
- `ON AIR` wird sprachunabhängig verwendet; MAIN darf niemals auf den primären Bedienmonitor ausweichen
- getrennte Editor-, Vorschau- und Live-Zustände mit eigenem Live-Snapshot
- stabiles Präsentationsmodell mit UUIDs, mehreren Folien, Filmstrip-Aktionen, Drag-and-drop sowie Undo/Redo
- lokale Präsentationssicherung als JSON-Datei mit debounced Autosave
- erweiterte Hilfe und längere, einzeln aufklappbare Versionshinweise
- grünes „Angemeldet bleiben“ und rotes „Jetzt abmelden“

### English

- 30 locally bundled sign-in scenes featuring Bielefeld, German cities and landscapes
- version metadata including installation time, file date, executable and file size
- real green progress bar for updates and rollback to an earlier installable release
- speaker and microphone selection with device tests, meters, volume, input gain, noise and echo suppression
- additional accessibility options for contrast, interface size, focus visibility and readability
- language-independent `ON AIR`; MAIN never falls back to the primary control display
- separate editor, preview and live state with an independent live snapshot
- stable presentation model with UUIDs, multiple slides, filmstrip actions, drag-and-drop and undo/redo
- local JSON presentation storage with debounced autosave
- expanded Help and longer individually expandable release notes

## 0.3.1 – 2026-08-31

### Deutsch

- Windows-Installer und Update-Metadaten werden nun in einem getrennten, geprüften Release-Schritt veröffentlicht
- automatische Update-Suche und Installation von GitHub Releases dadurch zuverlässig verfügbar

### English

- Windows installer and update metadata are now published in a separate, verified release step
- automatic update checks and installation from GitHub Releases are therefore reliably available

## 0.3.0 – 2026-08-31

### Deutsch

- Spanisch, Schweizerdeutsch, Ukrainisch, Russisch, Türkisch, Arabisch und Polnisch ergänzt
- wechselnde, offline verfügbare Login-Motive aus Bielefeld, deutschen Städten und Landschaften
- Sprachauswahl über die Flagge oben rechts im Login
- automatische Bestätigung sechsstelliger Zwei-Faktor-Codes
- Sicherheitsabfrage vor dem Abmelden
- zusätzliche Einstellungen für reduzierte Bewegung, kompakte Darstellung und Login-Motive
- neuer Hilfe- und Supportbereich
- einzeln mit Plus und Minus aufklappbare Versionshinweise

### English

- Added Spanish, Swiss German, Ukrainian, Russian, Turkish, Arabic and Polish
- Changing offline sign-in scenes featuring Bielefeld, German cities and landscapes
- Language selection through the flag in the top-right corner
- Automatic confirmation of six-digit two-factor codes
- Confirmation prompt before signing out
- Additional settings for reduced motion, compact layout and sign-in scenes
- New Help and Support area
- Release-note items expandable individually with plus and minus

## 0.2.0 – 2026-08-30

### Deutsch

- Automatische Updateprüfung über GitHub Releases
- Sicherer, bestätigungspflichtiger Download und Neustart zur Installation
- Versionshinweise direkt in der Software
- Updateoberfläche vollständig auf Deutsch, Englisch, Niederländisch, Dänisch und Norwegisch

### English

- Automatic update checks through GitHub Releases
- Secure download and restart for installation, both requiring confirmation
- Release notes directly in the application
- Update interface fully available in German, English, Dutch, Danish and Norwegian

### Nederlands

- Automatische updatecontrole via GitHub Releases
- Veilige download en herstart voor installatie, beide na bevestiging
- Versieopmerkingen rechtstreeks in de toepassing
- Updateweergave volledig beschikbaar in het Duits, Engels, Nederlands, Deens en Noors

### Dansk

- Automatisk opdateringssøgning via GitHub Releases
- Sikker download og genstart til installation, begge efter bekræftelse
- Versionsbemærkninger direkte i programmet
- Opdateringsvisning på tysk, engelsk, nederlandsk, dansk og norsk

### Norsk

- Automatisk oppdateringssøk via GitHub Releases
- Sikker nedlasting og omstart for installasjon, begge etter bekreftelse
- Versjonsmerknader direkte i programmet
- Oppdateringsvisning på tysk, engelsk, nederlandsk, dansk og norsk
