# PRE-/POST-Loop: Nachrichten, Fußball, Uhr und Störungshinweis

Status: Entwurf zur schriftlichen Freigabe. Keine Implementierungs- oder Releasefreigabe durch dieses Dokument.

Nachtrag23.10.2026: Spezifikation und Implementierungsplan wurden im Chat freigegeben. Nutzer bestätigt ausdrückliche Quellennutzung mit Bedingung „quellenangaben mit logo“ und erlaubt anschließend das Speichern. Daher Original-Quellenlogos zusätzlich zur Namensnennung verwenden; keine Artikelbilder/Vereinslogos. Der begrenzte24h-Ausfallcache ist erlaubt, kein dauerhaftes Archiv. Diese Nutzerauskunft ist keine unabhängig geprüfte Lizenzurkunde.

## Ziel und bestätigter Umfang

Besucher erhalten im Vor- und Nachprogramm lokale Nachrichten sowie Fußball-Spieltermine, Ergebnisse und Tabellen. Der Operator kann Quellen, Liga und optional einen Verein auswählen. Die vorhandene Uhr erhält Designkacheln und Anzeigeoptionen. Die MAIN-Schnellanzeige „Technische Störung“ wechselt zwischen Deutsch und Englisch und zeigt ein Informationssymbol statt der bisherigen Linie.

Der Nutzer hat diesem Aufbau am 23.10.2026 zugestimmt. Programmierung und Prüfung erfolgen durch den Hauptagenten; keine Delegation von Entwicklungsarbeit. Die bestehenden Firebase-Dienste, Audioausgabe, geschützte Nachprogrammfolie und Live-Navigation bleiben erhalten.

## Architekturentscheidung

Eine zentrale Desktop-Datenanbindung mit begrenztem Cache ist gegenüber direkten Abrufen aus jeder Folie oder eingebetteten Webseiten gewählt. Sie liefert ausschließlich normalisierte, serialisierbare Daten an die bestehende Präsentationspipeline. Keine zusätzliche Veranstaltungs-/Meldungsdatenbank, keine neuen Firebase-Pfade. Externe Nachrichten und Sportdaten sind eigenständige, löschbare Cache-Daten, nicht Gemeindestammdaten.

Die Umsetzung besteht aus vier getrennt testbaren Einheiten: Nachrichtenadapter, Fußballadapter, gemeinsame Loop-Snapshot-Anbindung und vorhandene Renderer/Designer-Erweiterungen. Neue Services werden nicht in App.tsx oder einzelne Output-Fenster eingebaut. Electron initialisiert einen gemeinsamen Datenservice; Renderer verwenden eine eng begrenzte Preload-Schnittstelle. MAIN erhält fertige öffentliche Snapshots und lädt nicht selbst aus dem Internet.

## Nachrichten

Neuer Loop-Typ „Nachrichten“, ausschließlich an den bestehenden erlaubten PRE-/POST-Plätzen:

- Westfalen-Blatt: `https://www.westfalen-blatt.de/rss/feed?subcategory=/owl/bielefeld`
- WDR OWL: `https://www1.wdr.de/nrw/ostwestfalen-lippe/uebersicht-westfalen-lippe-100.feed`

Beide Quellen sind einzeln oder gemeinsam wählbar. Einstellungen werden pro Element gespeichert. Standard: beide Quellen, neueste zuerst, maximal zehn Meldungen. Duplikate über kanonische HTTPS-URL, ersatzweise Quelle plus Feed-ID erkennen. Gemeinsame Einträge werden nach Veröffentlichungszeit sortiert; fehlende Zeiten nicht erfinden.

Öffentliches Objekt: stabile lokale ID, Überschrift, Quellenname, Veröffentlichungszeit oder null, HTTPS-Artikellink. Keine Artikelvolltexte, Bilder, Tracking-Pixel oder eingebetteten Feed-HTML-Inhalte. Titel werden als Text gerendert, niemals als HTML. Quellenhinweis bleibt sichtbar. Keine Behauptung, ein öffentlicher RSS-Feed erlaube automatisch jede gewerbliche Weiterverwendung; Quellenbedingungen vor produktiver Aufnahme prüfen.

Zentraler Abruf beim ersten Bedarf, danach höchstens alle fünf Minuten pro Quelle. Gleichzeitige Anfragen zusammenführen. Zehn Sekunden Timeout, maximal 2 MiB Antwort und maximal 100 eingelesene Einträge pro Quelle. XML ohne externe Entitäten oder DTD-Netzwerkzugriffe verarbeiten. Nur feste zugelassene Hosts; Redirects auf andere Hosts, lokale Adressen und nicht-HTTPS-URLs ablehnen. Keine frei eingebbaren Feed-URLs in diesem Umfang.

