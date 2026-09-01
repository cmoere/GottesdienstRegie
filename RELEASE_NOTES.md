# GottesdienstRegie 0.6.0

## Login und Allgemein

- wechselnde Login-Hintergründe befinden sich jetzt unter Einstellungen → Allgemein
- jede Sprache wird unabhängig von der aktiven Oberflächensprache mit ihrem Eigennamen angezeigt
- Flaggen sind betriebssystemunabhängig als CSS-Grafiken umgesetzt
- jedes Motiv zeigt unten den Aufnahmeort; die Anzeige ist kein Link

## Start und Updates

- beim Programmstart werden Sitzung, Displays, Präsentation, Programmversion und Verbindung wirklich geprüft
- der Initialisierungsbildschirm bleibt mindestens zehn Sekunden sichtbar und zeigt den Fortschritt
- beim Update liegt der grüne Fortschrittsbalken direkt hinter dem weiterhin lesbaren Statustext

## Versionen und Hilfe

- alle Versionen von 0.1.0 bis 0.6.0 sind einzeln mit Plus und Minus aufklappbar
- die neueste Version ist beim Öffnen bereits ausgeklappt
- ausgeklappte Versionen zeigen gegliederte Unterpunkte
- Hilfe und Support erklärt jetzt Benutzeroberfläche, Ablauf, Folien, Vorschau, ON AIR, MAIN/STAGE, Updates, Sicherheit, Audio, Barrierefreiheit und Login-Motive

## Folienübersicht

- professionelles Raster nach Vorprogramm, Ankommen, Gottesdienst und Nachprogramm
- Ablaufelemente mit ihren echten Folien-Thumbnails statt einer Listen- oder Demoansicht
- zentrale SlideRenderer-Engine für Editor, Filmstrip, Einzelvorschau, Raster und MAIN
- Thumbnailgröße lokal gespeichert, ohne Inhalt oder Präsentationsauflösung zu verändern
- voneinander unabhängige Preview- und Live-Auswahl mit türkiser und roter Markierung
- Hover-Aktionen für Vorschau und Bearbeiten
- Lazy Rendering und `content-visibility` für große Gottesdienste mit mehreren hundert Folien

## Echte ON-AIR-Ausgabe

- DisplayManager, OutputWindowManager und LiveEngine als getrennte Kernkomponenten
- frei zuordenbare physische Displays für Bedienoberfläche, MAIN, STAGE, NOTES, LIVESTREAM und LOBBY
- Bildschirmidentifizierung zeigt Nummer und Rolle direkt auf jedem angeschlossenen Monitor
- Preflight prüft Präsentation, aktive Folien und vorhandene MAIN-Zuordnung
- rahmenlose, schwarze Vollbildausgabe ohne Menü, Scrollleisten oder sichtbaren Cursor
- Ausgabe erscheint erst nach geladenem Renderer; kein weißes Aufblitzen
- Monitorverlust führt zu `MAIN FEHLT` oder `STAGE FEHLT` und niemals zu einer Ausgabe auf dem Bedienmonitor
- Nächste/Vorherige Folie überspringt deaktivierte Folien und Ablauf-Elemente
- OFF AIR beendet alle Ausgabefenster sofort und ohne Sicherheitsabfrage

## Korrektur

- Online-Versionshinweise werden sicher in lesbaren Text umgewandelt; HTML-Tags sind nicht mehr sichtbar

## Präsentationskern

- stabile IDs für Präsentationselemente und Folien
- mehrere Folien pro Ablaufelement
- Hinzufügen, Duplizieren, Kopieren, Einfügen, Aktivieren, Verschieben und Löschen von Folien
- Drag-and-drop im Ablauf und Filmstrip
- Undo und Redo mit `Strg+Z` und `Strg+Umschalt+Z`
- getrennte Editor-, Vorschau- und Live-Zustände
- unabhängiger Live-Snapshot schützt die Ausgabe vor laufenden Editoränderungen
- lokale JSON-Sicherung mit verzögertem Autosave

## ON AIR und Anzeigen

- einheitliche Bezeichnung `ON AIR` in jeder Sprache
- echte Electron-Monitorerkennung mit Auflösung, Skalierung, Rotation und Hotplug-Aktualisierung
- MAIN darf nicht auf den primären Bedienmonitor ausweichen
- rahmenloses schwarzes Vollbild-Ausgabefenster
- Live-Navigation mit Pfeiltasten sowie Bild-auf/Bild-ab außerhalb von Eingabefeldern

## Updates und Version

- Installationszeit, Dateidatum, Programmdatei und Dateigröße werden angezeigt
- grüner Fortschrittsbalken während des Downloads
- frühere installierbare GitHub-Version kann erneut heruntergeladen und installiert werden
- ausführlichere, einzeln mit Plus und Minus aufklappbare Versionshinweise

## Audio und Barrierefreiheit

- Auswahl realer Lautsprecher und Mikrofone
- Lautsprechertest und echter Mikrofonpegel
- Lautstärke, Eingangsverstärkung, Rausch- und Echo-Unterdrückung
- hoher Kontrast, größere Oberfläche, sichtbarer Tastaturfokus und lesefreundliche Schrift

## Login

- insgesamt 30 offline verfügbare Motive aus Bielefeld, deutschen Städten und Landschaften
- grünes „Angemeldet bleiben“ und rotes „Jetzt abmelden“

## English summary

- stable presentation and slide IDs, multi-slide filmstrip actions, drag-and-drop and undo/redo
- independent editor, preview and live state with a protected live snapshot
- real Electron displays, safe MAIN mapping and fullscreen output
- detailed version metadata, green update progress and rollback support
- real speaker/microphone selection and testing
- expanded accessibility and Help options
- 30 locally bundled sign-in backgrounds
