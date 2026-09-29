# V69: Zentrale Firebase-Loops und konfigurierbare „Läuft gerade“-Folie

## Ziel

GottesdienstRegie verwendet die bestehende Firebase Realtime Database des Projekts `philippusgemeindebie` als einzige Online-Quelle für Veranstaltungen und Meldungen. Die Pfade `veranstaltungen/` und `meldungen/` bleiben unverändert. Rohdaten werden niemals direkt gerendert. Parallel wird die „Läuft gerade“-Folie vollständig konfigurierbar und ihre Skip-Logik zuverlässig.

## Nicht-Ziele

- Keine zweite Veranstaltungs- oder Meldungsdatenbank.
- Keine Änderung der bestehenden Firebase-Pfade.
- Keine Identifikation über Titel statt Firebase Child-Key.
- Keine zweite Zeit-, Absage-, Orts- oder Meldungslogik in UI oder Renderer.
- Keine direkten Firebase-Schreibzugriffe aus React-Komponenten, MAIN oder Ausgabefenstern.

## Architektur

Die Datenkette lautet:

`Firebase → FirebaseGemeindeService → EventService / AnnouncementService → öffentliche Modelle → Header / Countdown / PRE-/POST-Loop / ScreenmeldungRenderer / Preflight`

Firebase wird im Electron-Hauptprozess genau einmal durch `FirebaseGemeindeService` initialisiert. Der Service besitzt die Refs für `veranstaltungen` und `meldungen`, verwaltet Verbindung, Realtime-Abonnements und den letzten gültigen Snapshot. Renderer und Fenster greifen nur über IPC auf vorbereitete Daten zu.

### FirebaseGemeindeService

- Initialisiert die bestehende Projektkonfiguration genau einmal.
- Stellt kontrollierte Abonnements für beide Pfade bereit.
- Meldungen verwenden `child_added`, `child_changed` und `child_removed`.
- Veranstaltungen werden realtime als Sammlung beobachtet; jedes Objekt wird als `{ eventKey: snap.key, ...snap.val() }` normalisiert.
- Child-Keys bleiben bei jedem Transformationsschritt erhalten.
- Speichert den letzten gültigen Snapshot mit Zeitpunkt lokal für Offline-Fallback.
- Liefert strukturierte Zustände wie `online`, `offline-cache`, `empty` und `error`; technische Fehlertexte werden nicht an MAIN gegeben.

## Veranstaltungen

### Rohmodell und EventService

`ChurchEvent` bildet die vorhandenen Firebase-Felder kompatibel ab, darunter Stammdaten, geplante Zeiten, Verspätungsfelder, Absage, Ersatzort, Onlineinformationen, Anmeldung, Predigtangaben, Cover, Seriensteuerung, Papierkorb und Zeitstempel. Unbekannte zusätzliche Felder dürfen beim Lesen toleriert werden.

`EventService` stellt mindestens bereit:

- `getByKey(eventKey)`
- `getPlannedStart(event)` / `getPlannedEnd(event)`
- `getEffectiveStart(event)` / `getEffectiveEnd(event)`
- `isCancelled(event)`
- `getEffectiveLocation(event)`
- `isPublic(event)`
- `getUpcomingEvents()`

Geplante Werte bleiben in `start_datum`, `start_uhrzeit`, `ende_datum` und `ende_uhrzeit`. Effektive Werte verwenden vorrangig die bestehenden Verspätungsfelder und kompatibel `delay.start`/`delay.end`. Absagen werden über `cancelled === true` oder `cancel.enabled === true` erkannt. Ein Ersatzort hat für die öffentliche Darstellung Vorrang, ohne den geplanten Ort zu überschreiben.

`PublicEvent` enthält nur für Ausgaben benötigte Daten: `id`, `title`, `plannedStart`, `plannedEnd`, `effectiveStart`, `effectiveEnd`, `plannedLocation`, `effectiveLocation`, `delayed`, `cancelled`, `locationChanged`, `infoText`, `coverUrl`, `registrationRequired`, `preacher`, `sermonTitle`.

### Verknüpfung und Befehle

Präsentationen speichern ausschließlich `eventLink.eventKey`. Titel-Snapshots sind nur Anzeigehilfen und niemals Identität. Umbenennung, Absage, Verzögerung oder Ortswechsel lösen die Verknüpfung nicht.

`EventCommandService` ist der einzige Schreibweg. Eine Änderung der Gottesdienstzeit schreibt Effektiv-/Verspätungsfelder und überschreibt niemals die Grundzeit. Änderungen der verknüpften Veranstaltung aktualisieren Header, Countdown, Servicezeit und vorbereitete Loop-Daten live.

