# v83 – Lokale KI-Durchsagen im Vor- und Nachprogramm

Status: Entwurf zur schriftlichen Freigabe. Noch keine Produktimplementierung.

## Ziel und bestätigte Entscheidungen

Besucher sollen freigegebene Saal-Durchsagen automatisch hören, ausschließlich im VORPROGRAMM und NACHPROGRAMM. Pro einstellbarem Intervall wird genau eine gültige Meldung gelesen; mehrere Meldungen wechseln der Reihe nach. Vor jeder Durchsage läuft der vom Benutzer bereitgestellte Dreiklang-Gong. Hintergrundmusik wird vorübergehend abgesenkt und anschließend korrekt wiederhergestellt.

Der Benutzer möchte eine natürlich klingende lokale KI-Stimme ohne Konto und API-Key. Windows-Systemstimmen und Cloud-Sprachdienste sind nicht der gewählte Ansatz. Piper wird als erster technischer Kandidat geprüft. Die Klangqualität muss mit einer echten deutschen Hörprobe beurteilt werden; eine bestimmte Qualität wird nicht vorab zugesichert.

Automatisch angelieferte kommerzielle Werbung ist ausdrücklich zurückgestellt: Es gibt keinen Anbieterzugang. v83 enthält keine Werbeintegration, Tracking-Anfragen oder Werbe-Testspots.

## Bestehende Architektur und Grenzen

- Basis: Release 0.82.0, Commit `7deede8`, vorhandener Worktree `codex/web-editor-native`.
- `electron/FirebaseGemeindeService.ts` bleibt die zentrale Firebase-Anbindung. Keine neue Datenbank, Schemaänderung oder direkten Firebase-Zugriffe aus Ausgabefenstern.
- `src/community/AnnouncementService.ts` normalisiert bereits Meldungen. `communityRuntime.ts` liefert zentrale Aktualisierungen; Sprachentscheidungen werden dort fachlich angebunden, nicht in einzelnen Folien dupliziert.
- `src/BackgroundAudioEngine.ts` besitzt die laufende Hintergrundwiedergabe. Seine bisherige boolesche Video-Absenkung darf nicht von einer Durchsage aufgehoben werden.
- `src/audioRouting.ts` bietet geroutete HTML-Audiowiedergabe. Gong und erzeugte Sprachdateien müssen kontrolliert über den konfigurierten Saalausgang laufen, nicht über einen versteckten Standardausgang.
- `electron/DeviceSettingsRepository.ts` dient als Muster für gerätebezogene Einstellungen. Neue Ansageneinstellungen überschreiben keine vorhandenen OSB-, Banner- oder Displayeinstellungen.

Dies ist eine architektonische Erweiterung: neuer zentraler Scheduler, lokale Sprachvorbereitung und koordinierte Audiowiedergabe. Keine umfassende Umstrukturierung bestehender Live-/Meldungsfunktionen.

## Einstellungen und Bedienung

Pfad: Einstellungen → Präsentation → Ansagen.

Vorgeschlagene, mit dieser Spezifikation zu genehmigende Vorgaben:

- Automatische Ansagen: aus, bis bewusst aktiviert.
- Intervall: 5 Minuten; numerisch einstellbar von 1 bis 120 Minuten.
- Hintergrundmusik während der Ansage: 20 % des ansonsten gültigen Pegels, einstellbar 0–100 %. Das ist der verbleibende relative Pegel, nicht „um 20 % reduzieren“.
- Sprachpaket: eine geprüfte deutsche Piper-Stimme; keine automatische Windows-/Cloud-Ersatzstimme.
- Ergänzung auf ausdrücklichen Benutzerwunsch: Die Stimme wird erst später vom jeweiligen Operator in den Einstellungen ausgewählt und probegehört, nicht jetzt durch den Auftraggeber und nicht fest beim Build. Modell und Sprecher-ID werden als gerätebezogene Wahl gespeichert. Ohne explizite Wahl und Bestätigung bleiben automatische Ansagen deaktiviert. Die drei MLS-Hörproben wurden vom Benutzer wegen Klang/Aussprache abgelehnt und sind keine abgenommene Standardauswahl.
- Informationssatz: „Durchsagen laufen nur im Vor- und Nachprogramm. Musik und Hintergrundaudio werden während Gong und Durchsage auf den eingestellten Pegel abgesenkt und danach wiederhergestellt.“
- Liste der tatsächlich lesbaren Texte mit Meldungstitel, Bereitschaft und verständlichem Grund bei ausgeschlossenen/fehlerhaften Einträgen. Keine Bearbeitung oder Rückschreibung des Firebase-Textes auf dieser Seite.
- „Probe anhören“ mit separatem Stoppknopf; Wiedergabe über die vorhandene Preview-Route. Keine unbestellte Saalwiedergabe durch Öffnen der Einstellungen.
- Paketstatus, Stimme, Downloadgröße und Lizenzhinweise vor einer ausdrücklichen Aktion „Sprachpaket installieren“. Kein Download beim Programmstart oder im laufenden Live-Betrieb.