Letzten erfolgreichen normalisierten Snapshot mit Zeitstempel atomar in app-eigenem Cache speichern. Bei Netzfehler bis zu 24 Stunden weiterverwenden und in der Operator-UI als veraltet kennzeichnen. Ohne gültige Einträge EMPTY/überspringen; keine Fehlermeldung oder leere Nachrichtenfolie auf MAIN. Ein Ausfall einer Quelle verwirft nicht die andere.

## Fußball

Neuer Loop-Typ „Fußball“ mit Modi Spieltag/Ergebnisse, kommende Spiele und Tabelle. Liga zunächst 1., 2. und 3. Bundesliga; aktuelle Saison anhand verfügbarer API-Daten bestimmen, nicht dauerhaft fest codieren. Verein optional aus den tatsächlich geladenen Teams wählen; „Alle Vereine“ ist Standard. Tabellen behalten die gesamte Rangfolge und markieren einen gewählten Verein; Spiellisten können nach diesem Verein filtern. Kein Wett-, Werbe- oder Bezahlangebot.

Quelle ist die dokumentierte OpenLigaDB-JSON-API. Die offizielle GitHub-Dokumentation beschreibt Ligakürzel bl1/bl2/bl3, saisonbezogene Spiele, Teams und Tabellen: https://github.com/OpenLigaDB/OpenLigaDB-Samples . Dokumentation als Integrationsgrundlage nutzen; keine fremde Anwendung oder Wrapper-Abhängigkeit übernehmen. Die Lizenz des Beispielcodes ist keine pauschale Lizenz für Vereinslogos oder andere Medien; in dieser Erweiterung keine Logos laden.

Öffentliche Matchdaten: Match-ID, Wettbewerb, Saison, Teams, UTC-Anstoß, Status und verifiziert vorhandener Spielstand. Tabellen: Rang, Team, Spiele, Tore, Tordifferenz und Punkte. Fehlender Spielstand ist „–“, niemals automatisch 0:0. Nicht beendete Spiele nicht als Endergebnis kennzeichnen; verfügbare Zwischenstände als solche ausweisen. Community-Daten sind kein zugesicherter Echtzeitdienst, daher Quellenname und Datenstand anzeigen.

Spiele im Bedarf höchstens alle 60 Sekunden, Tabellen alle fünf Minuten, Team-/Ligadaten alle sechs Stunden laden; identische Abrufe zusammenführen. Zehn Sekunden Timeout, maximal 2 MiB Antwort. Nur api.openligadb.de über HTTPS. Erfolgreiche Snapshots bis zu sechs Stunden als Offline-Ersatz mit Datenstand verwenden; ohne gültige Daten EMPTY. Keine technische Fehlermeldung auf MAIN. Auswahlfehler oder unvollständige Ligen nur dem Operator melden.

## Loop-Snapshots, Darstellung und Dauer

Bestehende Typdefinitionen, Factory, Katalog, Einfüge-/Verschieberegeln und Preflight um die zwei neuen Loop-Typen erweitern. Gespeicherte ältere Präsentationen bleiben gültig. Die bestehenden Loop-Daten nicht neu implementieren.

Service-Aktualisierungen bereiten die nächste Revision vor. Beim sicheren Folien-/Loop-Wechsel wählt die Steuerung eine Revision samt Startzeit und sendet sie gemeinsam an MAIN und Spiegelvorschau. Während der Anzeige bleibt diese Revision stabil. Die Vorschau darf keinen zweiten unabhängigen Netzwerkabruf oder Animationsstart verwenden. Änderungen an Einstellungen während einer Live-Anzeige ebenfalls erst beim nächsten Eintritt übernehmen. Andere Ausgaben behalten ihre bisherigen Routingregeln.

Nachrichten: ruhige, vollbreite Liste ohne Artikelbilder. Fußball: klar lesbare Liste bzw. Tabelle. Farben #699F3E, #608F9A und #B6BEC3; Cera Pro mit vorhandenem Font-Fallback. Keine abgeschnittenen Titel, keine automatische Schriftverkleinerung. Lange Titel einzeln langsam horizontal bewegen; Metazeilen bleiben statisch. Bei mehr Zeilen als Platz ruhiger vertikaler Durchlauf mit Anfangs-/Endpause. Existierende Scroll-/Dauerberechnung soweit passend wiederverwenden, Mindestdauer aus sichtbarer Strecke und Lesepausen ableiten. Operator kann verlängern, aber keine zu kurze Dauer erzwingen. EMPTY-Inhalte überspringen ohne Schwarzbild.

## Uhrzeit-Designer

Den vorhandenen Uhr-Loop erweitern, kein zweiter Uhrtyp. Sechs Designkacheln mit Miniaturvorschau: Digital klassisch, Digital kompakt, Digital mit Sekunden, Analog hell, Analog dunkel, Analog plus Digital. Optionen: 12-/24-Stunden, Sekunden sichtbar, Datum sichtbar, Wochentag sichtbar, Datumsformat, Hintergrund-, Text- und Akzentfarbe sowie Ausrichtung links/zentriert/rechts. Analog verwendet dieselbe Zeitbasis wie Digital; Sekundenoption steuert auch den Sekundenzeiger.

