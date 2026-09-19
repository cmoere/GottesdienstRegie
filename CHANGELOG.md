# Versionshinweise / Release notes

## 0.40.0 – Private Notizen, lokale Übersetzung und sichere Loop-Ausgabe

Version 0.40.0 führt eine lokale automatische Englisch-Deutsch-Übersetzung direkt im Song-Editor ein. Das Sprachmodell läuft nach dem einmaligen Download auf dem Gerät und benötigt keinen API-Schlüssel; Akkorde in eckigen Klammern und bestehende Zeilenumbrüche werden geschützt. Übersetzungen bleiben vor dem Einsatz editierbar und alle sechs vorhandenen Anzeigearten bleiben verfügbar.

Private Präsentations- und Foliennotizen werden getrennt vom synchronisierten Präsentationsdokument im Benutzerkontext dieses Geräts gespeichert. Sie erscheinen niemals auf MAIN, STAGE, LIVESTREAM oder in exportierten Folien. Hintergrundaudio kann zusätzlich nach HTTPS-Radiosendern suchen, diese vorhören und als Stream hinzufügen.

Gemeinwohl-Hinweise sind unter Präsentation → Sonstiges → Extern standardmäßig deaktiviert. Die Konfiguration beschränkt sich auf Einsatzbereich, Dauer, Häufigkeit und QR-Code; Inhalte offizieller Stellen können nicht redaktionell verändert werden und enthalten kein Nutzertracking.

Wetter, Uhr und weitere fachliche Loop-Kerninhalte sind nun von normalen Zusatzebenen getrennt und können nicht versehentlich gelöscht werden. Preview und MAIN verwenden unveränderliche Render-Snapshots, sodass spätere Editoränderungen erst nach dem nächsten bewussten Schalten live werden.

Die Kopfzeile reserviert mehr Platz für native Windows-Schaltflächen und hält Profil sowie Sync erreichbar. Der KI-Motivbereich bleibt in schmalen Fenstern geordnet, numerische Einstellungsfelder besitzen eine verlässliche Mindestbreite und die Equalizerbänder zeigen Tiefen, untere Mitten, Mitten und Höhen mit vollständigen zugänglichen Beschriftungen.

## 0.39.0 – Songübersetzungen, Bildschirmschutz und erweiterte Hilfe

### Songübersetzungen mit sechs Anzeigearten

Im Song-Editor steht unter INHALT bei jeder Lyrics-Folie der neue Button „Übersetzung hinzufügen“ bereit. Die Übersetzung besitzt ein eigenes Sprachfeld und einen eigenen Textbereich, sodass beispielsweise ein englischer Originaltext zusammen mit einer deutschen Übersetzung vorbereitet werden kann, ohne die Grundlyrics zu ersetzen. Wiederholte Abschnitte im Songablauf übernehmen dieselbe Übersetzung; Änderungen laufen über die vorhandene Präsentationsspeicherung und können mit Rückgängig und Wiederholen bearbeitet werden.

Unter Einstellungen → Präsentation → Song stehen sechs Anzeigearten zur Verfügung: Aus, unter der Strophe in Klammern, unter der Strophe ohne Klammern, zeilenweise im Wechsel, nebeneinander in zwei Spalten und nur Übersetzung. Standardmäßig wird die Übersetzung in Klammern ergänzt. Falls für eine Folie keine Übersetzung eingetragen wurde, bleibt der Originaltext sichtbar. Die Eingabe erfolgt manuell; es wird kein Text an einen Übersetzungsdienst gesendet.

Die gemeinsame Folienanzeige unterstützt die Übersetzungen in Vorschau, Thumbnails und MAIN. Beim Senden einer Live-Folie wird die Anzeigeart mitgespeichert, damit eine Änderung in den Einstellungen nicht plötzlich die gerade ausgespielte Folie verändert. Lyric Scrolling bewegt beide Sprachen zusammen. Die gesonderte STAGE-Akkordansicht bleibt bei den Originallyrics. Preflight prüft den zusätzlichen Platzbedarf und warnt vor zu großen Textmengen. Bereits übersetzte Abschnitte werden nicht automatisch neu aufgeteilt; verwende hier den manuellen Folienumbruch und prüfe die Zuordnung beider Sprachen.

