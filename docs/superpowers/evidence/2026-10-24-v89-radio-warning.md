# v89 — geprüfter Zwischenstand Radio und Wetterwarnungen

Stand 24.10.2026. Native Umsetzung des vom Nutzer freigegebenen [Teilplans](../plans/2026-10-24-v89-radio-warning.md), Grundlage 33d00e0. Dies ist keine vollständige v89-Fertigstellung und keine Veröffentlichung.

## Implementiert

- Radioauswahl ersetzt alle bisherigen radio:-Einträge desselben Ziels am ersten Radioplatz. Normale Audiodateien und ihre Reihenfolge bleiben unverändert; ohne vorherigen Sender wird angefügt. Reiner Radiodialog speichert und schließt direkt, ohne FERTIG-Button. Die eingebettete Suche klappt zu; allgemeine Audioeinstellungen bleiben offen. Schnelle doppelte Übernahme ist gesperrt, erneutes Öffnen erlaubt einen weiteren Austausch.
- Radio-Vorhören pausiert beim Schließen explizit sein eigenes Audioelement und gibt dessen Quelle frei. Bestehende Metadaten-Abmeldung bleibt auf die eigene preview-Sitzung beschränkt. Keine Änderungen an AudioEngine, Routen, Lautstärke, Ducking oder Hintergrund-Metadaten.
- Mehrere gültige DWD-Warnungen zeigen 1/2, 2/2 usw. und zugängliche Positionstexte. Abgelaufene oder noch nicht gültige Einträge werden vor der Zyklusauswahl entfernt; kein leerer Anzeigeplatz für eine abgelaufene Warnung. Gemeinsame Zykluszeit bleibt unverändert.
- Lokale SVG-Symbole für Gewitter, Wind/Sturm, Regen, Schnee, Glätte/Frost, Hitze, Nebel; unbekannte Art erhält ein neutrales Warndreieck. Keine offiziellen DWD-Level-Logos nachgebildet. Originaltext, Gültigkeit, Quelle und PRE/POST/Countdown-Freigabe bleiben erhalten.

## RED → GREEN und Regression

- Vor Änderungen: **222 Dateien / 896 Tests bestanden**, 363,34s, `work/v89-baseline.log`.
- Neue tatsächliche Komponenten-/Hook-Tests zuerst fehlgeschlagen: fehlende Austauschfunktion und 19 Verhaltensfehler, `work/v89-red.log`.
- Testaufbaukorrektur: createServiceItem übernimmt keine backgroundAudio-Option. Der gespeicherte Audiostand wird deshalb im Fixture ausdrücklich nach der Factory-Erstellung zugewiesen; kein unbeteiligtes Produktdatenmodell geändert. Mit korrektem Fixture altes Append-Verhalten erneut eingesetzt: drei Zieltests RED (`work/v89-radio-target-red.log`), danach Austausch wiederhergestellt.
- Radio-Gate: **6 Dateien / 32 Tests bestanden**, `work/v89-radio-verified.log`. Reale Präsentations-Store-Schreibwege für PRE, POST und Element; externe Suche und jsdom-Medienfunktionen ersetzt, nicht das Dialogverhalten.
- Warnungs-Gate: **7 Dateien / 35 Tests bestanden**, `work/v89-warning-verified.log`. Autorprüfung fand zu breiten Eis-Substring: REISEHINWEIS wurde fälschlich als Frost erkannt. Zusätzlicher Test zuerst RED (`work/v89-icon-review-red.log`), anschließend Wortgrenzen/spezifische Begriffe statt allgemeinem eis/ice-Substring.
- Abschließend **225 Dateien / 918 Tests bestanden**, 374,18s, `work/v89-full.log`.
- App-TypeScript erfolgreich (`work/v89-typecheck.log`); vollständiger Produktionsbuild nach der Suite seriell erfolgreich (`work/v89-build.log`, Vite 18,91s, Electron-TypeScript und Regionaldateikopie erfolgreich). Bestehende Bundle-Größenwarnung nicht als behoben ausgegeben.

## Native Bildprüfung und Entscheidung zum Testaufbau

