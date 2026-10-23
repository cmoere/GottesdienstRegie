# RSS-Nachrichten als große Einzelansicht

## Freigegebene Darstellung

Der Benutzer hat die Einzelansicht bestätigt: immer genau eine RSS-Nachricht mit großem Nachrichtenbild, gut lesbarem Titel, Beschreibung und passendem Quellenlogo. Nachrichten wechseln nacheinander. Mindestens 20 Sekunden pro Nachricht, bei längeren Texten automatisch länger. Fehlt ein Feed-Bild, nutzt der Text die Fläche ohne leeren Bildrahmen. Der bestehende Testmodus-Overlay bleibt darüber sichtbar.

## Ansatz und Grenzen

Die vorhandene ExternalLoopService → normalisierter Snapshot → gemeinsamer Output-Renderer-Kette wird erweitert, nicht ersetzt. Die bisherige Überschriftenliste entfällt ausschließlich für Nachrichten. Fußball und andere Loop-Typen bleiben unverändert. Ein separater Browser/Webseiten-Renderer passt nicht: er würde Darstellung und Netzwerkzugriffe der Outputs auseinanderlaufen lassen. Ein bloßes Großziehen der bestehenden Liste erfüllt die Einzelansicht nicht.

Nur ausdrücklich im RSS/Atom-Feed enthaltene Beschreibung und Artikelbilder verwenden; keine Artikelseiten durchsuchen, keine Texte erfinden, keine beliebigen Ersatzfotos. Die am 23.10.2026 geprüften Feeds liefern WB-Bilder als enclosure und WDR-Beschreibung als summary/content; der geprüfte WDR-Eintrag enthält kein Bild. Logo und Quellenname gehören stets zur gerade sichtbaren Nachricht.

Bilddaten werden zentral begrenzt geladen und vorbereitet, nicht separat in MAIN/LIVESTREAM/STAGE nachgeladen. Nur HTTPS und überprüfte Bild-CDN-Hosts der jeweiligen Quelle; keine SVG-/HTML-/Datei-/Privatnetz-URLs. Eingangsgröße, Ladezeit und dekodierte Pixelzahl begrenzen, Rasterbilder normalisieren und klein genug für den bestehenden Snapshot-Cache halten. Bildfehler entfernen nur das Bild, nicht die Nachricht. Bestehende Cache-Laufzeit und Speicherobergrenzen bleiben bestehen.

## Ablauf und Live-Sicherheit

Aus dem eingefrorenen Snapshot entsteht eine gemeinsame Zeitleiste. Pro Nachricht mindestens max(20 Sekunden, konfigurierte Dauer); Beschreibung und überlange Titel erhalten ausreichend Lesezeit. Die Gesamt-Elementdauer deckt alle ausgewählten Nachrichten ab. Spät geöffnete Spiegel berechnen aus derselben Startzeit dieselbe Nachricht. Eine Vorschau zeigt genau eine Nachricht. Kein Fetch im Renderer, keine nachträgliche Änderung der aktuell sichtbaren Nachricht durch Firebase/RSS-Aktualisierung.

Großes Bild links, Titel und Beschreibung rechts; ohne Bild volle Textbreite. Neutrale Cera-Pro-Typografie und bestehende Gemeindefarben. Lange Texte niemals abschneiden oder verkleinern: ruhiger vertikaler Textlauf innerhalb des Textbereichs; im Modus für reduzierte Bewegung statische vollständige Fortsetzungen. Keine Ausführung von Feed-HTML. Diese Layoutdetails sind Implementierungsentscheidungen innerhalb der bestätigten Einzelansicht.

## Nicht enthalten

Keine Änderung an Meldungen, Werbeanzeigen, Fußball, Audio oder Ausgangszuordnung. Keine Behauptung einer bereits veröffentlichten neuen Version; das veröffentlichte 0.86.0 bleibt unverändert. Keine neuen Abhängigkeiten oder Delegation von Programmierung.
