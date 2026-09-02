# GottesdienstRegie 0.11.1

Veröffentlicht am 2. September 2026.

## Behoben

- **Heller Modus:** Die vollständige Produktionsoberfläche übernimmt nun das helle Farbschema. Menü-, Ablauf-, Editor-, Timeline- und Werkzeugbereiche bleiben dadurch kontrastreich lesbar.
- **Einstellungen:** Titel, Bereichsüberschriften und Schließen-Schaltfläche erben keine helle Produktionsschrift mehr und sind auf dem weißen Dialoghintergrund wieder deutlich sichtbar.
- **Dunkler Modus:** Die bisherigen dunklen Produktionsfarben bleiben unverändert erhalten.

---

# GottesdienstRegie 0.11.0

Veröffentlicht am 2. September 2026.

## Neu

- **Hintergrund-Menü:** Medien durchsuchen, Bilder direkt importieren, zuletzt verwendete Motive auswählen und Füllfarben sofort anwenden.
- **Bildanpassung:** Hintergrundbilder weichzeichnen, drehen, an Höhe oder Breite anpassen, ausfüllen, einpassen und positionieren.
- **Hilfslinien:** Canvas Smart Guides, Randhilfen und Drittelregel lassen sich unabhängig ein- und ausschalten und bleiben auf den Editor beschränkt.
- **Anordnen:** Elemente nach vorn oder hinten legen, an sechs Positionen ausrichten, drehen, spiegeln sowie sperren und entsperren.

## Verbessert

- **Zentraler Renderer:** Hintergrundbilder, Bildposition, Unschärfe, Rotation, Spiegelung und Kursivschrift erscheinen in Editor, Vorschau, Thumbnails und MAIN identisch.
- **Medienbibliothek:** Aus dem Hintergrund-Menü ausgewählte Bilder ändern ausschließlich die aktuelle Folie und erzeugen kein neues Ablauf-Element.
- **Folienübersicht:** Der gespeicherte Thumbnail-Regler verändert nun sichtbar die Rastergröße, ohne Folieninhalt oder Canvas-Auflösung anzupassen.

## Behoben

- **Kleine Fenster:** Alle sechs Ausrichtungen sowie Drehen, Spiegeln und Sperren bleiben auch in einer kompakten Bedienoberfläche sichtbar.
- **Textformatierung:** Kursiv wird vom gemeinsamen Renderer tatsächlich dargestellt.

---

# GottesdienstRegie 0.10.0

Veröffentlicht am 2. September 2026.

## Neu

- **Produktionsarbeitsbereich:** Ablauf, spezialisierter Kontexteditor und große Ausgabenvorschau bilden eine dichte professionelle Arbeitsfläche. Output-Tabs und Formatierungsleiste bleiben sichtbar.
- **Songeditor:** Arrangement, Tonart, Lyrics-Abschnitte, Metadaten, CCLI-Optionen und mehrere echte Folienvorschauen sind gleichzeitig bearbeitbar.
- **Timeline:** Die Timeline zeigt aktive Elemente samt Dauer und Liveposition. Sie lässt sich aufklappen und in der Höhe anpassen.
- **Startbildschirm:** Das konfigurierte Loginmotiv füllt den Hintergrund; eine eigene dunkle Startkarte zeigt echte Ladephasen mit ruhigem Spinner.

## Verbessert

- **Ablauf:** Echte Miniaturansichten, kompakte Dauern, Wiederholung, Auswahl und Livezustand benötigen deutlich weniger Platz.
- **Updates:** Die voraussichtliche Restdauer basiert auf übertragenen Bytes und einer geglätteten realen Downloadgeschwindigkeit.
- **Tastatur:** Escape schließt im Haupteditor stets das oberste Menü oder Dialogfenster und bricht Sicherheitsdialoge ab.

## Geändert

- **Servicezeit:** Jede Präsentation besitzt exakt eine Servicezeit. Sie erscheint als `10:30 (VORM.)` beziehungsweise `15:30 (NACHM.)`.

## Behoben

- **Zeit festlegen:** Der Zeitdialog verändert den Aufklappzustand des Gottesdienstbereichs nicht; Escape verwirft die Änderung.

---

# GottesdienstRegie 0.9.2

Veröffentlicht am 2. September 2026.

## Verbessert

- **Professioneller Standardmodus:** Bei einer neuen Installation startet die Produktionsoberfläche standardmäßig im dunklen Design. Bereits gespeicherte Benutzereinstellungen bleiben unverändert.
- **Kompakte Ablaufzeiten:** Zeitangaben unter einer Minute erscheinen jetzt als `7s`, `10s` oder `45s`; längere Zeiten bleiben im Format `1:00` oder `3:06`.
- **Tastaturbedienung:** Das Einstellungsfenster lässt sich zuverlässig mit Escape schließen. Ein geöffneter Beta-Hinweis wird dabei zuerst geschlossen.

## Behoben

