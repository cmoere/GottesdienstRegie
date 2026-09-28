# GottesdienstRegie V61 – Start, Audio und Spotify-Verweise

## Ziel

Version 0.61.0 behebt den schwarzen Produktionsstart, vereinheitlicht den Start von ON AIR und Testbetrieb, macht Hintergrund-Audio präziser sichtbar und steuerbar, ergänzt abschaltbare Bedientöne und führt einen regelkonformen Spotify-Such- und Verweisworkflow ein.

## Leitplanken

- Spotify-Inhalte werden nicht heruntergeladen, eingebettet, automatisch gestartet, mit Folien synchronisiert oder über die Ausgabe verbreitet.
- Spotify dient ausschließlich der autorisierten Kontoverbindung, Suche, Anzeige von Metadaten und dem manuellen Öffnen eines Titels in Spotify.
- Automatische Ablaufwiedergabe bleibt lokalen oder anderweitig rechtmäßig bereitgestellten Audiodateien vorbehalten.
- Vor- und Nachprogramm bleiben feste Loops. Ihre zulässigen Elemente können weiterhin hinzugefügt werden; die Loop-Eigenschaft ist nicht abschaltbar.
- Bedientöne beeinflussen niemals Präsentations-, Radio-, Video- oder Hintergrund-Audio.

## Produktionsstart und Fehlerzustand

Der schwarze Startbildschirm entsteht, weil der kompilierte Electron-Einstieg seit V60 unter `dist-electron/electron/main.js` liegt, der Rendererpfad aber noch relativ zur vorherigen Verzeichnisstruktur berechnet wird. Der Produktionspfad muss unabhängig vom Einstiegsverzeichnis zuverlässig auf `dist/index.html` zeigen.

Ein Paket-Regressionscheck baut Electron aus einem bereinigten Ausgabeverzeichnis und prüft, dass Einstieg, Preload und Rendererdatei gemeinsam erreichbar sind. Kann der Renderer trotzdem nicht geladen werden, zeigt das Bedienfenster nach begrenzter Wartezeit einen verständlichen Ladefehler mit „Erneut versuchen“ statt dauerhaft leer zu bleiben.

## Gemeinsame Startauswahl

ON AIR und Testbetrieb verwenden dieselbe reine Funktion zur Auswahl der ersten aktiven Folie. Die Reihenfolge folgt dem tatsächlichen Ablauf:

1. erste aktive Folie im Pre-Loop beziehungsweise Vorprogramm,
2. erste aktive Folie im Bereich Ankommen/Warm-up,
3. erste aktive Folie im Gottesdienst,
4. danach weitere benutzerdefinierte Bereiche und Nachprogramm.

Deaktivierte Elemente und Folien sowie leere Bereiche werden übersprungen. Existiert eine aktive Pre-Loop-Folie, müssen ON AIR und Testbetrieb immer dort beginnen – unabhängig von Editor-Auswahl, Vorschauposition oder zuletzt live gezeigter Folie.

## Vor- und Nachprogramm

Vor- und Nachprogramm bleiben zwingende Loop-Bereiche. Das Hinzufügen zeigt ausschließlich die dafür erlaubten Vor-/Nachprogramm-Elemente und erzeugt das neue Element im angeforderten Bereich. Die direkten Abschnittsaktionen dürfen nicht versehentlich auf den Gottesdienst oder den aktuell ausgewählten anderen Bereich umleiten.

## Hintergrund-Audio

Eine Audiozuweisung färbt nicht länger die gesamte Ablaufzeile oder Folienkachel blau. Ausschließlich das Lautsprechersymbol kennzeichnet den Zustand:

- Blau und ausgefüllt: Hintergrund-Audio beginnt hier oder läuft an dieser Stelle weiter.
- Rot mit X: Hintergrund-Audio wird hier beendet.
- Neutral: kein geplanter Audiozustand.

„Hintergrund-Audio stoppen“ ist an einzelnen Ablaufelementen und auf Abschnittsebene verfügbar. Ein Abschnitts-Stop-Cue wirkt vor dem ersten darin folgenden Element beziehungsweise beim Abschnittswechsel. Eine neue Audiozuweisung am selben Ziel entfernt einen widersprüchlichen Stop-Cue.

Alle sichtbaren Bezeichnungen, Hilfetexte und Zustände werden über die vorhandene Anwendungslokalisierung ausgegeben. Fehlt eine Übersetzung, wird die deutsche Fassung verwendet; der englische Quelltext „Stop background music“ darf in einer deutsch eingestellten Oberfläche nicht erscheinen.

## Bedientöne

Unter Einstellungen → Audio wird eine standardmäßig aktive Option „Bedientöne wiedergeben“ ergänzt. Sie steuert ausschließlich kurze Rückmeldungen der Bedienoberfläche, darunter abgeschlossene Nachrichten/Aktionen, Hinweise und vergleichbare Systemtöne.

Die vorhandene Audio-Route für Bedien-/Benachrichtigungstöne bleibt für Ausgang und Lautstärke zuständig. Ist die globale Option deaktiviert, erzeugt kein Bedienereignis einen Ton. Visuelle Rückmeldungen bleiben unverändert sichtbar.

## Spotify-Verbindung

### Autorisierung

Spotify verwendet Authorization Code mit PKCE. Die Anwendung enthält kein Client-Secret. Der Anmeldevorgang öffnet die offizielle Spotify-Autorisierung im Systembrowser und kehrt über einen registrierten lokalen Callback beziehungsweise einen sicheren App-Link zurück.

