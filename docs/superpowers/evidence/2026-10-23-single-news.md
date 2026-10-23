# Einzel-Nachrichten, Vereinslogos, eigene Wetterfolie und Meldungskopf

## Umfang

Der bestätigte Nachrichtenplan und die anschließend bestätigten Ergänzungen wurden im bestehenden isolierten Arbeitsbereich umgesetzt. Keine Veröffentlichung, Installation, Monitorumschaltung oder Audioänderung. Die bereits veröffentlichte Version 0.86.0 und ihre Artefakte wurden nicht überschrieben.

- Nachrichten: genau ein Artikel, großes optionales Feed-Bild, vollständiger Titel/Beschreibung, korrektes Quellenlogo. Mindestens 20 Sekunden pro Artikel bzw. konfigurierte längere Mindestdauer; längere Texte erhalten berechnete Lese-/Scrollzeit und statische Fortsetzungen bei reduzierter Bewegung. Gemeinsame Startzeit auch bei später gestarteten Spiegeln.
- Fußball: vorbereitete Vereinslogos neben Paarungen und Tabellennamen, Zuordnung über stabile Team-ID. Fehlende/abgewiesene Bilder lassen Namen, Rang und Ergebnisse erhalten.
- Wetter: gemeinsame native Ausgabe statt Wetter-iframe; Bielefeld als änderbarer Standard, ausdrückliche Ortssuche, aktuelles Wetter und drei Tage, °C/km/h und Open-Meteo-Quellenangabe. Betreiber-IPC, Grenzen, Cache und eingefrorene Takes entsprechen der ExternalLoop-Architektur.
- Meldungen: Info-Symbol und grüne #699f3e-Kopffläche „Aktuelle Infos“ mit weißer Cera-Pro-Schrift und unten rechts runder Ecke. Individueller Titel, Rich Text, QR-Code und Scrolltext bleiben erhalten; alle acht vorhandenen Designs reservieren dafür Platz.

## Sicherheit und Entscheidungen

Programmierung und Abschlussreview durch den ursprünglichen Autor; keine unabhängige Codeprüfung. Die bestehende Nutzerbeschränkung auf ausschließlich delegierte Übersetzungsarbeit wurde beachtet: für diesen Umbau keinerlei Delegation.

1. Bestehende Services/Renderer erweitert, keine parallele Veranstaltungs- oder Meldungsdatenbank. Umfangserweiterung auf Fußball/Wetter/Meldungskopf entspricht der letzten Nutzerbestätigung; zusätzliche Regressionstests erforderlich.
2. Bereits vorhandenes, produktiv mitgeliefertes sharp 0.34.5 direkt deklariert. Lockfile verändert ausschließlich diese Wurzelabhängigkeit; keine aufgelöste Paketversion geändert. Verhindert unbeabsichtigte Abhängigkeit von Transformers' transitiver Paketstruktur.
3. Pro Quelle nur die zehn neuesten vorbereiteten Nachrichten behalten, entsprechend der maximalen Anzeigeauswahl. Der Parser begrenzt weiterhin auf 100 Roh-Einträge; ältere Artikel jenseits der zehn neuesten werden nicht gecacht. Bestehende 2-MiB-/32-MiB-Cachegrenzen bleiben unverändert.
4. Bilder ausschließlich zentral: quellenspezifische HTTPS-Hostliste, keine Credentials/Ports/Privatnetz-URLs, begrenzte Same-Origin-Weiterleitungen, Größen-/Pixel-/Zeitlimits, Raster-Signatur und MIME-Prüfung, anschließend JPEG. Nie fremdes SVG dekodieren. Wikimedia-SVG-Referenzen werden in nachweislich verfügbare 250px-PNG-Vorschaubilder übersetzt. Artikelbilder werden adaptiv auf maximal 96 KiB gebracht, Vereinslogos auf maximal 16 KiB. Keine externen Bild-URLs im öffentlichen Snapshot.
5. Ungenutzter alter WeatherScreenController und ignorierte Altmetadaten bleiben für historische Kompatibilität erhalten. Alle aktiven Wetter-iframe-/Preload-Aufrufstellen sind durch die native ExternalLoop-Kette ersetzt; die alte Metadaten-URL wird nicht geladen.
6. PowerShell-Arbeitsbereich: Fortschrittsdatei über apply_patch statt Bash-Helfer gepflegt. Keine Änderung des Produkts dadurch.
7. Native Assertion für umgebrochene Meldungstitel normalisiert ausschließlich Leerraum zwischen gerenderten Zeilen; alle sonstigen Zeichen bleiben geprüft. Keine Kürzung von Quelltext oder Titelzeichen.