Datumsformate: TT.MM.JJJJ, TT.MM., TT. Monat JJJJ und ISO JJJJ-MM-TT. Mit Wochentag wird z. B. „Mo., 01.01.2020“ als Formatmuster verwendet; tatsächlicher Wochentag wird berechnet. Standard: Digital klassisch, 24 Stunden, Sekunden und Datum/Wochentag an, TT.MM.JJJJ. Bestehendes metadata.format nach Möglichkeit übernehmen statt gespeicherte Wünsche zu überschreiben. Zeit stammt aus der vorhandenen vertrauenswürdigen AppClock; keine eigene Uhrkorrektur, keine Netzwerkabfragen pro Uhr. Inaktive Renderer stoppen Tick-/Animationsarbeit. Einstellungen bleiben nach Neustart erhalten und Vorschau/MAIN nutzen denselben Renderer.

## Technische Störung

Informationssymbol als repo-natives SVG oberhalb des Textes, statt der Akzentlinie. Standard Deutsch „Technische Störung / Wir bitten um etwas Geduld.“; Englisch „Technical difficulties / Thank you for your patience.“. Je Sprache acht Sekunden, Start Deutsch, Auswahl anhand gemeinsamer Quick-Screen-Aktivierungszeit statt unabhängiger Fenster-Timer. Keine Größen-/Positionssprünge, keine neue Audioaktion. Statische Kachel zeigt Deutsch.

Vorhandenen deutschen Text und Hintergrund erhalten. Englischen Text in den Schnellanzeige-Einstellungen separat bearbeitbar machen; eigener deutscher Text wird nicht automatisch maschinell übersetzt. Englischer Standard kann überschrieben werden. Gespeicherte Logo-Varianten unverändert lassen. Sprachwechsel erzeugt keinen erneuten Quick-Screen-Aufruf und verändert keinen Slide-Index. Test-Wasserzeichen bleibt darüber sichtbar.

## Fehler, Sicherheit und Abnahme

Preflight zeigt Quellenstatus, Aktualisierungszeit und verfügbare Inhalte. Optionale Nachricht-/Sport-Ausfälle blockieren ON AIR nicht. Keine Fehlertexte, URLs mit Tokens oder interne Daten an MAIN. Cache löschen und alle Hintergrundtimer beim Beenden sauber stoppen; Laden blockiert weder ON AIR noch Audio.

Automatisierte Tests mit festen RSS-/API-Fixtures: ungültiges XML/JSON, DTD, HTML-Titel, zu große Antworten, Redirects, Timeout, Teilquellenausfall, fehlende Spielstände, Saisonwechsel, Vereinsfilter, Tabellenrangfolge, Cache-Ablauf und request deduplication. Loop-Tests: nur PRE/POST, EMPTY überspringen, stabile Live-Revision, neue Revision erst beim Wechsel, identische Vorschau/MAIN-Startzeit, ausreichende Scroll-Dauer. Uhr-Tests: sechs Designs, Datumvarianten, 12/24, Sekunden, Persistenz und Migration. Störung: DE/EN-Grenzen, eigene Texte, Logo-Kompatibilität und Test-Wasserzeichen.

Native Prüfung nutzt eigene isolierte Fenster, keine ungefragte reale ON-AIR-Ausgabe oder Änderung der Monitor-/Audiozuordnung. Visuelle Prüfung aller Designs und langer Inhalte. Bestehende Tests, Desktop-/Web-Build und passende native Prüfungen vor Abschluss ausführen. Externe Live-Antworten zusätzlich prüfen, aber nicht als alleinige Testbasis verwenden.

## Veröffentlichung

Ziel ist ein normales Update, das über „Updates suchen“ gefunden wird. Dafür müssen Installer, Versionsmetadaten und Update-Feed zum selben freigegebenen Release gehören und dessen Erreichbarkeit geprüft werden. Ein Commit oder erfolgreicher lokaler Build ist keine Veröffentlichung.

Die ältere ausdrückliche Freigabebedingung (vollständige Regionaltexte und PowerPoint) ist weiterhin offen und wird durch die Zustimmung zu diesem Design nicht aufgehoben. Ohne Erfüllung oder ausdrückliche Änderung dieser Bedingung keine Veröffentlichung. Die nächsten Schritte sind schriftliche Spezifikationsfreigabe, anschließend separater Implementierungsplan und dessen Freigabe.

## Quellenprüfung und Grenzen

Am 23.10.2026 offizielle OpenLigaDB-GitHub-Dokumentation gelesen. Der Webleser konnte Westfalen-Blatt nicht abrufen und WDR-XML nicht darstellen; dies ist kein Nachweis eines defekten Feeds. Vor Implementierungsabschluss beide URLs mit dem vorgesehenen XML-HTTP-Pfad auf Antwort, Struktur und Bedingungen prüfen. Kein erfolgreiches Feed-Laden behauptet.
