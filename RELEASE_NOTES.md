# GottesdienstRegie 0.15.0

Veröffentlicht am 6. September 2026.

## Neu

- **Teilnahmecode:** Beim bewussten Start eines LiveQuiz erzeugt GottesdienstRegie eine echte, zufällige sechsstellige Sitzungskennung.
- **QR-Code:** Die Desktop-App erstellt den QR-Code lokal. Es werden keine Quizdaten an einen externen QR-Bilddienst gesendet.
- **Mobile Join-Seite:** Eine responsive Teilnahmeoberfläche aus HTML, CSS und JavaScript steht auf der öffentlichen GottesdienstRegie-Seite bereit.
- **Echtzeitteilnahme:** Besucher können anonym oder mit Anzeigenamen beitreten und auf die jeweils vom Bediener geöffnete Frage antworten.
- **Live-Steuerung:** Fragen werden gezielt gestartet, Antworten geschlossen und die gesamte Sitzung kontrolliert beendet.

## Verbessert

- **Live-Status:** Der Editor zeigt die tatsächliche Teilnehmerzahl und die Zahl der Antworten auf die aktuell geöffnete Frage.
- **Sitzungsschutz:** Die Quizdefinition wird während einer laufenden Sitzung gesperrt, damit Desktop und Teilnehmer dieselben Inhalte verwenden.
- **Ablauf:** Ein beendeter Teilnahmecode wird sofort aus der Codezuordnung entfernt und kann nicht erneut betreten werden.

## Sicherheit

- **Getrennte Datenbereiche:** Quizsitzungen, Codezuordnungen und Antworten besitzen getrennte Firebase-Regeln. Teilnehmer schreiben ausschließlich ihre eigene Antwort zur aktiven Frage.
- **Keine Lösungen im Browser:** Korrekte Antwortkennungen bleiben in der Desktop-Präsentation und werden nicht an die mobile Teilnahme-Seite ausgeliefert.
- **Keine geheimen Schlüssel:** Die Join-Seite enthält nur die vorgesehene öffentliche Firebase-Webkonfiguration, keine Administrator- oder Secret-Schlüssel.

---

# GottesdienstRegie 0.14.0

Veröffentlicht am 6. September 2026.

## Neu

- **LiveQuiz im Ablauf:** LiveQuiz ist jetzt über das Hauptmenü „Element hinzufügen“ und über das Plus im Order of Service erreichbar. Beide Wege erzeugen einen eigenen LiveQuiz-ServiceItem-Typ mit passendem Material Symbol.
- **Sicherer Erstellungsdialog:** Vor dem Anlegen werden Titel, Quiz oder Umfrage sowie anonyme oder namentliche Teilnahme ausgewählt. Abbrechen erzeugt weder ein Ablauf-Element noch eine Quizdefinition.
- **Spezialisierter Quizeditor:** Fragen, Antwortoptionen, korrekte Antworten, Zeitlimit, Punkte und nachträgliche Antwortänderung lassen sich unmittelbar bearbeiten.
- **Fragetypen:** Der Editor unterstützt Single Choice, Multiple Choice, Richtig/Falsch, Ja/Nein, Freitext, Skala und reine Umfragen.
- **Mehrere Fragen:** Ein LiveQuiz bleibt genau ein Ablauf-Element und kann darin beliebig viele interne Fragen verwalten. Die Fragenleiste ermöglicht das gezielte Auswählen, Hinzufügen und Löschen.

## Verbessert

- **Gemeinsame Darstellung:** Jede Quizfrage erzeugt eine echte Folie und verwendet denselben SlideRenderer wie Editor, Vorschau, Folienübersicht und MAIN.
- **Ablaufanzeige:** Statt einer generischen Folienzahl zeigt das LiveQuiz-Element seine tatsächliche Fragenanzahl.
- **Speicherung:** Quizdefinition, Teilnahmeart, Fragen, Antworten und Einstellungen werden gemeinsam mit der Präsentation gespeichert und durch Autosave erfasst.
- **Undo/Redo:** Erstellen und redaktionelle Änderungen laufen durch den zentralen History-Mechanismus. Eine neue Änderung verwirft den nicht mehr passenden Redo-Zweig.

## Sicherheit

- **Keine erfundene Teilnahme:** Ohne eingerichteten Audience-Dienst werden weder fingierte Besucher noch scheinbare Live-Ergebnisse oder Teilnahmecodes angezeigt. Freitextantworten dürfen später nur nach Moderation auf MAIN erscheinen.

---

# GottesdienstRegie 0.13.1

Veröffentlicht am 6. September 2026.

## Behoben

