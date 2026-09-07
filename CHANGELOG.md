# Versionshinweise / Release notes

## 0.27.0 – 2026-09-07

- Cera Pro ist die Standardschrift für neue Folien und Texte, mit sicheren Ersatzschriften falls sie lokal nicht installiert ist
- Neuer Einstellungsbereich für Standardschrift, Größe, Gewicht, Live-Vorschau und Übernahme auf die aktuelle Folie
- Vorschau-Einzelansicht bildet MAIN ab und schaltet ON AIR direkt mit Pfeiltasten oder den großen Navigationstasten weiter
- Amen-Schnellanzeige erscheint als animierte 6-Sekunden-Grafik und blendet sich anschließend automatisch aus
- Vorschauoberfläche und Schnellanzeigen sind konsequent auf MAIN reduziert
- Standardübergang besitzt eine kleine Vorschau und einen eigenen Vorschau-Button; die Dauerneingabe wurde verbreitert
- Element-hinzufügen-Menü schließt nach dem Anlegen automatisch; Datei-Untermenüs stehen auf Höhe ihres Auslösers
- Automatische Speicherung alle 15 Sekunden sowie anklickbarer Sync-Status mit vier verständlichen Fortschrittsstufen

## 0.26.0 – 2026-09-07

- Schriftartenauswahl auf mehr als 120 Systemschriften erweitert
- Sechs zusätzliche Übergänge: Iris, Vorhang, Würfel, Einschwingen, Lichtblitz und Aufskalieren
- Im Vorschaumodus sind die Bearbeitungs-Ausgangsauswahl und die Formatierungswerkzeuge vollständig ausgeblendet
- Bereitschaftssymbol und Text „BEREIT“ aus der Vorschau entfernt
- Die Einzelansicht verwendet passend zur gewählten Darstellung einen hellen oder dunklen Hintergrund
- Änderungen an der aktiven Folie werden im Bearbeitungsmodus ohne Verzögerung rechts dargestellt

## 0.25.0 – 2026-09-07

- Übergänge bleiben nach dem Animationsende sichtbar; der Schwarzbildfehler ist behoben
- Neue Effekte Zoomen, Unschärfe, Kreis-Aufdecken, Drehen und Schieben mit Verdrängen
- Einzelansicht mit großen Navigationspfeilen, Links-/Rechts-Tastatursteuerung und abbrechbarem Folientimer
- Thumbnailregler erscheint ausschließlich in der Folienübersicht; acht feste Größenstufen bleiben erhalten
- Schriftartenauswahl auf mehr als 65 verbreitete Systemschriften erweitert
- Ablauf kann als eigene Vorlage gespeichert, beim Erstellen gewählt und als selbst angelegte Vorlage wieder gelöscht werden
- Präsentationsinformationen zeigen Ersteller, Zeitpunkte, Umfang, Dauer, IDs, Vorlagenherkunft und bis zu 60 Bearbeitungen

## 0.24.0 – 2026-09-07

- Vorschau-Modus als dichter Drei-Bereich-Arbeitsplatz mit Ablauf, gruppierter Folienübersicht und rechter Live-/Schnellanzeigenleiste neu aufgebaut
- Responsive Folienraster nutzt die vorhandene Breite und den gespeicherten Regler mit acht klaren Thumbnailstufen
- Ausgewählte und live gezeigte Folie bleiben strikt getrennt und werden gleichzeitig eindeutig markiert
- Rechte Seitenleiste zeigt die ausgewählte Folie, die tatsächlich aktuelle Live-Folie sowie echte konfigurierte Schnellanzeigen
- MAIN, LIVESTREAM, STAGE, NOTIZEN und SIGNALE sind als persistente Arbeitsansichten verbunden
- Leere Abschnitte bleiben kompakt; Abschnitts- und Elementdauern werden aus den vorhandenen Zeitdaten aggregiert
- Pfeiltastennavigation, Scrollen zur Auswahl, sichtbare Fokuszustände und zugängliche Tab-/Statusattribute ergänzt
- Reine Editor-Platzhalter werden nicht mehr als echter Präsentationsinhalt in der Vorschau gezeigt
- Große Präsentationen werden durch verzögertes Rendern außerhalb des sichtbaren Bereichs entlastet

## 0.23.0 – 2026-09-07