## Prüfungen

- Ausgangslage: 14 Dateien / 73 gezielte Tests erfolgreich.
- Nachrichtenbeschreibung, öffentlicher Feldumfang, Quellenbilder, Vereinslogo-ID-Zuordnung, Einzelansicht, Mindestdauer und Fortsetzungsseiten: neue Erwartungen zunächst fehlgeschlagen, danach erfolgreich.
- Ganze Bild-Ladefrist auch bei ignoriertem AbortSignal: fehlgeschlagen, danach mit Deadline erfolgreich. Foto-Kompression: deterministisches detailreiches Testfoto wurde zunächst verworfen, danach erfolgreich auf <=96 KiB aufbereitet.
- Ortssuche: veraltetes Ergebnis nach Änderung der Eingabe zunächst sichtbar, danach korrekt verworfen. Veraltete Messwerte, ungültige WMO-Codes und umgekehrte Prognosedaten zunächst akzeptiert, danach abgewiesen.
- Spiegel-Zeittakt: später geöffnete Ausgabe wechselte zunächst verspätet; danach am gemeinsamen epoch-ausgerichteten Sekundenrand. Keine Lockerung von Zeit-/Ergebnisbehauptungen.
- Produktionsbuild erfolgreich: TypeScript-Anwendung, Vite (25,68 Sekunden), Electron-TypeScript und 31 Regionaldateien. Vorbestehende Warnung zu großen JS-Chunks bleibt.
- Native finale Bildprüfung erfolgreich: `work/external-loop-native-jKSkql`. Nachrichten mit Bild/ohne Bild/langem Text/reduzierter Bewegung, drei Wettertage ohne iframe, Fußballpaarungen/Tabelle/Logos, alle acht Meldungsdesigns, sechs Uhrdesigns, englische Störungsanzeige und später Spiegel. Eingefrorener tatsächlicher Controller-Take blieb bei Datenaktualisierung unverändert; neuer Take änderte Revision, Zeitstempel und Pixel. Test-Wasserzeichen blieb sichtbar. Kein eigener Electron-Testprozess zurückgeblieben.
- Echte kompilierte Adapter: `work/single-news-verified-adapters.log`: zehn WB-Nachrichten, zehn Beschreibungen, zehn vorbereitete Artikelbilder; Bundesliga-Tabelle mit 18 Vereinen und zehn aktuell erfolgreich vorbereiteten Logos; Bielefeld-Wetter mit drei Tagen. Einzelner Wikimedia-Logo-Lader separat erfolgreich geprüft. Nicht lieferbare/abgewiesene Provider-Bilder bleiben ohne Einfluss auf Text/Ergebnisse.
- Erste Gesamtläufe: alte y<=40-Layoutannahme an neuen Kopfbereich angepasst, alle Rich-Text-/Scroll-Prüfungen erhalten. Später ausschließlich vorbestehendes 5-Sekunden-Zeitlimit der umfangreichen Regionalinventar-Prüfung unter paralleler Build-Last; keine Assertion oder Testfrist gelockert. Finaler vollständiger Lauf mit zwei Workern: **212 Dateien / 872 Tests erfolgreich**, 345,59 Sekunden, `work/single-news-final-two-workers.log`. Die zuvor auffällige Inventar-Prüfung bestand in 1,972 Sekunden.
- `git diff --check` erfolgreich. Fremde unversionierte Datei `tests/smoke/startup-diagnostic.cjs` unverändert: SHA256 B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5.

## Grenzen / verbleibende Punkte

- Kein physischer Besuchermonitor, realer Stream oder angeschlossenes Audiogerät getestet; nur isolierter versteckter Electron-Renderer.
- Vereinslogos und Nachrichtenbilder hängen von tatsächlich lieferbaren Provider-Assets ab; keine Logos/Fotos erfunden oder beliebige Ersatzquellen verwendet.
- Sehr lange Ortsbezeichnungen und andere Bildschirm-Seitenverhältnisse als das gemeinsame 1920×1080-Design wurden nicht gesondert visuell geprüft.
- Bestehendes Abhängigkeits-Audit meldet 37 Befunde (10 mittel, 22 hoch, 5 kritisch). Dieser Umbau ändert keine dieser aufgelösten Versionen; kein unkontrolliertes audit fix durchgeführt.
- Nicht Gegenstand: PowerPoint-Originalmodus, vollständige Regionalübersetzung und Veröffentlichung. Vor einem neuen Update neue Versionsnummer/Versionshinweise und aktualisierte Regionalinventar-Freigabe vorbereiten; den veröffentlichten v86-Stand nicht ersetzen.