Access- und Refresh-Token werden in der Desktop-App ausschließlich über den verschlüsselten Systemspeicher abgelegt. Die Webversion speichert keine langlebigen Spotify-Tokens unverschlüsselt. Abgelaufene Access-Tokens werden erneuert; Trennen entfernt alle lokalen Spotify-Anmeldedaten.

Unter Einstellungen → Audio → Spotify erscheinen Verbindungsstatus, Kontoname, Verbinden/Trennen und ein Hinweis auf Spotify Premium sowie die eingeschränkte Verwendung. Ohne konfigurierte Client-ID bleibt der Bereich sichtbar und erklärt die notwendige Einrichtung, ohne einen funktionslosen Login zu starten.

### Suche und gespeicherte Verweise

Der Audiobrowser erhält den Bereich „Spotify“. Nach erfolgreicher Verbindung sucht er nach Titel, Interpret oder Album. Treffer zeigen Cover, Titel, Interpret, Album und Dauer. Mehr Ergebnisse können nachgeladen werden.

Beim Hinzufügen entsteht kein lokales Audiomedium, sondern ein `spotifyTrackReference` mit mindestens Spotify-URI, Web-URL, Titel, Interpret, Album, Cover-URL und Dauer. Tokens oder Kontodaten werden niemals in Präsentationen gespeichert.

Erreicht die Bedienperson den Verweis im Ablauf, zeigt GottesdienstRegie „In Spotify öffnen“. Die Aktion öffnet die offizielle Spotify-App oder Webseite. Sie startet weder automatisch noch steuert sie ON AIR, Testbetrieb, Timer oder Folienwechsel. Damit bleibt die endgültige Wiedergabe eine bewusste, externe Nutzeraktion.

### Spotify-Fehlerfälle

- Abgebrochene oder verweigerte Anmeldung lässt die bisherige Verbindung unverändert.
- Netzwerk- und Ratenlimitfehler bieten „Erneut versuchen“ und blockieren den restlichen Audiobrowser nicht.
- Fehlendes Premium oder unzureichende Berechtigungen werden verständlich erklärt.
- Entfernte beziehungsweise nicht verfügbare Titel behalten ihre gespeicherten Metadaten, werden aber als momentan nicht verfügbar gekennzeichnet.
- Ein abgelaufenes, nicht erneuerbares Token trennt die Sitzung kontrolliert und fordert eine neue Anmeldung an.

## Architektur

- Eine reine Startauswahlfunktion wird von ON AIR und Testbetrieb gemeinsam verwendet.
- Audiozustand und Stop-Cues bleiben im bestehenden Ablaufmodell; Darstellung und Abschnittsaktionen verwenden denselben abgeleiteten Audiostatus.
- Eine globale Präferenz steuert Bedientöne zentral vor jeder Tonerzeugung.
- `SpotifyAuthService` kapselt PKCE, Callback, Tokenerneuerung und sicheren Speicher.
- `SpotifyCatalogService` kapselt Suche und Seitennavigation und liefert ausschließlich normalisierte Metadaten.
- Spotify-Verweise sind ein eigener serialisierbarer Typ ohne Wiedergaberechte oder Token.
- Desktop- und Webplattform stellen explizite Spotify-Fähigkeiten bereit; nicht unterstützte Umgebungen zeigen einen erklärenden Fallback.

## Datenschutz und Sicherheit

- PKCE-State und Code-Verifier werden kryptografisch zufällig erzeugt und vor Callback-Verarbeitung geprüft.
- Redirect-Ziele, Spotify-URLs und externe Öffnungsaktionen werden gegen erlaubte Hosts und Schemas validiert.
- Tokens erscheinen nicht in Logs, Präsentationsdateien, Cloud-Synchronisation, Fehlertexten oder Telemetrie.
- Die Anwendung fordert nur die für Profil- und Katalogzugriff erforderlichen Scopes an; Wiedergabe- und Fernsteuerungsscopes werden nicht angefordert.
- Das Trennen der Verbindung löscht Tokenmaterial im sicheren Speicher.

## Tests und Abnahme

- Regressionstest für Produktions-Einstieg, Preload und Rendererpfad aus einem sauberen Build.
- Ladefehleransicht und erneuter Ladeversuch.
- Gemeinsame erste aktive Folie für ON AIR und Testbetrieb mit Pre-Loop, leeren/deaktivierten Bereichen und Fallbacks.
- Korrektes Hinzufügen erlaubter Elemente in Vor- und Nachprogramm.
- Nur das Lautsprechersymbol zeigt Audiozustände; Zeilen und Kacheln bleiben neutral.
- Element- und Abschnitts-Stop-Cues einschließlich widersprüchlicher neuer Audiozuweisung.
- Deutsche und englische Texte sowie deutscher Fallback für fehlende Übersetzungen.
- Bedientöne aktiv/deaktiviert ohne Einfluss auf Präsentationsaudio.
- PKCE-State/Verifier, Callbackprüfung, sichere Tokenspeicherung, Erneuerung und Trennen.
- Spotify-Suche, Pagination, normalisierte Track-Verweise und Fehlerzustände.
- Kein Spotify-Token in gespeicherten Präsentationen und keine automatische Spotify-Wiedergabe.
- Vollständige Unit-Tests, TypeScript-Prüfung, Web-/Desktop-Produktionsbuild, sauberer Installer-Build und V61-Releasewächter vor Veröffentlichung.

## Release

Version, Changelog, ausführliche Release Notes und öffentlicher Versionskatalog werden auf `0.61.0` aktualisiert. Eine Veröffentlichung erfolgt erst nach grünen lokalen Prüfungen und erfolgreichem plattformübergreifendem GitHub-Release-Workflow.