- Echte Folienübergänge für MAIN, LIVESTREAM und LOBBY: Schnitt, Überblenden, Kreuzblende, Auflösen, Schieben und Wischen
- Übergänge mit Dauer von 0,1 bis 5 Sekunden, Richtung, Bewegungskurve und optional umgekehrter Richtung beim Zurückschalten
- Hierarchie aus Präsentationsstandard, Standard des Ablauf-Elements und Überschreibung einer einzelnen Folie
- Eigener Vorschau-Button im Editor, der niemals die Live-Ausgabe verändert
- STAGE verwendet zur sicheren Lesbarkeit weiterhin einen direkten Schnitt
- Laufende Übergänge werden bei schnellem Weiterschalten abgebrochen statt in einer Warteschlange gesammelt
- Bestehende Präsentationen mit alten Übergangsfeldern werden automatisch kompatibel übernommen

## 0.22.0 – 2026-09-07

- Background Audio wird ausschließlich in der Vorschau oder während ON AIR wiedergegeben
- OFF AIR beendet die laufende Musik auch dann zuverlässig, wenn die Vorschau geöffnet bleibt
- Bearbeitungsmodus stoppt Background Audio und startet es nicht durch reine Editor-Auswahl
- Durchgängige Lautsprecher-Icons für Abschnitts-, Element- und Live-Audio; Musiknoten bleiben echten Songs vorbehalten
- Kompaktes Lautsprecher-Kontextmenü für Audio Browser, Import und Audio-Stop-Cue
- Separate Playlist-Verwaltung mit Autoplay, Shuffle, Wiederholung, Zielregel, Lautstärke, Fade, Crossfade und Ducking
- Wiedergaberegeln für Element- und Abschnittsgrenzen korrigiert
- Trackliste zeigt Hörprobe, Metadaten, Dauer, Sortierung und Entfernen

## 0.21.0 – 2026-09-07

- Release-Notes-Webseite im Stil einer professionellen Entwicklerdokumentation neu aufgebaut
- Versionsnavigation, Volltextsuche, Direktlinks, Sprachwahl, responsive Ansicht sowie Hell-/Dunkelmodus
- Import-Untermenü auf Höhe von „Präsentation importieren“ positioniert
- Getrennte Dateifilter für Office-Präsentationen, Text/Markdown und GottesdienstRegie-Dateien
- Breiteres Hilfe-Menü mit eindeutigen Symbolen und sauberen Zeilenumbrüchen
- Strukturierter, mehrsprachiger Dialog zum Melden von Fehlern
- Optionale bereinigte Diagnoseinformationen ohne Passwörter oder Anmeldecodes

## 0.20.0 – 2026-09-07

- Background-Audio-Playlists für VORPROGRAMM, WARM-UP, GOTTESDIENST und NACHPROGRAMM
- Visuelle PRE-/POST-Loops starten einen laufenden Musiktitel nicht erneut
- Eigenes Background Audio pro Ablauf-Element sowie rückgängig-fähige Audio-Stop-Cues
- Separates Audio-Browser-Systemfenster mit Cloud-Quellen, Mehrfachauswahl, Hörprobe und sortierbarer Auswahl
- Wiederholung, Zufallswiedergabe, Lautstärke, Ein-/Ausblenden, Übergänge und Fortsetzungsregeln
- Automatische Musikabsenkung bei Live-Videos mit Ton
- Live-Controller für Pause, Fortsetzen, nächsten Titel, Stop, Stumm und Lautstärke
- Audio-Preflight meldet fehlende oder noch nicht vorbereitete Cloudtitel verständlich

## 0.19.0 – 2026-09-07

- Echte Screenshots von Arbeitsbereich, Einstellungen und Medienbibliothek in der integrierten Hilfe
- Ausführliche neue Hilfekapitel für Einstellungen, Songs, Bibel, STAGE, Schnellanzeigen, Timer und Fernsteuerung
- Tastenkürzel für Speichern, Undo/Redo, Live-Navigation, Moduswechsel, Vollbild und ON AIR frei anpassbar
- Kürzel werden lokal gespeichert und unmittelbar angewendet
- Konflikterkennung, Abbruch mit Escape und Zurücksetzen auf Standard
- F11 ist nicht mehr fest verdrahtet, sondern folgt der gewählten Vollbild-Belegung

## 0.18.0 – 2026-09-06

