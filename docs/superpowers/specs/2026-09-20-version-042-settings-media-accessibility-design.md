# GottesdienstRegie 0.42.0 – Sprachpakete, Medienzuverlässigkeit und Bedienoberfläche

## Ziel

Version 0.42.0 macht die in 0.41 eingeführten Übersetzungs- und Objektwerkzeuge nachvollziehbar verwaltbar, repariert die gemeldeten Medien- und Layoutfehler und erweitert die gerätespezifische Bedienoberfläche. Folieninhalte und Ausgabefenster bleiben von Bedienhilfen und Plattformeffekten getrennt.

## Leitlinien

- In der Oberfläche werden keine Emoji-Zeichen als Icons eingesetzt. Vorhandene Material Symbols beziehungsweise eigene SVG-Pfade werden verwendet.
- Einstellungen, Bedienhilfen und Plattformeffekte dürfen MAIN, STAGE, LIVESTREAM, LOBBY und andere Ausgaben nicht verändern.
- Ein Sprachpaket gilt nur dann als heruntergeladen, wenn das benötigte lokale Modell vollständig und mit passender Versionsinformation verfügbar ist.
- Loop-Elemente und normale ServiceItems werden bereits in der Auswahl getrennt; ungültige Aktionen werden zusätzlich an der Store-Grenze abgewehrt.
- Fehler werden am Ursprung behoben und durch Regressionstests abgesichert.

## 1. Sprachpaketverwaltung

Unter **Einstellungen → Präsentation → Song → Übersetzungen** entsteht ein eigener Bereich „Sprachpakete“.

Jede Sprache zeigt:

- Flagge als CSS-/Bildressource oder standardisiertes Länderkennzeichen, nicht als Emoji-Text;
- deutschen Namen und Eigenbezeichnung;
- Zustand „Nicht geladen“, „Wird geladen“, „Bereit“, „Fehler“ oder „Aktualisierung verfügbar“;
- lokale Modellversion und Größe, sofern bekannt;
- Aktionen Herunterladen, Abbrechen, Wiederholen und Entfernen.

Die Liste ist durchsuchbar und kann nach Zustand gefiltert werden. Laufende Downloads zeigen einen Spinner, Prozentwert und übertragenes Volumen, wenn die Quelle dieses meldet. Mehrere Downloads werden in eine Warteschlange gestellt, damit CPU, Speicher und Netzwerk nicht unkontrolliert parallel belastet werden.

Das Modell wird über einen Electron-Dienst in einem versionsgebundenen Ordner des Benutzerprofils verwaltet. Ein Manifest enthält Sprachrichtung, Modellkennung, Revision, erwartete Dateien, Prüfsummen, Gesamtgröße, Status und letzten Fehler. Erst nach vollständigem Download, Prüfung und atomarem Umbenennen wechselt der Zustand zu „Bereit“. Abgebrochene oder fehlerhafte temporäre Dateien gelten nicht als installiert.

Die fünfzehn Standardsprachen werden nach dem Programmstart nicht blind als installiert markiert. Stattdessen prüft der Dienst ihren echten Zustand. Automatische Vorbereitung läuft nur für ausdrücklich konfigurierte Standardpakete und mit niedriger Priorität. Alle weiteren Sprachen bleiben sichtbar und können manuell geladen werden.

Eine gespeicherte Übersetzung enthält Zielsprachcode und Modellrevision, jedoch nicht das Modell. Auf anderen Geräten bleibt der übersetzte Text lesbar. Nur Neuübersetzen beziehungsweise Regenerieren verlangt das passende lokale Paket.

## 2. Abschnittsspezifische Hinzufügen-Menüs

Die zentrale `itemPlacementPolicy` bleibt die einzige fachliche Quelle.

- Vor- und Nachprogramm zeigen ausschließlich Meldungen, Geburtstage, Veranstaltungen, Wetter, Quiz, Loop-Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte, Heute bei uns und Nächste Termine.
- Service, Ankommen und andere normale Bereiche zeigen ausschließlich reguläre ServiceItems.
- Song, normale Bibel, Inhalt, Bild, Video, Audio, Webseite, PDF, Timer, Slideshow, Videoeingang, Stage-Nachricht und Schnellanzeige werden im Vor-/Nachprogramm nicht angeboten.
- Hinzufügen, Drag-and-drop, Verschieben, Einfügen, Duplizieren und Legacy-Laden verwenden dieselbe Policy.
- Ungültige Altbestände werden sichtbar markiert und nicht automatisch gelöscht.

## 3. Präsentations- und Foliennotizen

