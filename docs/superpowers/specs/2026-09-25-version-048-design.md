# GottesdienstRegie 0.48.0 – Stabilität, Medienbrowser und Bibel-Schnellanzeige

## Ziel

Version 0.48.0 beseitigt den fehlerhaften kompakten Startzustand des Bedienfensters, verbindet Desktop- und Webversion sichtbar miteinander, überarbeitet den Medienbrowser und führt eine offlinefähige Bibel-Schnellanzeige ein. Die Liveausgabe bleibt dabei strikt vom Editorzustand, Folientimern und Countdowns getrennt.

## 1. Startfenster

### Bestehende Ursache

Das Electron-Hauptfenster wird derzeit zunächst mit 410 × 700 Pixeln, deaktivierter Größenänderung und deaktiviertem Maximieren erzeugt. Erst ein vom Renderer gesendetes `lifecycle:ready`-Signal setzt Mindestgröße, gespeicherte Bounds und Startmodus. Trifft dieses Signal nicht oder zu früh ein, bleibt das Bedienfenster dauerhaft im kompakten, responsiven Mobilzustand.

### Sollverhalten

- Das Hauptfenster wird vom ersten sichtbaren Frame an mit gültigen Desktop-Bounds erzeugt.
- Gespeicherte Bounds werden nur verwendet, wenn sie einen aktuell angeschlossenen Bildschirm schneiden.
- Andernfalls werden 90 Prozent der Arbeitsfläche des Zielbildschirms verwendet, mindestens 960 × 620 Pixel.
- `fullscreen`, `maximized`, `window` und `restore` werden idempotent angewendet.
- `lifecycle:ready` darf weitere Anwendungsdienste freischalten, ist aber nicht mehr für die Fenstergröße verantwortlich.
- Das Fenster ist von Anfang an vergrößerbar und maximierbar.
- Reine Ausgabe- und Medienfenster behalten ihre bestehenden Regeln.

## 2. Verbindung zwischen Desktop- und Webversion

- Die Desktop-App erhält im Hilfemenü und im Bereich „Über GottesdienstRegie“ den Eintrag „Webversion öffnen“.
- Das Ziel ist die vorhandene GitHub-Pages-Webversion unter `/GottesdienstRegie/editor/`.
- Externe Links werden in Electron ausschließlich über die bestehende sichere `openExternal`-Brücke geöffnet.
- Die Webversion zeigt im Plattformhinweis und im Hilfebereich „Desktop-App herunterladen“.
- Dieser Link führt zur jeweils aktuellen GitHub-Release-Seite und öffnet keinen wirkungslosen Desktop-Updateablauf im Browser.

## 3. Medienbrowser

### Grundstruktur

Der Medienbrowser verwendet außerhalb des KI-Editors dauerhaft drei Bereiche:

1. Bibliotheksnavigation und Filter links.
2. Suchbare Medienliste oder Kachelansicht in der Mitte.
3. Detailansicht des ausgewählten Mediums rechts.

Die Hauptaktionsleiste enthält Suche, Medientyp und Sortierung. „Medien hochladen“ ist mit automatischem linken Abstand am rechten Fensterrand ausgerichtet. Favorit und Löschen werden aus der oberen Zusatzleiste entfernt und ausschließlich im Detailbereich angeboten.

### Detailansicht

- Bilder und Videos erhalten eine große Vorschau.
- Ein Klick auf „Vergrößern“ öffnet eine modale Darstellung mit Einpassen, 100 Prozent, Vergrößern und Verkleinern.
- Die modale Ansicht sperrt die darunterliegende Medienoberfläche für Zeiger- und Tastaturaktionen.
- Der Name kann im Detailbereich bearbeitet werden.
- Zulässig sind 1 bis 300 Zeichen nach dem Trimmen.
- Ein stets sichtbarer Zähler zeigt beispielsweise `42/300`.
- Speichern aktualisiert lokale und, sofern vorhanden, synchronisierte Metadaten über die bestehende Medien-API.
- Der KI-Status erscheint als Material-Symbol `smart_toy` mit „KI-generiert: Ja“ oder „KI-generiert: Nein“.
- Die Information wird als eigenes boolesches Metadatum gespeichert; bestehende Medien werden einmalig anhand des bisherigen Tags `KI-generiert` migriert.

### Zuletzt verwendet

- Medien erhalten optional `lastUsedAt`.
- `updatedAt` bleibt ausschließlich der Zeitpunkt einer inhaltlichen oder metadatenbezogenen Änderung.
- `lastUsedAt` wird nur gesetzt, wenn ein Medium tatsächlich einer Folie, einem Hintergrund, einer Playlist oder einem anderen Ziel übergeben wird.
- Der Filter „Zuletzt verwendet“ zeigt nur Medien mit `lastUsedAt`, absteigend sortiert, maximal 20 Einträge.
- Auswählen ohne Anwenden ändert den Nutzungszeitpunkt nicht.

