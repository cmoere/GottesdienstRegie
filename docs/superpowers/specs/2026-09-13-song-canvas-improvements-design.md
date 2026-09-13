# Song-Editor und Element-Editor – Design

## Ziel

Der Song-Workflow soll lange Lyrics sicher für Folien aufteilen, Verse-Abläufe schnell bearbeiten und MAIN/STAGE klar getrennt darstellen. Der Element-Editor soll präzise und ruhig arbeiten, ohne während einer Mausbewegung unnötige Dokument- oder History-Schreibvorgänge auszulösen.

## Song-Editor

### Ablauf und automatische Folienaufteilung

Die bestehende `SongStructure` bleibt die fachliche Quelle für benannte Songabschnitte und deren Reihenfolge. Die Verse-Chips bleiben wiederholbar und werden per Drag-and-drop mit klarer Drop-Zone sortiert. Ein reiner Layout-Helper berechnet aus Textfläche, Schriftgröße, Zeilenhöhe und Innenabstand eine sichere maximale Zeilenanzahl. Lange Abschnitte werden bei der Foliengenerierung an Absatz- oder Zeilengrenzen geteilt; bestehende manuelle Folienumbrüche und die Grundlyrics bleiben erhalten.

Automatisch erzeugte Teilfolien erhalten stabile IDs und eine nachvollziehbare Verknüpfung zum Ursprungsabschnitt. Der Benutzer kann die Trennung anschließend manuell ändern. Es werden keine Liedtexte dupliziert, nur die resultierende Folienfolge wird erweitert.

### Überlauf und Preflight

Der Song-Editor zeigt Überlauf direkt am Abschnitt und in der Folienübersicht. `lyricPreflight` bleibt die gemeinsame Prüfinstanz für Vorbereitung und Live-Start. Kritische Live-Probleme bleiben blockierend, reine Layout-Hinweise bleiben Warnungen. Ein Klick auf die Warnung springt zum betroffenen Abschnitt.

### STAGE und kompakter Kopfbereich

Titel, Arrangement und Tonart werden in einer kompakten Kopfzeile zusammengefasst. MAIN zeigt nur Lyrics. STAGE verwendet strukturierte Akkorddaten, aktuelle und nächste Folie sowie den Präsentations-Override, ohne MAIN-Daten zu verändern. LIVESTREAM bleibt ein eigener Ausgabebereich.

## Element-Editor

### Geometrie und Mausbedienung

Die Canvas-Geste arbeitet mit Pointer-Capture, lokaler `requestAnimationFrame`-Vorschau und genau einem Store-Commit beim Loslassen. Abbruch, Kontextwechsel und Pointer-Cancel verwerfen den Entwurf. Die bestehende Undo-/History-Logik erhält dadurch einen Schritt pro Geste statt pro Pointermove.

### Raster, Hilfslinien und Magnetismus

Rastergröße und Magnetismus werden als lokale Editorpräferenzen geführt. Verschieben und Skalieren rasten optional am Raster, an Folienmitte/-rändern und an benachbarten Elementkanten ein. Die tatsächliche Live-Geometrie bleibt unverändert, bis die Geste abgeschlossen ist.

### Mehrfachauswahl, Ausrichtung und Ebenen

Mehrfachauswahl erhält Befehle für links, rechts, oben, unten, horizontal/vertikal zentrieren sowie gleichmäßig horizontal/vertikal verteilen. Ein Ebenen-Panel zeigt Reihenfolge, Sichtbarkeit und Sperrstatus; Drag-and-drop ändert nur `zIndex` und erzeugt einen atomaren Undo-/History-Eintrag.

### Tastatur

Bei fokussierter Canvas verschieben Pfeiltasten um 1 Pixel, Umschalt+Pfeil um 10 Pixel. Gesperrte oder nicht sichtbare Elemente reagieren nicht. Browser-/App-Shortcuts und ON-AIR-Befehle behalten Vorrang.

## Live- und Fehlergrenzen

- Editorberechnungen laufen außerhalb des Live-Ausgabepfads.
- MAIN, STAGE, Audio und Recording werden durch Layoutvorschau oder Folienaufteilung nicht blockiert.
- Ungültige Geometriewerte werden begrenzt; bei Fehlern bleibt der letzte gültige Zustand sichtbar.
- Automatische Folienaufteilung darf keine Folie ohne Inhalt erzeugen.

## Teststrategie

- Reine Tests für Folienaufteilung, stabile Abschnitts-/Folien-IDs und Überlaufgrenzen.
- Reine Geometrietests für Raster, Magnetlinien, Bounds, Ausrichtung und Verteilung.
- Editor-Akzeptanztests für Drag-and-drop, Tastatur-Nudge, Ebenenänderung und einen Undo-Schritt pro Geste.
- Typecheck und bestehende Live-/Lyric-Preflight-Tests bleiben grün.