Links neben „Präsentationsnotizen“ steht ein Material-Symbol, kein Emoji. Der Editor zeigt dauerhaft nur den Satz:

> Diese Notiz ist nur für dich sichtbar.

Temporäre Zustände wie „Speichert …“, „Gespeichert“ und Fehlermeldungen besitzen eigene ARIA-Live-Ausgabe. „Gespeichert“ verschwindet spätestens nach fünf Sekunden; danach bleibt nur der kurze Privatsphäre-Satz. Fehler bleiben sichtbar, bis erneut erfolgreich gespeichert oder der Editor geschlossen wurde.

Rich-Text-Funktionen, lokaler Speicher, Kontotrennung und der Ausschluss von Synchronisierung und Ausgaben bleiben erhalten.

## 4. Popup- und Layoutkorrekturen

Die Screenshots zeigen, dass Sprach- und Objekt-Popovers über die verfügbare Editorfläche hinauswachsen und benachbarte Inhalte verdecken. Ursache ist die absolute Positionierung relativ zu schmalen Werkzeugleisten ohne Viewport-Kollisionserkennung.

Ein gemeinsamer `AnchoredPopover` übernimmt:

- Messung von Anker, Popup und sichtbarem Arbeitsbereich;
- automatisches Öffnen nach oben oder unten;
- horizontales Verschieben innerhalb des Viewports;
- maximale Höhe mit internem Scrollbereich;
- Schließen bei Escape, Außenklick und Fokusverlust;
- Fokusführung und passende Dialog-/Listenrollen.

Sprachwahl und 2D-Galerie verwenden diese Komponente. Auf schmalen Flächen reduziert sich die Spaltenzahl der Objektgalerie automatisch.

## 5. Video-Hinzufügen

Der bestehende Fehler wird entlang dieses Datenwegs reproduziert und geprüft:

`Hinzufügen-Menü → Medienfenster öffnen → Asset auswählen → media:selected → ServiceItem erzeugen → Videoelement anlegen`.

Der aktuelle Aufruf öffnet den Medienbrowser mit dem unspezifischen Zweck `item`; dadurch fehlt eine eindeutige Zieltyp-Information für den Rückkanal. Die Reparatur führt einen typisierten Auswahlkontext ein, der `video`, Zielabschnitt und gewünschte Aktion enthält. Direkte URL, YouTube/Vimeo und lokaler beziehungsweise Cloud-Medienbrowser bleiben getrennte, verständliche Wege. Abbruch erzeugt kein leeres Element.

Regressionstests prüfen lokale Datei, Cloud-Asset, URL, Abbruch und falschen Medientyp.

## 6. Radiosender

Der Radiosenderfluss wird an den Grenzen Suche, Normalisierung, Vorschau und Übernahme instrumentiert. Die Benutzeroberfläche zeigt konkrete Zustände: Verbindung fehlgeschlagen, keine Ergebnisse, Stream nicht erreichbar und Format nicht unterstützt.

Die Suche verwendet weiterhin ausschließlich HTTPS-Endpunkte. Der Dienst probiert die konfigurierten Radio-Browser-Mirrors deterministisch mit Zeitlimit und begrenzten Antworten. Ergebnisse ohne stabile HTTPS-Stream-URL werden nicht als hinzufügbar angeboten. Vorschau und Übernahme verwenden dieselbe normalisierte URL. Das Hinzufügen übernimmt Sendername, Stream-URL, Codec, Bitrate und Herkunft in `BackgroundAudioTrack`.

Tests decken Mirror-Ausfall mit Fallback, leere Ergebnisse, HTTP-Ausschluss, Vorschau und Übernahme ab.

## 7. Echte 2D-Objekte

Die Galerie bleibt durchsuchbar, verwendet aber keine Emoji-Symbole mehr. Jede Form erhält eine eigene SVG-Definition beziehungsweise einen geprüften CSS-Pfad. Unbekannte Formen fallen sichtbar auf ein neutrales Platzhaltersymbol zurück und nicht still auf ein Rechteck.

Mindestens folgende Gruppen werden vollständig gerendert:

- Grundformen und Polygone;
- Pfeile und Richtungsformen;
- Status- und Informationssymbole;
- kirchliche Motive wie Kreuz, Kirche, Bibel, Fisch, Kerze und Taube.

Katalogeintrag und Renderer teilen dieselbe Definition, damit kein auswählbarer Eintrag ohne Darstellung existieren kann. Tests prüfen, dass jede Katalog-ID eine Renderdefinition besitzt.