## 4. KI-Motiv-Editor

### Layout

Der KI-Editor wird als eigenständiger Arbeitsbereich innerhalb des Medienfensters aufgebaut:

- Kopfbereich mit kurzer Funktionsbeschreibung.
- Auswahl Bild oder Videohintergrund.
- Große Motivbeschreibung mit Zeichenzähler.
- Klar gruppierte Auswahl für Szene, Stil und bei Video die Dauer.
- Primäre Aktion „Motiv erstellen“ rechts unten.
- Ergebnisbereich mit Vorschau, Metadaten und Aktion zum Verwenden.

### Erzeugungszustand

- Während der Erzeugung bleibt das Formular sichtbar, ist aber gegen doppelte Starts gesperrt.
- Es existieren mindestens 15 visuell verschiedene, rein lokale Ladevarianten.
- Die Varianten wechseln während eines einzelnen Vorgangs in festem zeitlichem Abstand und respektieren `prefers-reduced-motion`.
- Begleittexte beschreiben neutral Arbeitsschritte, ohne einen realen Serverfortschritt vorzutäuschen.
- Ein echter Prozentwert wird nur angezeigt, wenn die zugrunde liegende Operation messbaren Fortschritt liefert.

### Fehler

- Eine Fehlermeldung bleibt im KI-Arbeitsbereich sichtbar.
- Direkt daneben erscheint der kleine Button „Erneut versuchen“.
- Er startet dieselbe Beschreibung mit denselben Einstellungen erneut.
- Das fehlerhafte Zwischenergebnis wird nicht in die Bibliothek aufgenommen.

## 5. Bibelübersetzungen

### Katalog und Sichtbarkeit

- Standard ist Luther 1912.
- Zielkatalog: 26 deutsche und 4 englische Ausgaben.
- In der normalen Auswahl erscheinen ausschließlich installierte oder rechtssicher direkt installierbare Ausgaben.
- Ausgaben, deren Download eine nicht vorhandene Lizenz, ein persönliches Konto oder eine nicht integrierte Anbieterfreigabe voraussetzt, werden nicht angezeigt.
- Eine Zielanzahl darf nicht durch erfundene, doppelte oder unvollständig lizenzierte Pakete erreicht werden.
- Der Katalog kann später erweitert werden, ohne eine neue Appversion zu benötigen.

### Schlüssellose Verteilung

- Frei verteilbare Pakete liegen als versionierte Release-Dateien in einem öffentlichen GitHub-Repository.
- Die Anwendung liest eine kleine statische Manifestdatei über eine feste HTTPS-Adresse, nicht über die GitHub-REST-API.
- Jeder Eintrag enthält ID, Sprache, Titel, Kurzname, Umfang, Version, Quelle, Lizenz, Quellenangabe, Dateigröße, Downloadadresse und SHA-256-Prüfsumme.
- Öffentliche Release-Dateien werden ohne persönlichen API-Key geladen.
- Vor der Installation werden Prüfsumme, Schema und Mindestumfang geprüft.
- Downloads verwenden temporäre Dateien und werden erst nach erfolgreicher Prüfung atomar aktiviert.
- Fehlgeschlagene oder abgebrochene Downloads hinterlassen keine scheinbar installierte Ausgabe.
- Die Bedienoberfläche verwendet die vom Nutzer gewünschten Aktionen „Installieren“ und „Herunterladen“; technische Lizenzzustände werden nicht als auffällige Statuskategorien dargestellt.

### Erste englische Pakete

- King James Version.
- American Standard Version.
- World English Bible.
- Berean Standard Bible.

Alle vier Pakete werden nur aktiviert, wenn Quelle und konkrete Textlizenz die Weiterverteilung der verwendeten Datei erlauben.

## 6. Bibeltext anzeigen

- Die bisherige Aktion „Bibel einbinden“ heißt „Bibeltext anzeigen“.
- Sie öffnet einen modalen Dialog und erstellt nicht automatisch ein Ablauf-Element.
- Der Dialog enthält installierte Übersetzung, Buch, Kapitel, Startvers, Endvers und eine freie Referenzsuche.
- Standardübersetzung ist Luther 1912; die letzte bewusste Auswahl darf lokal gemerkt werden.
- Treffer werden vor dem Schalten als vollständige Vorschau mit Referenz und Quellenangabe angezeigt.
- Nicht vorhandene Kapitel oder Verse erzeugen eine verständliche Validierung und verändern MAIN nicht.
- „Auf MAIN anzeigen“ erzeugt eine temporäre Bibel-Schnellanzeige und speichert den vorherigen Live-Snapshot.
- Die Aktion ändert weder Ablauf, ausgewähltes ServiceItem noch die vorbereitete Folie.
- „MAIN-Folie wiederherstellen“ stellt exakt den Snapshot vor der Schnellanzeige wieder her.

