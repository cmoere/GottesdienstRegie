# v89 Radioauswahl und Wetterwarnungen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution preserved; no technical delegation.

**Goal:** Pro Audiokonfiguration genau einen wählbaren Radiosender mit direkter Übernahme anbieten und mehrere gültige DWD-Warnungen mit Zähler und passenden Symbolen darstellen.

**Architecture:** Kleine gemeinsame Auswahlfunktion vor den bestehenden synchronen Konfigurationsschreibzugriffen; keine Änderung der AudioEngine. Der vorhandene Warnungsselektor und das globale Warnungsbanner werden erweitert, ohne Provider- oder Ausgabeverträge umzubauen.

**Tech Stack:** Bestehendes React/TypeScript/Zustand, Vitest/Testing Library, lokale SVG-Symbole; keine zusätzlichen Abhängigkeiten.

**Spec:** `docs/superpowers/specs/2026-10-24-v89-radio-warning-design.md`

**Status 24.10.2026:** Beide Aufgaben lokal implementiert und geprüft. Abschließende Suite 225 Dateien / 918 Tests, Produktionsbuild erfolgreich. [Nachweise und verbleibende v89-Arbeiten](../evidence/2026-10-24-v89-radio-warning.md). Keine Veröffentlichung.

## Global Constraints

- Neuer Radiosender ersetzt den bisherigen desselben Ziels; andere Audiodateien bleiben erhalten.
- PRE/POST/Elemente unabhängig; keine AudioRoute-, Lautstärke- oder Quellenneustartänderung.
- Radio-Popup übernimmt und schließt direkt, ohne eigenen „Fertig“-Button.
- Warnungstext/Quelle/Gültigkeit und PRE/POST/Countdown-Beschränkung bleiben unverändert.
- Nur aktuell gültige Warnungen zählen; neutrale unbekannte Art bleibt darstellbar.
- Native Implementierung; Fremddatei unverändert; kein Publish oder installierter App-Eingriff.
- PowerPoint und vollständige Regional-UI sind weitere eigenständige v89-Arbeiten, nicht durch diesen Teilplan abgeschlossen.

## Review Focus

1. Doppelklick auf Hinzufügen darf nicht zweimal speichern oder schließen — Task 1.
2. Alte Konfiguration mit mehreren Radioeinträgen und normalen Dateien behält alle normalen Dateien — Task 1.
3. Änderung am PRE-Ziel darf POST/andere Elemente nicht verändern — Task 1.
4. Ablauf einer Warnung während des Zyklus darf keinen falschen Zähler oder leeren Platz erzeugen — Task 2.
5. Unbekannte/lang benannte Warnung, schmale Vorschau und vorhandenes Laufband bleiben lesbar — Task 2 plus native Sichtkontrolle.

## Task 1: Eine Radioauswahl, direkte Übernahme

**Files:** Create `src/backgroundAudioSelection.ts`, `src/backgroundAudioSelection.test.ts`, `src/BackgroundAudioPanel.test.tsx`; modify `src/BackgroundAudioPanel.tsx`, `src/RadioStationBrowser.tsx` nur falls für Vorhör-Cleanup erforderlich.

**Interfaces:** `replaceRadioTrack(tracks: BackgroundAudioTrack[], selected: BackgroundAudioTrack): BackgroundAudioTrack[]` bewahrt normale Dateieinträge und ersetzt alle radio:-Einträge durch selected. Beide Panel-Auswahlwege konsumieren diese Funktion. Bestehende Panel-Props/onChange/onClose bleiben unverändert.