### Bildschirm während der Vorbereitung und Präsentation aktiv halten

GottesdienstRegie fordert beim Betriebssystem standardmäßig an, Bildschirmschoner und automatisches Ausschalten des Displays während der geöffneten Anwendung zu verhindern. Der Schalter unter Einstellungen → Allgemein → Fenster & Start kann jederzeit deaktiviert werden und wird für diesen Rechner gespeichert. Wiederholtes Aktivieren erzeugt keine zusätzlichen dauerhaften Anforderungen; beim Abschalten oder normalen Beenden wird der Schutz freigegeben, ohne die persönlichen Energieeinstellungen zu überschreiben.

Der Schutz ist keine Umgehung von Sicherheitsrichtlinien: Manuelles Sperren, das Zuklappen eines Notebooks sowie eigene Energiesparfunktionen von Monitoren oder Projektoren müssen weiterhin berücksichtigt werden. Prüfe die tatsächlich verwendete Geräteumgebung vor dem Gottesdienst.

### Unsplash-Hinweis und verlinkte Bedingungen

Der Unsplash-Bereich im Medienbrowser zeigt den gewünschten Hinweis zu den Nutzungs- und Datenschutzbedingungen jetzt dauerhaft an, auch während die Ergebnisse geladen werden. Die beiden Begriffe sind direkt mit den entsprechenden Unsplash-Seiten verknüpft. Zusätzlich steht der gewünschte Link zur Unsplash+-Lizenz bereit; dieser ist ausdrücklich separat gekennzeichnet und wird nicht als Lizenz sämtlicher Suchergebnisse ausgegeben. Die Desktop-Anwendung erlaubt für diese neuen Verweise nur die konkret hinterlegten HTTPS-Adressen.

### Zustimmung im Windows-Installationsassistenten

Der interaktive Windows-Installer enthält nun eine Seite mit den bereits vorhandenen Nutzungsbedingungen der Gemeinde. Das Zustimmungsfeld muss ausgewählt werden, bevor die Installation fortgesetzt werden kann. Die installierte Anwendung und der Update-Hinweis behalten den Zugang zum vollständigen Text. Stille beziehungsweise automatisierte Installationen haben keine interaktive Lizenzseite; die neue Checkbox gilt für den normalen Windows-Assistenten.

### Ausführlichere, bebilderte Hilfe

Die Hilfe enthält neue Artikel zu Songübersetzungen, Bildschirmschutz und Installation. Die Texte beschreiben die konkreten Menüwege, erklären die Auswirkungen der Einstellungen und nennen typische Fehlerquellen wie ungleiche Zeilenzahlen, zu kleine Textflächen oder abweichende Projektor-Energiesparregeln. Die Themen Erste Schritte und Unsplash wurden ebenfalls überarbeitet und um zusammenhängende Anleitungen ergänzt.

Drei neue, als schematisch gekennzeichnete Abbildungen veranschaulichen den Übersetzungsablauf, den zeitlich begrenzten Bildschirmschutz und den Weg von der Vorbereitung über Preflight zur Live-Ausgabe. Bei einer erfolglosen Hilfesuche wird jetzt erklärt, wie sich die Suche mit kürzeren Begriffen eingrenzen lässt.

### Hinweise vor der Nutzung

Prüfe zweisprachige Songs vor ON AIR in der tatsächlichen Schrift und Ausgabegröße. Übersetzungen können deutlich mehr Platz benötigen als der Originaltext; sie werden nicht ungefragt verkleinert. Die Anzeigeeinstellung gilt für das jeweilige Gerät, während die eingegebenen Übersetzungen zum Song innerhalb der Präsentation gehören. Diese Version führt keinen automatischen Übersetzungsdienst und keine eigenständige neue Cloud-Songbibliothek ein.


## 0.38.0 – Song-Import, Equalizer und Upload-Fortschritt

