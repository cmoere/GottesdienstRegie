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
