# Bildschirmtest, Störungsbildschirm und Bibel-Seitenwechsel

## Freigegebener Umfang

Begrenzte Erweiterung der vorhandenen MAIN-Schnellanzeigen. „Bildschirmtest“
ersetzt den vorgeschlagenen Namen „Screentest“. Acht Muster werden automatisch
durchlaufen: Farbbalken, Raster/Bildränder, Graustufen, Weiß, Schwarz, Rot, Grün,
Blau. Keine feste Drei-Sekunden-Anzeigedauer: Eine passende MAIN-Rückmeldung
entscheidet über den nächsten Schritt. Keine neue Transportarchitektur,
ON-AIR-Automatik, Audioänderung, Produktinstallation oder Veröffentlichung.

## Implementiertes Verhalten und Nachweisgrenze

- Der Startdialog verlangt Bestätigung und bereits aktives MAIN/ON AIR
  (einschließlich des vorhandenen Testbetriebs). Er startet nicht selbst ON AIR.
- Der MAIN-Renderer zeichnet das Muster auf seine Canvas-Fläche. Er prüft
  repräsentative Canvas-Pixel und mindestens zwölf Renderer-Frames bei wenigstens
  einer Sekunde unveränderten Abmessungen. Größenänderungen starten die
  Stabilitätsmessung neu. Das ist eine technische Renderer-Prüfung, keine
  physische Messung von Kabel, Projektor, Schärfe, Scanout oder Farbwiedergabe.
- Neue private IPC-Rückmeldung nur vom verwalteten MAIN-Hauptframe, passend zur
  aktuellen zufälligen Run-ID und dem aktiven Muster. Unbekannte Sender, STAGE,
  Unterframes, veraltete/ungültige Ergebnisse erlauben keinen Fortschritt.
- Ein bestätigtes Send-Kommando allein gilt nicht als bestandener Schritt.
  Nach 15 Sekunden ohne gültige Rückmeldung stoppt der Lauf mit Fehler.
- Abbruch und Notfallwechsel sind möglich. Die vorherige Schnellanzeige wird
  wiederhergestellt, sofern der Test sie noch besitzt. Eine manuell gewählte
  Ersatzanzeige wird nicht überschrieben. Das wird auch im Ausgabemanager
  atomar anhand der aktuellen MAIN-Run-ID geprüft, nicht nur im Operator-UI;
  STAGE bleibt unberührt. Nur der Operator-Hauptframe darf den Restore anfordern.
  Auch die Wiederherstellung ist auf
  drei Sekunden begrenzt; Fehler bleiben sichtbar statt „abgebrochen“ zu melden.
- Auswertung als Operator-Popup mit echten Ergebnissen und ausdrücklich offener
  Sichtprüfung. Diagnosewerte und Run-ID erscheinen nicht im Besucherbild.
- MAIN-Banner wird während des Bildschirmtests nur visuell ausgeblendet, nicht
  zurückgesetzt. Das unabhängige Testbetriebs-Wasserzeichen bleibt erhalten.
- Neuer Störungsbildschirm für den Standard-Texttyp: schwarze Fläche, dezenter
  Akzent #608F9A, ruhige Überschrift und Hinweistext #B6BEC3 in Cera Pro mit
  vorhandenem Font-Fallback. Gespeicherte Texte/Farben/aktivierte Zustände und
  individuell gewählte Logo-Typen bleiben erhalten. Mehrzeilige Texte sind in
  den bestehenden Schnellanzeige-Einstellungen editierbar.
- Neue Raumhinweis-Überdeckung ausschließlich für Bildschirmtest und technische
  Störung; keine Änderung der Nachprogramm-Navigationssperre.

## Bibel-Navigation

Ursache: `applyQuick` öffnete bei jedem Payload vom Typ `bible` den Dialog,
auch bei einem bereits geladenen Seitenwechsel. Extraktion des bestehenden
Verhaltens reproduzierte den Fehler in `work/bible-pages-red.log`.
Jetzt öffnet nur die inhaltslose Bibel-Kachel den Dialog. Geladene Seiten werden
mit unveränderten OSB-/Design-Daten direkt vorbereitet bzw. an MAIN gesendet.
F9 bleibt der bewusste Zugriff auf den Eingabedialog. Native Prüfung der Folge
Seite 1 → 2 → 1: richtiger Text/Seitenzähler, null zusätzliche Dialogöffnungen.

## Testgetriebene Umsetzung und Review

RED-Artefakte unter `work/`: `screen-test-red.log`, `bible-pages-red.log`,
`screen-test-integration-red.log`, `screen-test-canvas-red.log`,
`screen-test-dialog-red.log`, `screen-test-review-red.log`,
`screen-test-notice-scope-red.log`, `screen-test-final-review-red.log`,
`screen-test-atomic-restore-red.log`.
Der gezielte Lauf `screen-test-safe-restore-green.log` bestätigt 34 Tests.
Dabei werden reale Koordination, Abbruch, Timeout und Zustandswechsel getestet;
nur externe Electron-/Canvas-/Bridge-Grenzen sind im Unit-Test ersetzt.