- Songtexte können direkt über Songbibliothek → Songs importieren … aus TXT-, Markdown-, SONG-, CSV- und JSON-Dateien übernommen werden.
- Audioeinstellungen enthalten jetzt einen eigenen Equalizer-Unterpunkt mit Standardmodus, eigener Kurve und Zurücksetzen.
- Medien-Uploads zeigen einen kompakten Fortschrittsbalken mit Prozentanzeige; der laufende Upload kann nicht versehentlich abgebrochen werden.

## 0.37.1 – Update-Hinweis zu Nutzungsbedingungen

- Beim Herunterladen einer Aktualisierung wird jetzt deutlich angezeigt: „Mit der Aktualisierung stimmst du den Nutzungsbedingungen zu.“
- „Nutzungsbedingungen“ ist direkt anklickbar und öffnet die vollständige Fassung.

## 0.37.0 – Testbetrieb und Nutzungsbedingungen

- Testbetrieb neben ON AIR ergänzt: MAIN und STAGE können ohne verknüpfte Veranstaltung geprüft werden.
- Testbetrieb verwendet weiterhin Berechtigungen, Preflight und die reale Bildschirmzuordnung.
- LIVESTREAM, LOBBY, NOTES und Recording werden im Testbetrieb nicht gestartet.
- Vor dem Start werden die tatsächlich verwendeten Bildschirme angezeigt und ausdrücklich bestätigt.
- Testbetrieb ist lokal und vorübergehend; er wird nicht gespeichert und vergibt keine Belohnungen.
- Nutzungsbedingungen mit Abschnitten zu Verantwortlichkeit, Livebetrieb, Medienrechten, Cloud-Daten und Fehlermeldungen ergänzt.
- Anmeldung verlangt eine ausdrückliche Bestätigung; die vollständige Fassung bleibt jederzeit unter Hilfe → Nutzungsbedingungen erreichbar.
- Neue Funktionslinie 0.37 statt weiterer Unterversionen der 0.36-Linie.

## 0.36.16 – Loop-Abschnitte direkt bearbeiten

- Eigene Hinzufügen-Schaltflächen für leere VORPROGRAMM- und NACHPROGRAMM-Abschnitte ergänzt.
- Loop-Elemente stehen im passenden Bereichsmenü sofort oben und benötigen kein zuvor ausgewähltes ServiceItem.
- Das erste Hinzufügen aus dem VORPROGRAMM schaltet dessen Loop-Unterstützung kontrolliert frei; die zentrale Placement-Prüfung bleibt erhalten.
- Abschnittsaktionen in einer gemeinsamen Gruppe angeordnet, damit LOOP, Hinzufügen, Audio und Zeit/Dauer nicht mehr überlappen.
- Livebetrieb, Synchronisierung, MAIN, STAGE, Audio und Recording bleiben unverändert priorisiert.

## 0.36.15 – Menüleiste und Vorschau-Scrollen

- Abgeschnittenes Menü bei Auswahl entfernter Folien behoben: Die äußere App-Hülle scrollt nicht mehr durch Fokus oder automatische Sichtbarkeitskorrekturen.
- Überhohe App-Mindesthöhe entfernt; Profil, Sync und Fensterbuttons bleiben mit der Menüleiste ausgerichtet.
- Electron-Regressionstest um Folienauswahl und Fokus bei drei Fenstergrößen ergänzt.

## 0.36.14 – Song- und Element-Editor

- Lange Song-Lyrics lassen sich anhand der tatsächlichen Folienkapazität automatisch auf mehrere Folien aufteilen; Überläufe werden vor ON AIR gekennzeichnet.
- STAGE erhält eine kompakte Songansicht mit aktuellen Lyrics, optionalen Akkordzeilen und dem nächsten Inhalt, ohne MAIN zu verändern.
- Canvas-Bearbeitung mit Raster, konfigurierbarem Snap, Hilfslinien-Snap, Tastatur-Nudging und stabiler Mausgeste mit einem Commit beim Loslassen.
- Mehrfachauswahl unterstützt Ausrichten und gleichmäßiges Verteilen; das Ebenen-Panel bündelt Auswahl, Sichtbarkeit, Sperren und Drag-and-drop-Reihenfolge.