Schließen der Einstellungen beendet weder Scheduler noch bereits vorbereitete Durchsagen. Einstellungen gelten am Gemeinde-PC, nicht pro Folie oder Benutzer.

## Auswahl aus bestehenden Meldungsfeldern

Rohdaten bleiben unter `meldungen/{messageId}` unverändert. Die stabile Child-ID bleibt erhalten. Öffentlicher Status, Papierkorb und Gültigkeitsfenster werden über die bestehende zentrale Meldungslogik geprüft. Eine Durchsage ist ein eigener Kanal: `messageScreen` oder die aktuelle Meldungsfolie sind keine zusätzliche zwingende Voraussetzung.

Zusätzlich müssen `showDurchsage` sowie die Saalzuordnung über `durchsageSaalscreen` oder `durchsageTargets.saalscreen` aktiv sein. Bestehende kompatible boolesche Werte werden mit derselben Normalisierung wie andere Kanäle behandelt.

Die Textauswahl berücksichtigt `durchsageTextModeSaalscreen`, `textDurchsageSaalscreen` und `textDurchsageManual`. Vor Implementierung der Auswahl werden die real verwendeten Moduswerte anhand der vorhandenen Schreibseite, Dokumentation oder repräsentativen anonymisierten Beispieldaten verifiziert und als Fixture festgehalten. Keine erfundenen Enumwerte: Ein unbekannter expliziter Modus wird in der Operator-UI als nicht unterstützt ausgewiesen und nicht gesprochen. Bei fehlendem Modus gilt der fertige Saaltext, ersatzweise der manuelle Durchsagetext. Ein explizit manueller Modus darf nicht unbemerkt auf einen anderen Text zurückfallen.

Es werden ausschließlich die expliziten Durchsagetexte gelesen, nicht interne Kommentare, IDs oder eine ungeprüfte allgemeine Beschreibung. Rich Text wird in lesbaren Klartext mit sinnvollen Absatzpausen umgewandelt; Skripte, Markup und URLs als ausführbarer Inhalt werden ausgeschlossen. Leere Texte werden übersprungen.

Normalisiertes Sprachobjekt: stabile Meldungs-ID, öffentlicher Titel, ausgewählter Klartext und Inhaltsrevision. Es wird kein komplettes Firebase-Objekt an die Sprachengine oder MAIN weitergegeben.

## Scheduler und Bereichswechsel

Ein zentraler Besitzer steuert alle Ansagen. Ausgabefenster dürfen keine eigenen Timer, Gongwiedergaben oder Sprachjobs starten.

