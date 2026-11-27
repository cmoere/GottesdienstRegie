# ÖPNV-Folie – Umsetzung

**Ziel:** Native PRE-/POST-Loop-Folie für Bielefeld, Beckhausstraße mit sechs Designs und passenden Verkehrsmeldungen.

**Freigegebener Umfang:** Nutzer hat die native Folie bestätigt und sechs wählbare Designs, optionale Funktionen sowie einen sichtbaren Hinweis auf die Haltestellenbeschränkung verlangt. Datenvertrag: `docs/opnv-worker-display-contract.md`. Die Worker-Datei bleibt unverändert.

**Architektur:** Öffentlicher HTTPS-Worker → zentraler ExternalLoopService/TransitAdapter → streng normalisierter Snapshot → eingefrorener Output. Keine Netzwerkzugriffe im Folienrenderer. Eine gemeinsame Anfrage unabhängig von Designs. Bestehendes Output-Overlay bleibt zuständig für Testbetrieb und Gemeindelaufband.

**Gestaltung (Implementierungsentscheidung):** Klassisch, Dunkle Abfahrtstafel, Klar, Zweigeteilt, Kacheln, Großanzeige. Alle Designs nutzen volle 16:9-Fläche, lesbare Kontraste, vollständige Ziele und die Gemeindefarben. Großanzeige zeigt zwei Abfahrten gleichzeitig, übrige Designs vier bis sechs. Weitere Abfahrten wechseln seitenweise; Mindestdauer deckt alle Seiten und Meldungen ab. Verkehrsmeldungen wechseln in einem eigenen Bereich. Keine zweite globale Laufbandkopie.

**Optionen:** Design, Anzahl Abfahrten (4–24), Zeilen (4–6), sichtbare Linien (2/27/N8/N12/SEV), Gleis, Prognose/Verspätung, Fahrweg, Verkehrsmeldungen, Dauer. Restriktion „Nur Bielefeld, Beckhausstraße“ in Bearbeitung und Haltestelle im Folienkopf. Keine beliebigen Serveradressen/Stops.

## Schritte

- [x] Tests für Requestgrenze, Normalisierung, Prognosen, Ausfall, Meldungszuordnung, ungültige Inhalte und 20-Sekunden-Cache schreiben; scheitern sehen.
- [x] Typen und normalisierten Datenvertrag ergänzen; TransitAdapter an vorhandenen Cache/HTTP-Service anschließen. Nur öffentliche Felder kopieren. Alter Cache höchstens zwei Minuten, vergangene Abfahrten vor dem Take ausfiltern. Meldungsquellausfall bewahrt den letzten gültigen Stand.
- [x] Folientyp in Hinzufügen, Placement, Factory, Live-Snapshots und Renderer aufnehmen. Zentraler Abruf alle 20 Sekunden für ÖPNV; bestehende Quellen unverändert alle 60 Sekunden.
- [x] Sechs responsive Designs und Bearbeitungsoptionen ergänzen. Snapshot und Auswahl am Take einfrieren; keine harten Updates auf MAIN.
- [x] Tests für sechs Designs, Optionen, Platzierung, Mindestdauer, eingefrorene Ausgabe und leere/veraltete Daten; Typecheck und Desktop-Build.
- [x] Visuelle Browserprüfung aller Designs und des Bearbeitungsbereichs. Originalhash nochmals prüfen. Keine Veröffentlichung angefordert in diesem Schritt.

## Risiken und Prüfungen

HTTP 200 mit `ok:false` wird verworfen. Leerer Status bedeutet nicht automatisch pünktlich. Planzeit bleibt erhalten. Berliner Zeitzone und Epochwerte über Mitternacht verwenden. Administrative Felder gelangen nie in IPC/MAIN. Kein rohes HTML. Externe Nachrichtenausfälle sind keine leere gültige Liste. Abgelaufene Zeilen werden nicht erneut live geschaltet. Deaktivierte Meldungen reservieren keinen leeren Bereich. Kein Datenabruf pro Vorschaubild.

## Abschlussprüfung

- Vollständiger Unit-Testlauf: 340 Dateien, 1393 Tests erfolgreich. Zwei anschließend ergänzte Randfälle zusammen mit den neuen Tests erneut geprüft: 16 Tests erfolgreich.
- Desktop-Build nach den letzten Änderungen erfolgreich; bestehender Vite-Hinweis auf große Bundles unverändert.
- Browserprüfung: alle sechs Designs innerhalb 1920 × 1080, Zeilenhöhen, Meldungs-/Fahrwegschalter, mobile Bearbeitung, keine Browserfehler. Nach Sichtprüfung Prognose in schmalen Designs unter die Planzeit gesetzt.
- Abschließender Live-Abruf: ready, 24 Abfahrten, drei passende Verkehrsmeldungen; unzugeordnete Wuppertaler Meldung ausgeschlossen. Keine Verwaltungsfelder im öffentlichen Snapshot.
- Originaldatei SHA-256 nach Abschluss unverändert. Kein Worker-Deployment, keine Veröffentlichung und keine Änderung am unbeteiligten startup-diagnostic.cjs.
- Eigenprüfung der Daten- und Live-Grenzen; keine Programmier-/Review-Agenten eingesetzt.

## Veröffentlichung 0.99.21

Der Nutzer hat anschließend die Veröffentlichung ausdrücklich beauftragt. Normales kumulatives Update über den bestehenden plattformübergreifenden Workflow. Neue ÖPNV-Bedientexte sind als deutsche/englische Operatorressourcen registriert; in deutschen Regionalvarianten wird die in den Versionshinweisen offengelegte standarddeutsche Fachsprache verwendet. Der Worker bleibt unverändert.

Freigabeprüfung 0.99.21: vollständiger Lauf mit 340 Testdateien und 1396 Tests erfolgreich; V84-Sprachpaketprüfung, V85 (39 Tests), V86 (162 Tests), Typecheck und Desktop-Build erfolgreich. Änderungen bleiben auf die App beschränkt.