- **Cloud-Migration:** Statt der bisherigen allgemeinen Abbruchmeldung wird jetzt verständlich angezeigt, ob das Medien-Repository nicht privat ist, die GitHub-Berechtigung fehlt, die Verbindung unterbrochen wurde oder eine Datei nicht akzeptiert werden konnte.
- **Private Team-Medien:** Auflisten, Vorschau, Upload und Löschen verwenden einen authentifizierten Zugriff. Private Medien-URLs werden nicht als ungeschützte öffentliche Roh-Links an den Renderer weitergegeben.
- **Fortsetzen nach Fehlern:** Bereits erfolgreich migrierte Medien bleiben synchronisiert; nur die noch offenen Quelldateien werden bei einem weiteren Versuch erneut verarbeitet.
- **Präsentationsmenü:** Präsentationsinformationen, Servicezeit und ON AIR befinden sich wieder in genau einem zusammenhängenden Dropdown. ON AIR erscheint nicht mehr in einem abgesetzten zweiten Kasten.

## Verbessert

- **Medienfenster:** Das native Arbeitsfenster heißt nun eindeutig „GottesdienstRegie – Medienbibliothek“ und bleibt normal minimierbar, maximierbar sowie über den Windows-Fensterwechsel erreichbar.
- **Rückgängig/Wiederholen:** Beide Befehle bleiben an ihrer festen Position sichtbar. Ohne passenden History-Eintrag sind sie technisch und visuell deaktiviert und werden für Hilfstechnologien als nicht verfügbar bezeichnet.
- **Upload-Stabilität:** Vorübergehende Netzwerk- und Serverfehler werden begrenzt wiederholt, ohne eine Endlosschleife zu erzeugen.

---

# GottesdienstRegie 0.13.0

Veröffentlicht am 6. September 2026.

## Cloud-Medienbibliothek

Die Medienbibliothek ist jetzt ein eigener Desktop-Arbeitsbereich mit drei klar getrennten Quellen, einer professionellen Rasteransicht und einem Detailbereich. Die bisherige Anzeige lokaler Bestände sowie der dauerhafte technische GitHub-Status entfallen.

Lokale Dateien werden ausschließlich zum Hochladen ausgewählt. Erst nach erfolgreicher Übertragung steht das Cloud-Medium zur Verwendung in Präsentationen bereit. Vorhandene Altmedien können über einen sicheren Migrationshinweis übertragen werden.

## Sicheres Verwalten

Der Verwaltungsmodus zeigt keine irreführenden „Verwenden“-Schaltflächen. Im Auswahlmodus kann ein Medium gezielt als Inhalt oder Hintergrund übernommen werden. Medien, die gerade live oder in gespeicherten Präsentationen verwendet werden, sind vor versehentlichem Löschen geschützt.

## Darstellung

Suche, Filter und Sortierung bleiben kompakt. Das Raster reagiert auf die Fenstergröße, der Detailbereich bleibt erreichbar und echte Leer-, Lade- und Offline-Zustände ersetzen Platzhalter oder erfundene Inhalte.

---

# GottesdienstRegie 0.12.0

Veröffentlicht am 6. September 2026.

## Neu

- **Professionelles Datei-Menü:** Neu, Öffnen, zuletzt verwendete Präsentationen, Duplizieren, Import, Sicherung, Wiederherstellung, Drucken, Teilen und Beenden sind in einer klar gegliederten Menühierarchie verfügbar.
- **Neue Präsentation:** Titel, Datum, Servicezeit, Team und Vorlage werden in einem kompakten Dialog erfasst; die vier Standardbereiche werden automatisch angelegt.
- **Präsentationsauswahl:** Die Öffnen- und Duplizieren-Dialoge bieten Suche, Sortierung, echte Folienminiaturen, Metadaten und Doppelklick.
- **Duplizieroptionen:** Servicezeit, Medienreferenzen und Zielzeiten können gezielt übernommen werden.

## Verbessert

- **Tastaturbedienung:** Pfeiltasten navigieren im Datei-Menü; Escape schließt zuerst das Untermenü, danach das Hauptmenü und schließlich geöffnete Datei-Dialoge.
- **Eindeutige Kopien:** Duplizierte Präsentationen erhalten neue IDs für Präsentation, Bereiche, Ablauf-Elemente, Folien und Canvas-Elemente.
- **Live-Sicherheit:** Beim Beenden während ON AIR erscheint eine klare Warnung; nach Bestätigung werden Ausgaben kontrolliert beendet und der Stand gespeichert.

## Behoben

- **Zuletzt duplizieren:** Die im Untermenü gewählte Präsentation wird im Duplizieren-Dialog korrekt vorausgewählt.
- **Menüfokus:** Nach dem Schließen eines Dialogs kehrt der Tastaturfokus zum Datei-Menü zurück.

---

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
