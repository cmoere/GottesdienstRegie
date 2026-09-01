# GottesdienstRegie 0.7.0

Veröffentlicht am 1. September 2026.

## Neu

- **Präsentationen:** Eine neue lokale Präsentationsbibliothek verwaltet mehrere Gottesdienste dauerhaft und unterstützt Erstellen, Öffnen, Duplizieren, Umbenennen, Archivieren, Importieren, Exportieren und Backups.
- **Editor:** Der mittlere Arbeitsbereich besitzt jetzt eine echte Canvas-Bearbeitung für Text, Bilder, Formen, Linien, Videos und QR-Codes einschließlich Ziehen, Skalieren, Ebenenreihenfolge, Sperre und Sichtbarkeit.
- **Medien:** Eine lokale Medienbibliothek importiert Bilder, Videos, Audio und PDF-Dateien, erkennt identische Dateien über Prüfsummen und speichert nur eine lokale Kopie.
- **Inhalte:** Das Hinzufügen-Menü umfasst Inhalte, Bilder, Videos, Audio, Songs, Bibelstellen, Webseiten, PDF, Timer, Countdowns, Ankündigungen, Slideshows, Stage-Nachrichten und Schnellanzeigen.
- **Webseiten und Videos:** Webseiten werden als echte Inhalte gerendert; Videos können lokale Dateien, direkte URLs sowie eingebettete YouTube- oder Vimeo-Quellen verwenden.
- **Sprache:** Português (Brasil), Svenska, Suomi, Français und Italiano wurden ergänzt; alle Sprachen erscheinen in der Auswahl mit ihrem Eigennamen und einer lokalen Flagge.
- **Versionsseite:** Die App und die öffentliche mehrsprachige Release-Notes-Seite verwenden dieselbe strukturierte Datei als Datenquelle.

## Verbessert

- **Ablauf:** Alle vier Abschnitte bleiben auch ohne Inhalte sichtbar; Ablauf-Elemente lassen sich über ein Kontextmenü duplizieren, aktivieren, verschieben oder löschen.
- **Pre- und Post-Service:** Vor- und Nachprogramm verwenden dieselbe Abschnitts-, Element- und Folienstruktur wie der Hauptgottesdienst und unterstützen beliebig viele Inhalte.
- **Hilfe:** Die integrierte Hilfe wurde zu einer durchsuchbaren Dokumentation mit ausführlichen Artikeln, verwandten Themen und Fehlerbehebung erweitert.
- **Einstellungen:** Die Navigation ist in Allgemein, Ausgabe, Präsentation sowie Verbindungen und Steuerung gegliedert.
- **Anzeige:** Die Bildschirmidentifikation zeigt Nummer, Verwendung, Gerätename und Auflösung auf jedem angeschlossenen Monitor.

## Behoben

- **Anmeldung:** Technische Fehlerkennungen und interne Antwortdetails werden nicht mehr gemeinsam mit verständlichen Anmeldefehlern angezeigt.
- **Live-Ausgabe:** Editor-, Vorschau- und Live-Auswahl bleiben vollständig getrennt, sodass das Bearbeiten anderer Inhalte die laufende MAIN-Ausgabe nicht verändert.
- **Wiederherstellung:** Präsentationen werden atomar gespeichert und können nach einem unerwarteten Programmende aus einer Wiederherstellungskopie geöffnet werden.

## Sicherheit

- **Diagnose:** Diagnosedaten schließen Passwörter, Hashes, Salts, Sitzungs- und SSO-Token ausdrücklich aus.