## 8. Anzeigegröße und Barrierefreiheit

Unter **Einstellungen → Allgemein** steht ein fünfstufiger Regler:

1. Sehr klein
2. Klein
3. Standard
4. Groß
5. Sehr groß

Der Regler rastet ausschließlich auf diesen Stufen ein. Er skaliert die Bedienoberfläche über zentrale CSS-Variablen und wird gerätelokal gespeichert. Ausgaben bleiben unverändert.

Unter **Barrierefreiheit** kommen hinzu:

- größere Bedienelemente;
- verstärkte Fokusmarkierungen;
- erhöhte Text- und Rahmenkontraste;
- reduzierte Transparenz;
- Animationen reduzieren;
- kompakte Bedienoberfläche;
- wechselnde Login-Hintergründe;
- optional unterstrichene interaktive Texte;
- Status nicht nur durch Farbe kennzeichnen.

Unverträgliche Kombinationen werden nicht verborgen; die Vorschau der Bedienoberfläche aktualisiert sich sofort. Einstellungen besitzen erklärende Sätze und werden lokal gespeichert.

## 9. macOS 26 Liquid Glass

Auf macOS 26 und neuer erhält die Operatoroberfläche eine optionale, standardmäßig aktive Plattformdarstellung. Sie betrifft ausschließlich Navigation, Werkzeugleisten, Sidebars, Popovers und vorübergehende Bedienelemente. Inhaltsflächen, Folienvorschau und sämtliche Ausgaben erhalten kein Liquid Glass.

Da Electron keine native AppKit-View-Hierarchie für den React-Inhalt bereitstellt, besteht die Umsetzung aus zwei Ebenen:

1. Das Electron-Fenster aktiviert auf unterstützten macOS-Versionen systemnahe Transparenz/Vibrancy und eine passende Titelleiste.
2. Die Weboberfläche verwendet gezielte, zugängliche Materialien mit `backdrop-filter`, Systemfarben und reduzierter Transparenz als Fallback.

Bei aktivierter macOS-Einstellung „Transparenz reduzieren“ oder der entsprechenden App-Barrierefreiheitseinstellung wird der Effekt abgeschaltet. Windows und Linux bleiben unverändert. Die Gestaltung folgt Apples Empfehlung, Liquid Glass nur als funktionale Ebene für Navigation und Controls einzusetzen.

## 10. Einzelvorschau

Der dekorative Schatten hinter der Folie in der Einzelvorschau wird entfernt. Auswahlrahmen, Übergangsvorschau und Canvas-Grenze bleiben erkennbar. Rasteransicht, Thumbnails und Ausgabefenster werden nicht verändert.

## 11. Release und Migration

Zielversion ist **0.42.0**. Bestehende Präsentationen bleiben kompatibel. Neue Einstellungswerte erhalten sichere Standards:

- Anzeigegröße: Standard;
- Liquid Glass auf macOS 26+: aktiv, sofern Transparenz nicht reduziert wird;
- neue Barrierefreiheitsoptionen: aus;
- vorhandene Einstellungen werden übernommen;
- bisher fälschlich als installiert markierte Sprachpakete werden beim ersten echten Scan korrigiert.

Die Release Notes beschreiben jeden gelieferten Bereich ausführlich. Das Update-Manifest enthält genau einen aktuellen Eintrag 0.42.0; der Windows-Installer sowie Update-Dateien für Windows, macOS und Linux werden veröffentlicht.

## Abnahmekriterien

- Die Sprachpaketseite zeigt echten Zustand und verwaltet Downloads vollständig.
- Vor-/Nachprogramm bieten keine regulären ServiceItems an.
- Notizen verwenden keine Emojis; der Erfolgsstatus verschwindet nach höchstens fünf Sekunden.
- Beide gemeldeten Popovers bleiben vollständig im sichtbaren Arbeitsbereich.
- Video kann über jeden unterstützten Weg hinzugefügt werden.
- Radiosuche liefert entweder verwendbare Sender oder eine konkrete Fehlermeldung.
- Jeder 2D-Katalogeintrag besitzt eine echte Darstellung; „Kirche“ ist kein Rechteck.
- Fünf Anzeigegrößen und neue Barrierefreiheitsoptionen wirken nur auf die Bedienoberfläche.
- macOS 26 verwendet die beschriebene Plattformdarstellung, ältere Systeme nutzen einen sicheren Fallback.
- Die Einzelvorschau besitzt keinen Folienschatten.
- Typecheck, Domainprüfungen, Build, Installer und Releaseprüfung sind erfolgreich.