## Meldungen

### AnnouncementService

Jede Meldung wird als `{ messageId: snap.key, ...snap.val() }` eingelesen. Das vorhandene Schema bleibt erhalten und wird nur um die optionale Struktur ergänzt:

```ts
gottesdienstRegie: {
  enabled: true,
  loopTargets: {
    preLoop: true,
    postLoop: false,
    preProgram: false
  }
}
```

Eine Meldung ist für den Saalscreen gültig, wenn sie nicht im Papierkorb liegt, öffentlichen Status besitzt, `messageScreen` aktiv ist, ihr Start erreicht und ihr Ende nicht überschritten ist. Standardstart ist `giltAb`; bei `saalscreenUseShowFrom === true` und vorhandenem `showFrom` gilt `showFrom`. `giltBis = "Bis auf Weiteres"` besitzt kein festes Ende. Als Text gilt zuerst `textMeldung`, danach `beschreibung`.

`messageScreen` ist die Grundfreigabe. `gottesdienstRegie.loopTargets` grenzt zusätzlich PRE-/POST-Ziele ein. Ohne Ziel-Freigabe darf eine Meldung im betreffenden Loop nicht erscheinen.

`PublicAnnouncement` enthält ausschließlich `id`, `title`, `text`, `category`, `priority`, `validFrom`, `validUntil`, `qrCode` und die für den Renderer benötigte QR-Referenz. Interne Kommentare, Urheber-/Adminfelder und andere Kanaltexte werden nicht an MAIN übertragen.

## PRE-/POST-Loop und stabile Live-Snapshots

Die Elemente „Meldungen“ und „Veranstaltungen“ lesen ausschließlich die zentralen Services.

- Veranstaltungen: nur nicht gelöschte, öffentliche und zeitlich relevante Einträge; Sortierung nach effektiver Startzeit. Absagen werden nicht als normale kommende Termine dargestellt.
- Meldungen: nur aktuell gültige öffentliche Meldungen mit passendem Loop-Ziel.
- Der bestehende `screenmeldung.html/css/js`-Stil bleibt Grundlage, erhält aber nur `PublicAnnouncement` und initialisiert Firebase nicht mehr selbst.
- Jeder Folienwechsel übernimmt atomar den zuletzt vorbereiteten Snapshot.
- Eine sichtbare Folie bleibt bis zu ihrem kontrollierten Ende unverändert.
- Wird der sichtbare Eintrag gelöscht, endet er normal und wird anschließend nicht erneut gewählt.
- Null gültige Einträge ergeben `EMPTY`; der `LoopController` überspringt das Element ohne Schwarzbild.
- Offline darf der letzte Snapshot nur verwendet werden, solange seine Inhalte nach derselben Fachlogik noch gültig sind.
- Bedienoberflächen dürfen `Offline · letzter Stand HH:mm Uhr` anzeigen. MAIN zeigt keine Netzwerk- oder Firebase-Fehler.

## Preflight

Preflight prüft:

- Firebase-Verbindungszustand und Alter des Offline-Snapshots.
- Auflösung der verknüpften Veranstaltung per Child-Key.
- Anzahl geladener und gültiger Veranstaltungen.
- Anzahl gültiger Meldungen.
- Passende Inhalte für jedes konfigurierte PRE-/POST-Element.

Optionale dynamische Loop-Inhalte erzeugen standardmäßig Warnungen und blockieren ON AIR nicht. Unverzichtbare bestehende Preflight-Fehler bleiben unverändert.

## „Läuft gerade“-Konfiguration

### Designauswahl

Das Design-Dropdown wird durch ein Raster aus zehn anklickbaren Karten mit kleinen echten Vorschauen ersetzt. Die Karte verwendet denselben Renderer und dieselben Defaults wie Vorschau und MAIN. Auswahl ist klar markiert und per Tastatur bedienbar.

### Darstellung

Pro „Läuft gerade“-Element werden gespeichert:

- Design-ID.
- Hintergrund-, Akzent- und Textfarbe.
- Sichtbarkeit von Cover und Album.
- Für Label, Titel, Interpret und Album jeweils Sichtbarkeit und Schreibweise `original`, `uppercase` oder `lowercase`.
- Visualizer-Stil, Ecke, Farbe und Größe.
- Skip bei inaktiver Wiedergabe.
- Anzeigedauer als ganzzahlige Sekunden ab 1.

Die Texte erhalten ausreichende Zeilenhöhe und oberen Innenabstand. Kein Design darf Oberlängen, Akzente oder Umlautpunkte von Ä/Ö/Ü abschneiden.

