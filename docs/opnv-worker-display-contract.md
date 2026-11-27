# ÖPNV: öffentliche Anzeigeschnittstelle

Stand: 27.11.2026. Anbindung als native PRE-/POST-Loop-Folie implementiert; für Update 0.99.21 vorbereitet.

## Quelle bleibt unverändert

Worker: https://vrr-proxy.crbnm06.workers.dev/

Die vom Nutzer gelieferte Worker-Datei wird weder bearbeitet noch neu veröffentlicht. SHA-256 der gelesenen Originaldatei: `FA80A1FBA8A209D24C8A6F7ADDD03844035F3301A9F33398AA1A39EE8A756E2E`.

## Vorhandenen öffentlichen Endpunkt verwenden

`GET /api/bottom-departures`

Parameter aus der vorhandenen Querformatanzeige:

```text
stopId=de:05711:5075
limit=12
min=6
lines=2,27,N8,N12,SEV
onlyRealtime=0
toleranceSec=15
includeNextDay=1
forceNextDay=0
realtimeTime=0
status=1
includeMessages=1
currentMessagesOnly=1
messageLimit=25
liveVia=1
client=screen
```

Haltestelle: Bielefeld, Beckhausstraße (U). `min=6` ist die berücksichtigte Gehzeit. Der Endpunkt berücksichtigt bereits die Regeln und Änderungen des bestehenden Workers. Keine parallelen direkten VRR/EFA-Abfragen, keine Verwaltungsendpunkte und keine Zugangsschlüssel in der Anzeige.

## Erlaubte Anzeigedaten

Aus dem Antwortkopf: `title`, `stopId`, `updatedAt`, `walkMin`, `source`; außerdem `ok`, `stale`, `staleAgeMs` und `messageSourceAvailable` ausschließlich zur Zustandsprüfung.

Pro Abfahrt gezielt übernehmen:

- Linie: `line`, Verkehrsmittel: `mode`
- Ziel: `destination` bzw. `direction`
- Gleis/Steig: `platform`
- Planzeit: `planned`, `plannedEpoch`, `serviceDateISO`
- Prognose: `real`, `effectiveDepartureEpoch`, `minutesLeft`
- Hinweise: `status`, `statusKind`, `isCancelled`
- Fahrweg bei Bedarf: `viaStops`, `viaText`
- Gegebenenfalls öffentliche Aufzugshinweise: `elevatorStatusLabel`, `elevatorStatusText`, `elevatorStatusKind`

Keine Rohobjekte an MAIN weitergeben. Insbesondere `adminOriginal`, `adminHidden`, `controlKey`, Diagnose- und Matchingfelder nicht in das öffentliche Modell kopieren. Eine leere Statuszeichenfolge ist kein Nachweis für Pünktlichkeit: Beim Live-Test unterschieden sich `planned` und `real` trotz leerem `status`. Plan- und Prognosezeiten daher separat behandeln und vorhandene Zeitstempel zur Berechnung verwenden; niemals die Planzeit überschreiben.

Verkehrsmeldungen: öffentliche Textfelder `title`, `heading`, `description`, `displayText`, `text` sowie `lines`/`line` gezielt normalisieren. HTML nur über den vorhandenen geprüften Sanitizer, sonst als Text anzeigen.

## Aktualisierung und Fehlerverhalten

- Vorschlag: zentrale Abfrage alle 20 Sekunden, höchstens eine laufende Anfrage; 13,5 Sekunden Zeitlimit entsprechend der bestehenden Worker-Anzeige.
- HTTP-Erfolg allein genügt nicht: `ok !== false` und `Array.isArray(departures)` prüfen.
- Letzten gültigen Stand bei Ausfall behalten, aber nicht als frisch kennzeichnen. Veraltete Abfahrten vor der Anzeige zeitlich prüfen.
- `stale: true` ausdrücklich berücksichtigen; `updatedAt` ist kein Nachweis für bestätigte Echtzeit jeder einzelnen Fahrt.
- Bei `messageSourceAvailable === false` bisherige gültige Meldungen behalten, nicht durch eine vermeintlich leere Liste löschen.
- Keine technischen Fehlertexte auf Besucher-Ausgaben.
- Neue Daten an sicheren Folienwechseln übernehmen; keine laufende Ausgabe vollständig neu starten.

## Live-Prüfung

Am 27.11.2026 antwortete der Endpunkt mit `ok: true` und zwölf Abfahrten. Das bestätigt die aktuelle Erreichbarkeit und die gelesene Antwortstruktur, nicht die fachliche Richtigkeit aller Fahrplandaten oder eine bereits fertige Integration.

## Vorgeschlagene Umsetzung

Native ÖPNV-Folie als PRE-/POST-Loop-Element über den bestehenden zentralen Datenabruf mit Cache. Anzeige von Linie, Ziel, Abfahrt, Gleis/Steig und Hinweis; bestehendes globales Laufband und Test-Wasserzeichen weiterverwenden. Alternative: vorhandene `/screen`-Seite einbetten, mit geringerer Integration in Vorschau und Steuerung. Die native Variante wurde vom Nutzer bestätigt; sechs Designs und Bearbeitungsoptionen sind implementiert.

## Ergänzung nach Live-Prüfung der Anbindung

Der Worker kann unzugeordnete EFA-Netzmeldungen aus anderen Städten mitsenden. Die App übernimmt daher passende Linienmeldungen, lokal als Bielefeld/Beckhausstraße/moBiel erkennbare allgemeine Meldungen sowie vom Worker ausdrücklich als manuell/custom gepflegte allgemeine Hinweise. Versteckte Meldungen werden verworfen. Diese Zuordnung ist ein zusätzlicher Anzeigefilter, keine Änderung des Workers. Der abschließende Abruf ergab 24 Abfahrten und drei passende Meldungen.

`messagesUpdatedAt` wird ausschließlich im normalisierten App-Snapshot geführt, um bei wiederholten Quellenausfällen übernommene Meldungen nach spätestens zwei Minuten verfallen zu lassen. Es wird nicht in die Datenstruktur des Workers geschrieben.
