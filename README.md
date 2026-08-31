# GottesdienstRegie

GottesdienstRegie ist die Windows-Desktopsoftware der Philippusgemeinde für Gottesdienstabläufe, Folienvorschau und Präsentationsausgaben.

## Funktionen

- PGB-Kontoanmeldung einschließlich Zwei-Faktor-Anmeldung
- rollenbasierte Freigaben aus Firebase
- Bedienoberfläche auf Deutsch, Schweizerdeutsch, Englisch, Niederländisch, Dänisch, Norwegisch, Spanisch, Ukrainisch, Russisch, Türkisch, Arabisch und Polnisch
- System-, Hell-, Dunkel- und optionaler Schwarz-Weiß-Modus
- Ablauf, Folieneditor, Filmstreifen und Vorschau
- echte Vollbildausgabe auf einem zugewiesenen Bildschirm
- verschlüsselte lokale Sitzung über Windows DPAPI
- integrierte GitHub-Updateprüfung, Download und Installation
- integrierte Versionshinweise
- insgesamt 30 wechselnde, offline mitgelieferte Login-Motive
- Updateansicht mit Installationsdatum, Dateidatum, Dateigröße, grünem Fortschritt und Rückkehr zur vorherigen Version
- Audioeinstellungen für echte Lautsprecher und Mikrofone einschließlich Test und Pegelanzeige
- Hilfe- und Supportbereich sowie erweiterte Barrierefreiheit für Kontrast, Größe, Tastaturfokus und Lesbarkeit
- stabiles Präsentationsmodell mit mehreren Folien, UUIDs, Drag-and-drop, Undo/Redo und lokaler JSON-Sicherung
- getrennte Editor-, Vorschau- und `ON AIR`-Zustände mit unabhängigem Live-Snapshot

## Installation

Die aktuelle Windows-Version steht unter **Releases** bereit. Lade `GottesdienstRegie-Setup-<Version>.exe` herunter und führe sie aus. Spätere Versionen können direkt in der App unter **Einstellungen → Allgemein → Updates und Version** gesucht und installiert werden.

## Entwicklung

Voraussetzungen: Windows und Node.js 22 oder neuer.

```powershell
npm.cmd install
npm.cmd run dev
```

Produktionsbuild und Installer:

```powershell
npm.cmd run build
npm.cmd run installer
```

Buildausgaben landen in `dist/`, `dist-electron/` und `release/` und werden nicht in Git gespeichert. Bei einem Versions-Tag wie `v0.2.1` baut GitHub Actions den Windows-Installer und veröffentlicht ihn als GitHub Release. Dadurch müssen fertige Installer nicht dauerhaft auf dem Entwicklungs-PC gespeichert werden.

## Updates

Die installierte App prüft nach dem Start automatisch auf neue öffentliche GitHub Releases. Es wird nichts ungefragt installiert:

1. Die App meldet eine verfügbare Version und zeigt die Versionshinweise.
2. Der Download beginnt erst nach Bestätigung.
3. Die Installation und der Neustart beginnen erst nach einem zweiten Klick.

## Sicherheit

Zugangsdaten, Benutzerexporte, Admin-Schlüssel und Backend-Deploymentdateien gehören nicht in dieses Repository. Sicherheitsprobleme bitte nicht öffentlich melden; Hinweise stehen in [SECURITY.md](SECURITY.md).

Copyright © Philippusgemeinde Ev. Freikirche. Alle Rechte vorbehalten.