## 7. Unabhängige MAIN-Schnellanzeigen

- Eine aktive Schnellanzeige ist eine eigene Liveebene über dem letzten normalen MAIN-Snapshot.
- Folienwechsel, automatische Folienzeiten, ServiceItem-Countdowns und interne Countdown-Ticks dürfen diese Ebene nicht entfernen, ersetzen oder inhaltlich verändern.
- Der Countdown einer Countdown-Schnellanzeige darf nur ihren eigenen angezeigten Zeitwert aktualisieren.
- Normale Livebefehle können im Hintergrund den nächsten wiederherzustellenden Snapshot aktualisieren, solange die sichtbare Schnellanzeige unverändert bleibt.
- Nur ausdrückliches Schließen, Wiederherstellen oder die Wahl einer anderen Schnellanzeige ersetzt die sichtbare Ebene.
- MAIN, Vorschau und Editor behalten getrennte Zustände.

## 8. Datenmigration

- Bestehende Medien bleiben lesbar.
- `aiGenerated` wird bei fehlendem Wert aus dem bisherigen Tag abgeleitet und beim nächsten Speichern materialisiert.
- `lastUsedAt` bleibt für bestehende Medien leer; `updatedAt` wird nicht fälschlich als Nutzung interpretiert.
- Vorhandene Schnellanzeigen und Live-Snapshots bleiben kompatibel.
- Bereits installierte Bibelpakete werden anhand ihrer Paket-ID und Version erkannt.

## 9. Fehler- und Sicherheitsregeln

- Externe Links erlauben nur fest hinterlegte HTTPS-Ziele.
- Bibelpakete werden nicht ausgeführt und enthalten ausschließlich validierte strukturierte Textdaten.
- Pfade aus Manifesten werden nicht ungeprüft übernommen.
- Mediennamen werden als Text behandelt und niemals als HTML gerendert.
- KI-Fehler, Bibeldownloadfehler und Suchfehler bleiben lokal im jeweiligen Arbeitsbereich und schalten keine Ausgabe.
- Während ON AIR darf ein Paketdownload vorbereitet werden, aber ein Wechsel der aktiven Textquelle erfolgt erst durch eine bewusste Auswahl im Dialog.

## 10. Prüfung und Abnahmekriterien

- Ein automatisierter Electron-Test beweist, dass fehlendes `lifecycle:ready` das Fenster nicht bei 410 × 700 Pixeln festhält.
- Bounds außerhalb vorhandener Bildschirme werden korrigiert.
- Desktop- und Weblinks erscheinen nur auf der passenden Plattform und besitzen das richtige Ziel.
- Medienumbenennung weist 0 und mehr als 300 Zeichen ab und akzeptiert 1 bis 300 Zeichen.
- „Zuletzt verwendet“ reagiert auf Anwenden, nicht auf Auswahl oder Umbenennung.
- Migration und Anzeige von `aiGenerated` sind getestet.
- Alle 15 Ladevarianten sind erreichbar; reduzierte Bewegung deaktiviert bewegte Effekte.
- „Erneut versuchen“ verwendet exakt die vorherigen KI-Einstellungen.
- Manipulierte Bibelpakete mit falscher Prüfsumme werden verworfen.
- Nur installierbare oder installierte Bibelübersetzungen erscheinen in der Auswahl.
- Referenzsuche, Vorschau, ungültige Verse und Luther-1912-Standard sind getestet.
- Eine aktive Bibel- oder andere MAIN-Schnellanzeige bleibt trotz automatischem Folienwechsel und Countdown-Ticks sichtbar.
- Unit-, Typ-, Desktop-Build-, Web-Build- und Browser-Smoke-Tests müssen vor der Veröffentlichung erfolgreich sein.

## 11. Veröffentlichung

- Paketversion, Changelog, ausführliche Versionshinweise und Updatekatalog werden auf 0.48.0 gesetzt.
- Die Release-Pipeline erstellt Windows-, macOS- und Linux-Artefakte.
- Die Webversion wird gemeinsam mit dem aktualisierten Desktop-Downloadlink veröffentlicht.
- Die Veröffentlichung gilt erst als abgeschlossen, wenn die Update-Manifeste aller drei Plattformen erreichbar sind.