- Automatische Wiedergabe ist nur bei aktiver echter Live-Engine im Abschnitt `pre` oder `post` erlaubt. Testbetrieb mit aktiver Engine verhält sich dabei identisch zum Normalbetrieb; reine Editor-Auswahl startet nichts.
- Beim Eintritt in einen erlaubten Abschnitt beginnt ein vollständiges Intervall. Kein Gong direkt beim Start.
- Nach Ende eines Durchsagedurchlaufs beginnt das nächste vollständige Intervall. Es gibt keine überlappenden Durchsagen und keine Aufholserie verpasster Timer.
- Pro Termin eine Meldung; stabile Reihenfolge nach bestehender Priorität, danach stabiler ID. Der Cursor folgt IDs, nicht Arraypositionen. Nach der letzten Meldung beginnt die Runde erneut.
- Wenn keine gültige vorbereitete Meldung vorliegt: still überspringen, kein Gong und keine Fehlerdurchsage. Beim nächsten Termin erneut prüfen.
- Vor Gongstart Eligibility und Inhaltsrevision erneut prüfen. Firebase-Änderungen ersetzen keine gerade gesprochene Phrase. Gelöschte oder zurückgezogene Meldungen dürfen nicht neu starten; laufende Wiedergabe wird kontrolliert beendet.
- Wechsel nach `warmup`, `service`, OFF AIR, Ausschalten der Ansagen, Logout oder App-Ende: Timer und Jobs invalidieren, Gong/Sprache stoppen, ausschließlich den eigenen Absenkungsanspruch freigeben. Ein verspätet abgeschlossener Sprachjob darf danach nichts abspielen.
- Eintritt ins Nachprogramm startet ein neues Intervall; keine aus dem Gottesdienst mitgeschleppten Timer.

## Sprachvorbereitung, Paket und Lizenzprüfung

Piper läuft lokal in einem begrenzten Hintergrundprozess, nicht auf dem Renderer-/Live-Thread. Texte werden vor ihrem Einsatz zu WAV vorbereitet und nach Textrevision, Stimme und Engineversion gecacht. Gleichzeitige Generierung ist auf einen Job begrenzt; angemessene Text-/Laufzeit-/Dateigrößenlimits und Abbruch verhindern Ressourcenüberlastung. Bei Last hat die Live-Ausgabe Vorrang.

Ausgewählte Engineversion, genaue Stimme, Downloadquelle, Hash, Paketgröße und Lizenztexte müssen im Implementierungsplan als erster prüfbarer Meilenstein festgelegt werden. Piper ist GPL-3.0; Stimmen haben eigene Model Cards. Eine separate Prozessgrenze ist keine automatische Lizenzfreigabe. Keine Änderung der Projektlizenz und keine Veröffentlichung inkompatibler Binär-/Modellpakete ohne vorherige Klärung. Wenn die Prüfung keine zulässige Auslieferung ergibt, wird dieser Teil gestoppt und dem Benutzer eine konkrete Alternative zur Entscheidung vorgelegt.

Nach einmaliger expliziter Einrichtung läuft Sprachgenerierung ohne Internet, Konto oder Key. Meldungstexte werden niemals an externe TTS-Dienste übertragen. Heruntergeladene Pakete werden auf feste Quellen/Hashes geprüft, atomar installiert und ohne Shell-Interpolation gestartet. IPC ist auf vertrauenswürdige Sender und validierte Nutzdaten begrenzt. Kein frei über IPC übermittelbarer Prozesspfad oder Shellbefehl.

## Gong und Audioablauf

Quelle: `C:/Users/Mörchen/OneDrive/Austausch Corbin Sigurd Heike/Alarmdurchsagen/03-3KLANG-GONG.wav` (bereitgestellt, 1.376.216 Bytes). Das Original wird nicht verändert. Die Anwendung benötigt eine verwaltete Kopie, damit die installierte Ausgabe nicht vom OneDrive-Pfad abhängt.

Eine Durchsage ist eine abbrechbare Sequenz:

1. Vorbereitetes gültiges Sprachaudio und verfügbaren Ausgang bestätigen.
2. Eigenen Musik-Absenkungsanspruch mit weichem Übergang aktivieren.
3. Gong vollständig spielen; auf echtes `ended` warten, kein geschätzter Timeout als Erfolgsnachweis.
4. Sprachaudio starten und bis `ended` überwachen.
5. In jedem Erfolgs-, Fehler- und Abbruchpfad den eigenen Absenkungsanspruch freigeben.

Für v83 folgen Gong und Sprache dem gewählten Background-Audio-Gerät, haben aber einen eigenen Wiedergabepegel. Hintergrund-Mute wird niemals aufgehoben, um eine Ansage zu ermöglichen. Ein ungültiger oder entfernter konfigurierter Ausgang führt zu einem Operatorhinweis statt unbemerktem Routing auf ein anderes Gerät.