- Abgerundeter Bearbeiten-/Vorschau-Umschalter unmittelbar links neben ON AIR
- Geöffnete Präsentationen können über das Datei-Menü dauerhaft umbenannt werden
- PowerPoint (`.pptx`) und OpenDocument (`.odp`) werden folienweise mit bearbeitbaren Texten importiert
- Keynote (`.key`) kann über die eingebettete Vorschau importiert werden; für vollständig editierbare Inhalte wird PPTX empfohlen
- Text- und Markdown-Dateien werden absatzweise in Folien umgewandelt
- Release-Notes-Webseite mit modernem responsivem Design, Suche, Sprachwahl und Auf-/Zuklappen

## 0.17.2 – 2026-09-06

- Gefundene Updates zeigen direkt in der Statusbox eine kurze Änderungsübersicht
- Kategorien wie Neu, Verbessert und Fehlerbehebungen werden kompakt zusammengefasst
- Ausführliche Informationen bleiben weiterhin in den Versionshinweisen
- Mehrsprachige Kategorien und englischer Fallback für zukünftige Versionen

## 0.17.1 – 2026-09-06

- Servicezeit-Popup bleibt vollständig innerhalb der Ablaufspalte
- Keine abgeschnittene Überschrift, Beschriftung oder Schaltfläche mehr am linken Fensterrand
- Responsive Breite berücksichtigt auch kleinere App-Fenster

## 0.17.0 – 2026-09-06

- Echte, frei gestaltbare Antwortfolie mit Live-Auswertung und geschützter Freitext-Moderation
- Vorschau-QR-Code bereits vor Quizstart; echter Code wird beim automatischen Start eingesetzt
- Quizbeschreibung wird zuverlässig auf der Teilnahmefolie angezeigt
- Quizfragen lassen sich per Ziehen neu anordnen
- Acht feste Thumbnail-Größen bis zu einer deutlich größeren Rastervorschau
- Deutlich mehr Schriftarten mit Vorschau im Texteditor
- Schnellanzeigen erscheinen ausschließlich im Vorschau-Modus
- Hauptmenüs bleiben zuverlässig über Canvas, Editor und Popovern
- Updatesuche bleibt mindestens drei Sekunden sichtbar
- Erweiterte Hilfetexte und schematische Darstellungen für Oberfläche und LiveQuiz
- Dezente, barrierearme Animationen für Ansichten, Folien und Live-Status

## 0.16.0 – 2026-09-06

- Echte, frei gestaltbare Quiz-Teilnahmefolie mit dynamischem QR-Code, Link und sechsstelliger Kennung
- Automatischer LiveQuiz-Start beim Wechsel zum Quiz während ON AIR
- Option zum Zurückhalten von Freitextantworten bis zur Freigabe
- Bearbeitungswerkzeuge im Vorschau-Modus ausgeblendet und Fotomotiv-Beschreibungen korrigiert
- Version 0.13 vollständig im Versionsverlauf wiederhergestellt

## 0.15.4 – 2026-09-06

- Animierte Updatesuche: „Suche nach Updates“, „.“, „..“, „...“ und wieder von vorn
- X-Schaltfläche rechts im Fortschrittsbalken zum Abbrechen eines laufenden Downloads
- Der Abbruch stoppt die tatsächliche Netzwerkübertragung und ermöglicht einen erneuten Download

## 0.15.3 – 2026-09-06

- LiveQuiz-Teilnahmeansicht mit Quizname, QR-Code, URL und sechsstelligen Code auf MAIN
- Optionale Ausgabe gleichzeitig auf MAIN, STAGE, LIVESTREAM und LOBBY
- Teilnahmelink kann direkt aus der Quizsteuerung kopiert werden
- LAST SHOWN stellt nach der Teilnahmeansicht die vorherige Livefolie wieder her

## 0.15.2 – 2026-09-06

- Alt+F4 und das Windows-Schließen beenden zuerst alle aktiven Präsentationsausgaben
- MAIN, STAGE, NOTES, LIVESTREAM und LOBBY bleiben nach dem Schließen der Bedienoberfläche nicht mehr offen
- Auch Update-, System- und andere App-Beendigungen verwenden denselben zentralen Output-Shutdown

## 0.15.1 – 2026-09-06

- QR-Code und Teilnahmelink verwenden jetzt `https://pgbielefeld.neocities.org/quiz`
- Firebase-Einrichtung nennt die passende autorisierte Neocities-Domain