## 0.36.13 – Loop-Elemente und Screenmeldung

- PRE-/POST-LOOP-Elemente mit zentraler Placement-Prüfung und eigenem Rotationscontroller ergänzt.
- Dynamische Meldungen, Geburtstage, Veranstaltungen, Wetter, Quiz, Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte, Heute bei uns und Nächste Termine verfügbar.
- Screenmeldung-Referenzdateien integriert; Public-/Zeit-/Placement-Filter, leere Meldungen überspringen und Safe-Switch-Vorschau ergänzt.
- Wetterquelle auf `https://weather.crbnm06.workers.dev` festgelegt; 20 Sekunden sind voreingestellt und als Empfehlung markiert, die Anzeigedauer bleibt pro Element änderbar. Preload und Offline-Skip bleiben aktiv.
- Loop-Diagnosen als nicht-blockierende Preflight-Warnungen ergänzt; MAIN/STAGE/Audio/Recording bleiben priorisiert.

## 0.36.13 – 2026-09-13

- Vorschau-Shell auf die tatsächlich vorhandenen fünf Bereiche korrigiert.
- Große ungenutzte Fläche unter Einzelvorschau/Folienübersicht und überlagernde Statuszeile behoben.
- Regressionstest mit tatsächlicher CSS-Ladereihenfolge, zwei Fenstergrößen, beiden Vorschauansichten und Timeline-/Moduswechsel ergänzt.

## 0.36.12 – 2026-09-13

- Optionales Lyric Scrolling für MAIN mit lokaler Editorvorschau, Präsentations-/Song-Einstellungen, Preflight, Undo/Redo und Dokumentpersistenz.
- Mausgesten im Canvas: lokale rAF-Vorschau, ein Commit beim Loslassen, Abbruch ohne History-Eintrag.
- Eigene F11-Fensterbuttons und reservierter Platz für Profil und Sync; lange Namen überdecken Sync nicht.
- Native Rechtschreib-Kontextmenüs mit Vorschlägen, Lernen und Standard-Textaktionen.
- Website-Einstellungen gruppiert, Formularfreigabe und Referrer-Wahl ergänzt, kein URL-Autofokus, Identitäten verknüpfter Websites erhalten.
- Stille lokale Autosaves; Cloud-Erreichbarkeitsprüfung alle fünf Minuten, keine Behauptung vollständiger Cloud-Synchronisierung.
- Alle 59 archivierten Versionen erhalten eine zusätzliche Einordnung in App und Web.
- Noch offen: authentifizierte Cloud-Songbibliothek, verwaltete Library-Arrangements und vollständige Design-Vererbung. Lange Lyrics vor ON AIR aufteilen; die Schrift wird nicht automatisch verkleinert.

## 0.36.11

- Kompakter Songeditor mit größerem Lyrics-Bereich und separatem Metadaten-Tab.
- Strukturierte Songabschnitte, wiederholbare Ablauf-Chips und echte Foliengenerierung.
- Song-Suche in gespeicherten Präsentationen, wirksame Textgestaltung und Akkordtransposition.

## 0.36.10

- Windows-Startabsturz durch deaktiviertes Titlebar-Overlay behoben.
- Fensterwechsel vom Ladefenster zum Arbeitsbereich mit einem Electron-Laufzeittest geprüft.

## 0.36.9

- Kompaktes Startfenster ohne äußere Hintergrundfläche.
- Nicht überspringbare Speicheranzeige beim Beenden mit lokaler Speicherung vor dem Schließen.
- Ladefenster und gespeicherte Arbeitsbereichsgröße getrennt.

## 0.36.8 – 2026-09-11

- Songeditor mit Tabs für Inhalt, Ablauf, Design, STAGE und LIVESTREAM
- Präsentationsspezifische Song-Overrides für Arrangement, Verse Order, Tonart, Design, Texteffekte und Ausgabelayouts
- STAGE-Akkorde, Current/Next und Livestream-Lower-Third direkt am Song konfigurierbar
- Overrides gesammelt zurücksetzen, ohne die Songbibliothek oder gespeicherte Arrangements zu verändern