Musikabsenkung wird als mehrquellenfähiger Anspruch integriert: Videoducking und Durchsage dürfen sich nicht gegenseitig aufheben. Der wirksame Faktor ist der niedrigste aktuell angeforderte Faktor. Die Ansageneinstellung gilt unabhängig davon, ob das optionale Videoducking der Playlist aktiv ist. Aktuelle Benutzerlautstärke, Mute, Trackposition und vorhandene Absenkungen bleiben erhalten; keine Rückschreibung alter Lautstärkesnapshots nach einer zwischenzeitlichen Bedienung. Radio und laufende Playlists werden weder neu gestartet noch getrennt.

Gong- oder Sprachfehler stoppen die Sequenz und stellen die sonst gültige Musiklautstärke wieder her. Kein Gong, wenn noch gar kein Sprachaudio bereitsteht. Eine als Notfalldurchsage zertifizierte Funktion ist ausdrücklich nicht Gegenstand dieser Erweiterung.

## Fehler, Sichtbarkeit und Grenzen

Status nur für Operator: deaktiviert, wartet, wird vorbereitet, bereit, Gong, spricht, Fehler. Angezeigt werden nächste geplante Ansage und verbleibende Zeit. MAIN erhält keine technischen Diagnosen und bleibt visuell unverändert. Test-Wasserzeichen, Banner und Live-Navigation funktionieren unabhängig weiter.

Offline wird nur der vorhandene fachlich gültige Snapshot verwendet; abgelaufene Meldungen werden auch offline nicht gesprochen. Fehlendes Sprachpaket oder Synthesefehler lassen Live-Ausgabe und Radio weiterlaufen. Es gibt keinen heimlichen Wechsel zu Windows- oder Cloudstimmen.

## Nachweise vor Auslieferung

- Unit-Tests: Kanalzuordnung, alle verifizierten Textmodi, leere/manuelle Texte, Rich Text, Zeitraum, Papierkorb, öffentliche Freigabe und stabile IDs.
- Fake-Clock-Tests: Intervall, erste verzögerte Ansage, Rundlauf, keine Überlappung, keine Aufholserie, pre/post erlaubt und warmup/service/OFF AIR gesperrt.
- Race-/Abbruchtests: Bereichswechsel während Synthese, Gong und Sprache; Änderungen/Löschung; doppelte Fenster; Settings schließen; verspätete Prozessantwort.
- Audiotests: Gong vor Sprache, Ende-/Fehlerpfade, Video plus Durchsage, Benutzeränderung von Pegel/Mute währenddessen, Radio bleibt verbunden, Gerät entfernt.
- Native Integration: echte lokale deutsche WAV-Erzeugung offline, validierbares Paket, Start/Abbruch ohne Renderer-Blockade und Wiedergabe über ausgewähltes Gerät.
- Regression: bestehende Unit-/Releaseprüfungen, Typecheck und Desktopbuild; unveränderte Firebase-Struktur und keine zusätzliche Firebase-Initialisierung.
- Hörprobe mit Gong und deutscher Stimme; physische Saalanlage nur als geprüft ausweisen, wenn tatsächlich abgehört. Kein Erfolg allein aufgrund eines erfüllten `audio.play()`-Promises.
- Paket-/Lizenznachweise, aktualisierte Hilfe und sachliche Versionshinweise vor einem möglichen Release.

## Quellen der Kandidatenprüfung

- Piper Engine: https://github.com/OHF-Voice/piper1-gpl
- Deutsche Stimmen und individuelle Lizenzen: https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md
- Alternativ geprüft, nicht ausgewählt: https://github.com/resemble-ai/chatterbox

## Nächster Freigabepunkt

Der Benutzer prüft diese schriftliche Spezifikation. Erst danach wird der Implementierungsplan erstellt und zur Auswahl der Ausführung vorgelegt. Dieser Entwurf ist keine Behauptung einer fertigen v83 und keine Veröffentlichung.