Autorreview ohne Delegation, wie vom Benutzer gewünscht. Gefundene Fehler vor
Abschluss korrigiert und gezielt RED→GREEN geprüft: ungültig gespeicherte
Musterwahl, versehentlich zu breite Raumhinweis-Überdeckung, Erhalt individueller
Störungstypen, verschluckter Restore-Fehler bei Abbruch, unbeschränkt wartender
Restore. Zusätzlich verhindert der atomare MAIN-Restore eine Übernahme über
eine zwischenzeitlich gesetzte externe Notfallanzeige. Es gab keine unabhängige
Zweitprüfung.

## Native Bildprüfung

Eigene versteckte Electron-37.10.3-Fixture, keine installierte Anwendung, keine
Änderung von Displayzuordnungen oder Audio. `node scripts/test-screen-test-native.cjs`.
Vorläufig bestandener Lauf: `work/screen-test-native-final.log`, Artefakte
`work/screen-test-native-DEIaT8/` einschließlich PNGs und Rohbericht.
Alle acht Muster wurden zusätzlich anhand echter Capture-Pixel kontrolliert.
Störungslayout und Farbbalken visuell geprüft: lesbare Hierarchie, vollständiges
Bild, Wasserzeichen unten rechts. Störungstext bleibt innerhalb 1920×1080.

Erste native Proben warteten nur vier Sekunden und fanden noch keine Rückmeldung.
Diagnose in `screen-test-native-raf-diagnostic.log`: versteckte Fixture zunächst
etwa ein RAF/s, trotz korrekter 1920×1080-Fläche. Der Harness wartet jetzt auf
die unveränderten Prüfkriterien. Keine Reduzierung der erforderlichen Frames:
im bestandenen Lauf brauchten Farbbalken 12,124 Sekunden (12 Frames), spätere
Muster nach einer Aufnahme rund 1,01 Sekunden (62–63 Frames). Diese Zeiten sind
keine Bildratenabnahme und kein Nachweis physischer Monitorleistung.

Frühere Gesamtprüfungen während der laufenden RED-Phase sind nicht der finale
Abnahmestand: `screen-test-unit-final.log` hatte 772 grüne Tests vor den letzten
Review-Ergänzungen; `screen-test-unit-verified.log` sah zwei noch rote
Restore-Regressionstests. Ein zwischenzeitlicher Web-Typecheck sah einen gerade
erst ergänzten Testexport. Diese Protokolle bleiben erhalten; maßgeblich sind
die abschließenden `screen-test-release-check-*`. Ein weiterer Zwischenlauf
`screen-test-frozen-unit.log` bestand mit 776 Tests; sein anschließender Build
traf noch den neuen, damals roten atomaren Restore-Test. Der darauffolgende
separate `screen-test-candidate-build.log` war erfolgreich.

## Veröffentlichungsgrenze

Produktmanifest, Lockfile und installierte Runtime bleiben unverändert. Der
Bildschirmtest ist keine Reparatur oder Abnahme der offenen Original-PowerPoint-
Pipeline und ersetzt keine vollständigen Regionaltexte. Diese ausdrücklich vom
Benutzer verlangten Releasebedingungen sind weiterhin offen. Keine Tags,
Installer, Updateserver-Änderungen, Pushes oder Veröffentlichung aus dieser Arbeit.

## Abschließende Abnahme dieses Änderungsumfangs

Serieller Lauf auf abschließend unverändertem Code, alle Befehle Exit 0:

- Vollständige Vitest-Suite: **186 Dateien / 777 Tests**, 241,62 Sekunden.
  `work/screen-test-release-check-unit.log`.
- Desktop-Build einschließlich Electron-Typecheck und Assetkopie: PASS,
  Vite 11,63 Sekunden. `work/screen-test-release-check-build.log`.
- Web-Build: PASS, Vite 11,34 Sekunden.
  `work/screen-test-release-check-build-web.log`.
- Browser-Smoke: **5/5 PASS**, 48,9 Sekunden.
  `work/screen-test-release-check-browser.log`.
- Bestehende native Desktop-Interaktion, Meldungsdarstellung und **17 regionale
  UI-Varianten** PASS. `work/screen-test-release-check-existing-native.log`.
  Diese UI-Prüfungen bestätigen ausdrücklich keine vollständige regionale Prosa.
- Neuer nativer Ausgabetest: **8/8 Muster**, komponierte Pixel, Störungslayout,
  Wasserzeichen und Bibelfolge 1→2→1 PASS.
  `work/screen-test-release-check-native.log`; finale Rohdaten und PNGs unter
  `work/screen-test-native-tTOgCV/`. Der erste Schritt brauchte 12,111 Sekunden,
  weitere Schritte 1,008–1,023 Sekunden bei unveränderten Kriterien.
- Bekannte Bundlegrößen-, Entwicklungs-CSP- und NO_COLOR-Warnungen nicht als
  behoben ausgegeben. Keine Sicherheitslockerung der Produkt-Ausgabefenster.

Produkt 0.85.0 / installierte Electron-Runtime 37.10.3 unverändert.
Fremde `tests/smoke/startup-diagnostic.cjs` unverändert und nicht gestaged;
SHA256 B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5.
Keine eigene Testinstanz mehr aktiv. Nicht veröffentlicht oder installiert.