### Audio-Visualizer

Bei analysierbaren lokalen oder kompatiblen Onlinequellen reagiert der Visualizer auf echte Web-Audio-Pegel/Frequenzdaten. Wenn ein Radiostream die Analyse durch CORS verhindert, wechselt er automatisch zu einer glaubwürdigen rhythmischen Ersatzanimation. Der Fallback wird nur während aktiver Wiedergabe animiert und respektiert `prefers-reduced-motion`.

### Skip- und Zeitlogik

Die Anzeigedauer ist ein freies Zahlenfeld, das Werte kleiner 1 auf 1 normalisiert. Die Skip-Prüfung erfolgt beim Ermitteln des nächsten Loop-Elements und nochmals unmittelbar vor dem Live-Schalten. Ist keine Wiedergabe aktiv und Skip aktiviert, darf „Läuft gerade“ weder ausgewählt noch an MAIN gesendet werden. Endet Audio während die Folie sichtbar ist, erfolgt der Wechsel kontrolliert am nächsten sicheren Übergang.

## Datenfluss und Sicherheit

- Firebase-Rohdaten verbleiben in den Fachdiensten.
- IPC-Payloads enthalten nur normalisierte, öffentliche Modelle und Statusdaten.
- Renderer dürfen keine Firebase-Konfiguration importieren.
- Schreibbefehle validieren Child-Key und Felder im Hauptprozess.
- Cache-Dateien enthalten ausschließlich notwendige Snapshots; sensible interne Meldungsfelder werden nicht in Ausgabe-Caches übernommen.

## Fehlerbehandlung

- Netzwerkfehler ändern den letzten gültigen Live-Snapshot nicht.
- Fehler werden im Bedienbereich knapp und verständlich angezeigt.
- Ungültige Einzelobjekte werden protokolliert und aus der öffentlichen Auswahl ausgeschlossen, ohne den gesamten Loop zu stoppen.
- Fehlende verknüpfte Veranstaltungen werden im Header und Preflight gemeldet, aber nicht anhand des Titels neu zugeordnet.

## Tests und Abnahme

1. Firebase wird pro Prozess einmal initialisiert; UI und Screenmeldung initialisieren nicht selbst.
2. Event- und Message-Child-Keys bleiben nach jeder Normalisierung erhalten.
3. Umbenannte Veranstaltung bleibt verknüpft.
4. Effektive Zeit und Ersatzort überschreiben geplante Rohwerte nicht.
5. Zeitänderungsbefehl schreibt ausschließlich Effektiv-/Verspätungsfelder.
6. Absagen werden zentral erkannt und nicht als normale kommende Termine gezeigt.
7. Meldungsstatus, Start, Ende, „Bis auf Weiteres“, `showFrom` und PRE-/POST-Ziele werden korrekt gefiltert.
8. `PublicEvent` und `PublicAnnouncement` enthalten keine internen Felder.
9. Realtime-Änderung verändert keine gerade sichtbare Folie; nächster sicherer Wechsel übernimmt sie.
10. Gelöschter sichtbarer Eintrag endet kontrolliert und wird nicht erneut angezeigt.
11. Leere dynamische Elemente werden ohne Schwarzbild übersprungen.
12. Offline-Cache wird nur mit weiterhin gültigen Inhalten verwendet.
13. Preflight zeigt Verbindung, Verknüpfung und Inhaltszahlen, ohne optionale leere Loops unnötig zu blockieren.
14. Zehn Designkarten ersetzen das Dropdown und aktualisieren dieselbe Vorschau wie MAIN.
15. Farben, Textsichtbarkeit, Schreibweise und Visualizer-Konfiguration bleiben nach Neustart erhalten.
16. Audioanalyse steuert den Visualizer; blockierte Radios nutzen den aktiven Fallback.
17. Ä, Ö und Ü werden in allen zehn Designs vollständig dargestellt.
18. Anzeigedauer akzeptiert 1 Sekunde und normalisiert kleinere Werte.
19. Inaktive „Läuft gerade“-Elemente mit Skip werden im Loop und unmittelbar vor MAIN übersprungen.

## Veröffentlichung

Die Änderung wird als V69 mit aktualisierten Release-Notes, Release-Guard, Windows-Installer sowie macOS- und Linux-Paketen veröffentlicht. Vor Veröffentlichung müssen Unit-/Integrationstests, TypeScript-Prüfung, Produktionsbuild, Installer und öffentliche Downloadprüfung erfolgreich sein.