- **Einstellungsfenster:** Auswahlrahmen und Größenanfasser von Text-, Bild- oder Videoelementen können nicht mehr vor dem Einstellungsfenster erscheinen.
- **Dialogebenen:** Einstellungen, Hilfe, Medienbibliothek, Präsentationsbibliothek und Bestätigungsdialoge verwenden jetzt eine gemeinsame, geschützte oberste Anwendungsebene.
- **Zeitbearbeitung:** Kurze Zeitwerte mit `s` können nach der kompakten Darstellung weiterhin direkt bearbeitet und korrekt gespeichert werden.

---

# GottesdienstRegie 0.9.1

Veröffentlicht am 1. September 2026.

## Neu

- **Beta-Updates:** Unter Einstellungen → Updates lassen sich Vorabversionen optional aktivieren. Standardmäßig werden weiterhin nur stabile Versionen berücksichtigt.
- **Mehrere Servicezeiten:** Startzeiten können hinzugefügt, einzeln bearbeitet, entfernt und mit der Präsentation gespeichert werden.

## Verbessert

- **Einmaliger Warnhinweis:** Beim ersten Aktivieren des Beta-Kanals erklärt ein kompakter Dialog verständlich die möglichen Einschränkungen.
- **Versionsdarstellung:** Beta- und RC-Versionen werden verständlich benannt, mit einem dezenten BETA-Badge gekennzeichnet und unterstützen „Bekannte Probleme“.
- **Rückkehr zur stabilen Version:** Ist eine Beta installiert, wird die stabile Version mit Kompatibilitätsprüfung und Backup-Möglichkeit angeboten.

## Behoben

- **Zeit festlegen:** Ein Klick auf die Servicezeit öffnet nur noch den Zeitdialog und klappt GOTTESDIENST nicht mehr ein oder aus.
- **Getrennte Header-Aktionen:** Pfeil, Titel, Zeit, Plus und weitere interaktive Controls lösen keine unbeabsichtigten Mehrfachaktionen durch Event Bubbling mehr aus.
- **Unabhängiger Zustand:** Servicezeiten und Collapse-Zustand werden getrennt gespeichert; Zeitänderungen lassen den Abschnitt exakt im bisherigen Zustand.

---

# GottesdienstRegie 0.9.0

Veröffentlicht am 1. September 2026.

## Neu

- **Ablaufzeiten:** Elemente und einzelne Folien besitzen echte Wiedergabezeiten. Abschnittssummen werden automatisch berechnet und direkt im Ablauf oder Eigenschaftenbereich bearbeitet.
- **WARM-UP:** VORPROGRAMM, WARM-UP, GOTTESDIENST und NACHPROGRAMM sind getrennte Bereiche. Alte ANKOMMEN-Inhalte werden automatisch übernommen.
- **Zeitgesteuerter Übergang:** Wenn ON AIR bereits aktiv ist, startet WARM-UP anhand seiner berechneten Dauer und wechselt zur hinterlegten Servicezeit in den Gottesdienst.
- **GitHub-Medienbibliothek:** Lokale Medien lassen sich prüfsummenbasiert mit dem öffentlichen Repository `cmoere/GottesdienstRegie-Media` synchronisieren.
- **StorageProvider:** Lokaler Cache und GitHub-Speicher sind sauber getrennt; weitere Speicherziele können später ergänzt werden.
- **Audio:** Importierte Audiodateien werden als echte Player-Elemente in Vorschau und Live-Ausgabe wiedergegeben.
- **Timer und Countdown:** Zeiten laufen in der tatsächlichen MAIN-Ausgabe sekundengenau und können einen Endtext anzeigen.

## Verbessert

- **Bearbeiten/Vorschau:** Der kompakte Schiebeschalter entspricht dem Referenzdesign und markiert den aktiven Modus gelb.
- **Startbildschirm:** Der echte mindestens zehnsekündige Startvorgang verwendet einen Spinner ohne Balken und Prozentanzeige.
- **Ablaufdarstellung:** Echte Miniaturansichten, Typ-Symbole, Schleifenstatus, einklappbare Bereiche und direkt bearbeitbare Dauern verbessern lange Abläufe.
- **Elemente hinzufügen:** Bild, Video, Audio, PDF, Slideshow, Timer, Countdown, Ankündigung, Stage-Nachricht und Schnellanzeige erzeugen typgerechte Inhalte statt leerer Platzhalter.
- **Medienende:** Das Ende von Video und Audio kann sicher die nächste aktive Folie aufrufen.

## Behoben

- **Lokale Videos:** Die Auswahl „Datei“ öffnet tatsächlich den Medien-Dateidialog und erzeugt ein vollflächiges Videoelement.
- **Schleifen:** Vor- und Nachprogramm springen nach der letzten aktiven Folie verlässlich an den Bereichsanfang zurück.
- **Migration:** Vorhandene Präsentationen werden um Timing-Daten ergänzt, ohne ihre Folien zu verlieren.

## Sicherheit

- **GitHub-Zugang:** Zugangsdaten bleiben im Electron-Hauptprozess und werden weder an den Renderer noch in Präsentations- oder Mediendaten geschrieben.
- **Große Videos:** Dateien oberhalb der sicheren GitHub-Grenze bleiben lokal und verursachen keinen unvollständigen Upload.