- [x] RED: Austausch von `[dateiA, radioAlt1, dateiB, radioAlt2]` liefert `[dateiA, radioNeu, dateiB]` (erster Radioplatz), ohne Eingabeobjekte zu verändern. Ohne vorherigen Sender wird hinten angefügt.
- [x] RED: echten Dialog mit gefälschter externer Suchantwort bedienen; Hinzufügen speichert genau einen neuen Sender, bewahrt Dateien, schließt den reinen Dialog und bietet dort keinen Fertig-Button. Doppelklick genau einmal. Eingebettete Radiosuche klappt zu, Audioeinstellungen bleiben sichtbar.
- [x] RED: echte Präsentationskonfigurationen für PRE/POST/Element verwenden; Änderung betrifft nur ausgewähltes Ziel. Kein automatischer Hörstart durch Auswahl.
- [x] Run `npx vitest run src/backgroundAudioSelection.test.ts src/BackgroundAudioPanel.test.tsx --maxWorkers=2`, erwartete fehlende Verhaltensweisen beobachten.
- [x] Minimalen Austausch und einmalige Übernahme im Panel implementieren; Vorhör-Lebensdauer prüfen und bei Bedarf unmount-sicher beenden. Engine/Routen unverändert.
- [x] GREEN: dieselben Tests plus `src/RadioStationBrowser.test.tsx`, `src/RadioStationBrowserLocalization.test.tsx`, `src/BackgroundAudioEngine.test.ts`, `src/audio/BackgroundAudioRoute.test.ts`; diff selbst prüfen, geprüften Teil committen.

## Task 2: Gültiger Warnungszähler und lokale Symbole

**Files:** modify `src/weatherWarnings/WeatherWarningBanner.tsx`, `src/outputComposition.css`; create `src/weatherWarnings/WeatherWarningBanner.test.tsx`, ggf. fokussierte Selektor-/SVG-Dateien im selben Verzeichnis.

**Interfaces:** Bestehender Hook liefert `{item, elapsed, duration, index, total}` aus gültigen Warnungen mit unverändertem gemeinsamen cycleStartedAtMs. `index` nullbasiert, Anzeige `index+1/total`. Lokaler Icon-Typ wird aus event/headline abgeleitet; unbekannt → neutrales Warndreieck.

- [x] RED: zwei gültige Warnungen am Zyklusanfang und nach erster Lesedauer zeigen `1/2` bzw. `2/2` und zugängliche Positionsbeschriftung. Nach Ablauf einer Warnung zählt ausschließlich die andere; keine abgelaufene Textausgabe.
- [x] RED: Wind/Gewitter/Schnee/Frost/Regen/Nebel/Hitze liefern passende zugängliche SVG-Beschriftungen; unbekannter Event erhält generisches Warnsymbol, Originaltexte bleiben unverändert.
- [x] RED: einzelne Warnung ohne Mehrfachzähler; null/stale/OFF-AIR-Zustand zeigt weiterhin keine Warnung. Gleiches state/now liefert für MAIN und Vorschau dieselbe Position.
- [x] Run `npx vitest run src/weatherWarnings/WeatherWarningBanner.test.tsx src/weatherWarnings/session.test.ts shared/weatherWarnings.test.ts --maxWorkers=2`, RED beobachten.
- [x] Selektor/Anzeige minimal erweitern; flexible Headeranordnung ohne gequetschten Titel, keine neuen Providerfelder und keine Renderer-Netzwerkzugriffe.
- [x] GREEN: gezielte Tests plus OutputComposition/bannerOutputState/Countdown/Watermark und native isolierte breite/schmale Ausgabe prüfen.
- [x] Vollständige Suite mit zwei Workern, danach Produktionsbuild seriell; Logs und verbleibende v89-Arbeiten dokumentieren. Keine vollständige PowerPoint-/Regional-Fertigstellung behaupten.

## Selbstkontrolle und Fortsetzung

Dieser Teilplan deckt die zwei klar abgegrenzten, bestätigten Bedienänderungen ab. Er ersetzt weder die bestehenden PowerPoint-Hybrid-/GPU-Pläne noch einen Vollständigkeitsplan der Regional-UI. Technisches Selbstreview statt unabhängiger Delegation ist schwächer und wird im Nachweis benannt. Umsetzung nativ nach Planprüfung durch den Nutzer.