## 0.15.0 – 2026-09-06

- Echte LiveQuiz-Sitzungen mit zufälligem sechsstelligen Teilnahmecode
- Lokal erzeugter QR-Code ohne externen QR-Bilddienst
- Mobile Teilnahme-Seite als eigenständige HTML-, CSS- und JavaScript-Anwendung
- Anonyme Teilnahme oder Teilnahme mit Anzeigenamen
- Fragen lassen sich kontrolliert einzeln öffnen und wieder schließen
- Live-Zähler für Teilnehmer und eingegangene Antworten
- Teilnahmecode wird beim Beenden unmittelbar ungültig
- Richtige Antworten bleiben ausschließlich in der Desktop-Präsentation
- Beispielregeln für getrennte Sitzungs-, Code- und Antwortberechtigungen

## 0.14.0 – 2026-09-06

- LiveQuiz ist über „Element hinzufügen“ und das Plus im Ablauf erreichbar
- Erstellungsdialog für Titel, Quiz oder Umfrage sowie anonyme oder namentliche Teilnahme
- Eigener ServiceItem-Typ `liveQuiz` mit Quizsymbol und echter Fragenanzahl im Ablauf
- Spezialisierter LiveQuiz-Editor für Fragen, Antwortoptionen, richtige Lösungen, Zeitlimit und Punkte
- Single Choice, Multiple Choice, Richtig/Falsch, Ja/Nein, Freitext, Skala und Umfrage vorbereitet
- Fragen lassen sich hinzufügen, auswählen, bearbeiten und sicher wieder löschen
- Quizfragen werden als echte Folien durch den gemeinsamen SlideRenderer dargestellt
- Quizdefinition und Fragen bleiben Bestandteil der gespeicherten Präsentation
- Erstellen und Bearbeiten sind in den zentralen Undo-/Redo- und Autosave-Ablauf eingebunden
- Keine fingierte Live-Session: Teilnahmecode und Audience-Verbindung werden erst mit dem echten Audience-Dienst aktiviert

## 0.13.1 – 2026-09-06

- Cloud-Migration zeigt nun die konkrete, verständliche Ursache statt einer pauschalen Abbruchmeldung
- GitHub-Medienzugriff authentifiziert private Team-Medien beim Hochladen, Auflisten, Anzeigen und Löschen
- Uploads in ein versehentlich öffentliches Medien-Repository werden aus Datenschutzgründen blockiert
- Netzwerkfehler beim Upload werden kontrolliert wiederholt; bereits erfolgreich übertragene Medien bleiben erhalten
- Das Medienfenster trägt den eindeutigen Systemtitel „GottesdienstRegie – Medienbibliothek“
- Das Präsentationsmenü zeigt Informationen, Servicezeit und ON AIR in einer zusammenhängenden Menüfläche
- Rückgängig und Wiederholen bleiben sichtbar, sind ohne verfügbare Aktion aber korrekt deaktiviert

## 0.13.0 – 2026-09-06

- Eigenständiges, skalierbares Medienfenster mit gespeicherter Größe
- Getrennte Bereiche für eigene Medien, Community und Unsplash
- Cloud-Raster mit Suche, Typfilter, Sortierung und Detailbereich
- Getrennte Verwaltungs- und Auswahlmodi
- Geprüfter Upload mit Vorschau, Metadaten und ausdrücklicher Bestätigung
- Sichere Migration vorhandener Altmedien in die Cloud
- Schutz vor Löschen während Live-Ausgabe oder bei Verwendung in Präsentationen
- Keine lokale Bestandszählung und kein technischer Provider-Text mehr
- Vollflächiges Layout ohne den bisherigen großen Leerraum

## 0.12.0 – 2026-09-06

- Mehrstufiges professionelles Datei-Menü mit echten Flyouts
- Dialog für neue Präsentationen mit Datum, Servicezeit, Team und Vorlage
- Durchsuchbare und sortierbare Präsentationsauswahl mit echten Miniaturen
- Konfigurierbares Duplizieren mit vollständig neuen Objekt-IDs
- Import, Sicherung, Wiederherstellung, Drucken und Teilen klar zusammengeführt
- Gestuftes Escape-Verhalten und Pfeiltasten-Navigation
- Sicherer Beenden-Dialog bei aktiver ON-AIR-Ausgabe

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