Vollständige bestehende externe Ausgabe-/Canvas-Probe erfolgreich: `work/v89-native.log`, Ordner `work/external-loop-native-hgwqDa`. Warnungen mit 1/2 und 2/2 sowie Frost-/Gewittersymbol bei 1920×1080; langer Kopf und Zähler bei 640×360 ohne horizontalen Überlauf oder abgeschnittene Kopfzeile. Quelle und Testwasserzeichen vorhanden. Acht echte Canvas-Prüfschritte und restliche Legacy-Ausgaben bleiben im vollständigen Probeablauf enthalten.

Eine normale versteckte Fensteraufnahme zeigte schwarzen Inhalt unter der zweiten Warnung. DOM-Geometrie blieb korrekt (1420,8×799,2, Hintergrund rgb(96,143,154)); deshalb wurde kein Produkt-Rendering auf Verdacht verändert. Isolierter Vergleich mit aktivem Offscreen-Compositor bestätigt dieselben Maße und tatsächliche Hintergrundpixel für erste/zweite Warnung sowie unterdrückte Warnung: `work/v89-warning-painted.log`, Ordner `work/external-loop-native-RVqnuH`. Beide Bildvarianten visuell geprüft. Fokussierter Offscreen-Modus und Pixel-/Geometrieassertionen im Harness erhalten.

**Ruling:** Der Vergleich stützt eine Begrenzung normaler unsichtbarer Capture-Flächen; die Produktkomposition bleibt unverändert. Das beweist nicht, dass jeder physische Ausgabeweg fehlerfrei ist. Kosten bei falscher Zuordnung: ein reales Anlagenproblem bliebe offen; dafür ist eine getrennte Sichtprüfung erforderlich. Keine physische Monitorumschaltung oder hörbare Wiedergabe durchgeführt.

## Technisches Selbstreview

Autorprüfung statt unabhängiger technischer Delegation entsprechend der Native-/Nur-Übersetzungsfreigabe; diese Prüfung ist schwächer als unabhängiges Review. Geprüft: Doppelklick/Reopen, unveränderte Nicht-Radio-Dateien, Zielisolation, kein neuer Hörstart durch die Auswahl selbst, eigene Preview-Abmeldung, Gültigkeitsgrenzen/Zähler, gleiche Zustände/Zeitpunkte in zwei Hook-Instanzen, unbekannte Ereignisse, Ausgabegeometrie und unveränderte Überlagerungs-/Medienzustände. Keine offenen Critical/Important-Befunde innerhalb dieses Teilplans; keine zurückgestellten Minor-Befunde erfasst.

Fremde `tests/smoke/startup-diagnostic.cjs` unverändert/untracked, SHA256 B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5. `git diff --check` erfolgreich; keine eigenen Electron-Probeprozesse übrig. Implementierung in 3e6260c und f7e2207. Branch/Arbeitsverzeichnis bleiben für die übrigen v89-Arbeiten erhalten; kein Push, Merge, Installer oder Publish.

## Weitere v89-Arbeiten ausdrücklich offen

- Vollständige Bedienoberflächen der 15 freigegebenen Regionalvarianten: gespeichertes v88-Inventar 6339 Einträge, davon 3721 noch zu klassifizieren, nicht gleichbedeutend mit 3721 fehlenden Übersetzungen. Größte Bereiche App, ProductionWorkspace, MediaBrowser, Store/FileMenu. Hilfe- und Versionsdokumentation war vollständig, die übrige UI nicht. Nach weiteren UI-Änderungen Inventar frisch erzeugen; vollständige Deckung prüfen, keine pauschalen technischen Ausschlüsse oder Kopie von Hochdeutsch als angebliche Regionalisierung. Die Partial-Freigabe von 0.88 wird nicht still auf v89 erweitert.
- PowerPoint-Originalmodus: bestehende Hybrid-/GPU-Pläne weiter maßgeblich; Transport-Leistungsabnahme, Office-Adapter/-Befehle, Originalaudio, harter Helper-Tod/Supervisor und Produktintegration nicht vollständig nachgewiesen. Produkt weiterhin Electron 37, separate GPU-Probe verwendet ausdrücklich geprüfte Runtime 45. Kein Originalmodus freigeschaltet und keine Leistungsgrenzen gelockert. Die hier beobachteten Hidden-/Offscreen-Unterschiede sind höchstens eine Hypothese für eine künftig kontrollierte Beobachtungsprüfung, kein Beweis für eine behobene PowerPoint-Ursache.

Paketversion und veröffentlichter Kanal bleiben 0.88.0. Eine vollständige v89 oder aktuelle Anlagenprüfung wird nicht behauptet.