## 0.36.7 – 2026-09-11

- Start-Synchronisierung kann übersprungen werden, während die gespeicherte Anmeldung erhalten bleibt
- Unsplash-Bilder lassen sich als dauerhafte Favoriten markieren
- KI-Video-Fehler bleiben im Generator und wechseln nicht mehr ungewollt zu Unsplash
- Text, QR-Codes und Vordergrundmedien können direkt auf der Folie per Maus verschoben und skaliert werden
- Präzise Positions-, Größen-, Drehungs- und Deckkraftwerte für zusätzliche Folienelemente
- Neue Vorlagen für kompakte, klassische, Jugend- und Abendgottesdienste
- Überlauf der Inhaltswerkzeugleiste und Ausrichtung des Deckkraftreglers korrigiert

## 0.33.1 – 2026-09-09

- Kritischen Startfehler aus 0.33.0 behoben: Nach dem Ladescreen erscheint die Bedienoberfläche wieder vollständig
- Instabilen Tastenkürzel-Selektor im Ablauf durch einen gecachten Zustandswert ersetzt
- Globale Fehlerabsicherung ergänzt, damit ein unerwarteter Oberflächenfehler nicht mehr als leerer Bildschirm erscheint

## 0.33.0 – 2026-09-09

- Neuer bebilderter Einführungsrundgang; jederzeit erneut über Hilfe → Benutzeroberfläche kennenlernen erreichbar
- Medienbibliothek mit funktionierenden Cloud-, Community- und Unsplash-Bereichen, eigenem Unsplash-Hinweis sowie echten Bibliotheksfiltern
- „Mehr laden“ und „Weniger anzeigen“ für große Mediensammlungen; treffende Leermeldung mit Filter-zurücksetzen-Aktion
- Ladeanzeige für Veranstaltungen, deutlich erweiterte Tastenkürzel und Sicherheitsabfrage vor dem Zurücksetzen
- Element-Umbenennen als zuverlässiger App-Dialog und reparierte Vorschau des Standardübergangs
- Versionshinweise erhalten ab dieser Version ein neues, versionsbezogenes Bild

## 0.32.0 – 2026-09-09

- Kontextmenü folgt dem Hell-/Dunkelmodus; „Mit dieser Folie ON AIR gehen“, Umschalt+F5 und Strg+R ergänzt
- Dauerhaften Cloudfehler behoben: nicht vorhandenes Medien-Repository ersetzt, API-Fallback und sicherer Lesemodus ergänzt
- Unsplash-App-Zugang vorkonfiguriert; keine erneute Schlüsselabfrage nötig
- Hilfezentrum verbreitert, Navigation ohne horizontales Abschneiden, themenspezifische Screenshot-Ausschnitte und neue Cloud-/Unsplash-Anleitungen
- Eigene öffentliche Fehlerseite im GottesdienstRegie-Design mit sicherer Übergabe per URL-Fragment, Kopieren, Download und Systemfreigabe

## 0.31.0 – 2026-09-08

- Neues natives ServiceItem-Kontextmenü mit kontextabhängigen Befehlen, Desktop-Tastatursteuerung und korrekten Windows-/macOS-Shortcuts
- Mehrfachauswahl, verknüpfte Elemente, Gruppierung, Ausblenden sowie atomare Undo-/Redo-Transaktionen
- Gerenderte Folien können in die Systemzwischenablage kopiert oder über den Betriebssystemdialog als PNG gespeichert werden
- Veranstaltungsauswahl mit HEUTE, MORGEN und KOMMEND, bewusstem Speichern sowie Schließen per Escape und Außenklick
- Layoutfehler bei Servicezeit und Veranstaltungskopf korrigiert
- Schwarz ist wirklich textlos; Amen lässt den Folienhintergrund sichtbar
- Neutraler Startbildschirm ohne vollflächiges Hintergrundfoto und deutlich erweiterte kontextbezogene Hilfe

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
