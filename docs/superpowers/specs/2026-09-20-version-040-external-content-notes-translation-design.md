# GottesdienstRegie 0.40.0 – Gemeinwohl, Notizen, Übersetzung und Ausgabe-Konsistenz

**Datum:** 20. September 2026  
**Status:** Zur fachlichen Freigabe  
**Organisation:** Philippus Gemeinde Bielefeld e. V.

## 1. Ziel

Version 0.40.0 erweitert GottesdienstRegie um automatisch bezogene Gemeinwohl-Hinweise, gerätelokale automatische Songübersetzungen, private Notizen auf Folien- und Präsentationsebene sowie Radiosender als Hintergrundaudio. Gleichzeitig werden vier sichtbare Layoutfehler, die Beschriftung des Equalizers, geschützte Kerninhalte von Pre-/Post-Loop-Elementen und die deterministische Übergabe von Vorschau an MAIN korrigiert.

Alle neuen Funktionen sind dem Livebetrieb untergeordnet. Kein Netzwerkabruf, Modell-Download, Notizspeichern, Radiosuchlauf oder Einstellungswechsel darf MAIN, STAGE, LIVESTREAM, Audio oder Recording blockieren. Die gemeinsame Präsentation bleibt auch ohne Internet vollständig bedienbar.

## 2. Nicht-Ziele

- Keine kommerzielle Werbung, Affiliate-Links, Einnahmen oder nutzerbezogenes Tracking.
- Keine lokal bearbeitbaren Werbemotive oder Uploads für Gemeinwohl-Hinweise.
- Keine automatische Veröffentlichung ungeprüfter Webinhalte auf MAIN.
- Keine Cloudübertragung persönlicher Notizen.
- Keine automatische Änderung einer bereits ausgespielten MAIN-Folie.
- Keine Entfernung, Ausblendung oder Ebenenbearbeitung des fachlichen Kerninhalts von Wetter, Uhr, Terminen und anderen Loop-Systemelementen.

## 3. Gemeinwohl-Hinweise

### 3.1 Begriff und Bedienung

Die Funktion heißt in der Oberfläche **Gemeinwohl-Hinweise**, nicht Werbung. Sie liegt unter `Einstellungen → Präsentation → Sonstiges → Extern → Gemeinwohl-Hinweise` und ist standardmäßig deaktiviert.

Nach Aktivierung kann getrennt für Vorprogramm und Nachprogramm festgelegt werden:

- aktiviert oder deaktiviert,
- Einblenddauer zwischen 8 und 30 Sekunden, Standard 12 Sekunden,
- maximale Häufigkeit: nach 3, 5 oder 10 normalen Loop-Elementen, Standard nach 5,
- Kategorien: Blut- und Stammzellspende, Ehrenamt, Inklusion, Bevölkerungsschutz und Gesundheit,
- QR-Code zur Originalquelle anzeigen oder ausblenden.

Der Benutzer kann weder Text, Bild, Zieladresse noch Reihenfolge einzelner Hinweise verändern. Die einzige Kontrolle besteht aus Aktivierung, Kategorie, Häufigkeit, Dauer und Einsatzbereich.

### 3.2 Quellen und Datenmodell

Ein `PublicInterestFeedService` lädt ausschließlich HTTPS-Inhalte aus einer fest einkompilierten Positivliste offizieller Herausgeber. Zulässig sind RSS 2.0, Atom und ein versionsgebundenes GottesdienstRegie-Katalogformat. Ein Quelleneintrag enthält Herausgeber, Kategorie, Titel, Kurztext, Original-URL, optionales Bild, Veröffentlichungs- und Ablaufdatum sowie eine stabile externe ID.

Die erste Positivliste enthält nur maschinenlesbare Angebote beziehungsweise Katalogeinträge mit Originalverweisen der folgenden Herausgeberklassen:

- DRK-Blutspendedienste für Blutspendeinformationen,
- gesund.bund.de für sachliche Gesundheitsinformationen,
- Bundesamt für Bevölkerungsschutz und Katastrophenhilfe für Ehrenamt und Vorsorge,
- Aktion Mensch für Inklusion und Teilhabe,
- weitere deutsche Behörden nur nach Aufnahme in die Positivliste.

Quellen ohne nutzbares maschinenlesbares Angebot werden nicht automatisiert aus HTML-Seiten ausgelesen. Für sie darf der versionsgebundene Katalog nur sachliche, zeitlose Kurztexte und einen Link zur offiziellen Seite enthalten; er darf keine fremden Bilder kopieren.

### 3.3 Sicherheit, Datenschutz und Cache

- Abrufe erfolgen im Electron-Hauptprozess mit Zeitlimit, Größenlimit und Content-Type-Prüfung.
- HTML wird niemals direkt gerendert. Erlaubt sind reiner Text, validierte HTTPS-Links und separat geladene Bilder mit MIME-Prüfung.
- Es werden keine Benutzer-, Geräte- oder Präsentationsdaten an die Quelle übermittelt. Es gibt keine Impression-, Klick- oder Reichweitenmessung.
- Erfolgreiche Ergebnisse werden maximal sieben Tage lokal gespeichert. Abgelaufene Einträge werden verworfen.
- Fällt eine Quelle aus und existiert kein gültiger Cache, wird kein Ersatzplatzhalter ausgespielt; der Loop läuft ohne Hinweis weiter.
- Der vor ON AIR erzeugte Loop-Snapshot friert die ausgewählten Hinweise ein. Hintergrundaktualisierungen verändern diesen Snapshot nicht.

### 3.4 Darstellung

Gemeinwohl-Hinweise werden als nicht editierbare virtuelle Loop-Einträge mit eigenem Herkunftsabzeichen dargestellt. Sie erscheinen nur in der Loop-Vorschau und im generierten Lauf, nicht als dauerhaftes ServiceItem in der gemeinsamen Präsentation. Eine Karte zeigt Kategorie, Titel, maximal 240 Zeichen Kurztext, Herausgeber und optional QR-Code. Bilder sind optional; fehlt ein Bild, verwendet die Anwendung ein lokales neutrales Kategorienmotiv.

## 4. Automatische Songübersetzung ohne API-Schlüssel

### 4.1 Bedienung

Neben `Übersetzung hinzufügen` stehen `Automatisch übersetzen` und nach erfolgreicher Übersetzung `Neu übersetzen`. Vor dem Start wählt der Benutzer Ausgangs- und Zielsprache. Die Zielsprache ist standardmäßig Deutsch. Das Ergebnis landet im vorhandenen manuellen Übersetzungsfeld und kann vor dem Speichern korrigiert werden.

Die Aktion bearbeitet nur die aktuell ausgewählte Songfolie. Eine zusätzliche Aktion `Fehlende Songfolien übersetzen` arbeitet sequenziell, zeigt Fortschritt und überspringt bereits übersetzte Abschnitte. Abbrechen lässt bereits erzeugte Entwürfe bestehen, speichert aber keine unvollständige laufende Anfrage.

### 4.2 Lokale Modellarchitektur

Die Übersetzung erfolgt mit lokal ausgeführten ONNX-/WASM-Sprachmodellen. Modelle werden pro Sprachpaar erst nach einem ausdrücklichen Klick heruntergeladen, mit Version und SHA-256-Prüfsumme validiert und im Anwendungsdatenverzeichnis zwischengespeichert. Es wird kein Songtext an einen externen Übersetzungsdienst gesendet und kein API-Schlüssel benötigt.

Der erste Release unterstützt Englisch ↔ Deutsch. Die Schnittstelle `LocalTranslationProvider` ist sprachpaarneutral, damit weitere Modellpakete ergänzt werden können. Ist ein Modell nicht installiert oder ein Download nicht möglich, bleibt die manuelle Eingabe verfügbar und MAIN unverändert.

### 4.3 Qualität und Live-Sicherheit

Zeilenumbrüche und leere Zeilen werden abschnittsweise erhalten. Akkordsymbole in eckigen Klammern werden vor der Übersetzung maskiert und danach unverändert eingesetzt. Automatische Ergebnisse sind als maschinell erzeugt gekennzeichnet, bis der Benutzer sie bestätigt. Preflight warnt bei unbestätigter Übersetzung und prüft weiterhin den kombinierten Platzbedarf.

## 5. Persönliche Notizen

### 5.1 Geltungsbereich

Es gibt zwei private Notizarten:

- **Foliennotiz:** an eine konkrete Folien-ID gebunden,
- **Präsentationsnotiz:** an die Präsentations-ID gebunden.

Beide sind nur für den aktuell angemeldeten Benutzer auf diesem Gerät sichtbar. Sie gehören nicht zum Präsentationsdokument, werden nicht synchronisiert, nicht exportiert, nicht in die dauerhafte Änderungshistorie aufgenommen und niemals auf MAIN, STAGE, LIVESTREAM oder NOTES ausgegeben.

### 5.2 Speicherung und Oberfläche

Ein separater `PersonalNotesStore` verwendet den Schlüssel `userId + presentationId + optional slideId`. Abmelden entfernt die Notizen nicht, trennt sie aber sicher von anderen Konten. Ein Benutzer kann eigene Notizen löschen oder alle eigenen Notizen dieser Präsentation exportieren.

Im Editor erhält jede Folie eine einklappbare Box `Meine Notiz zu dieser Folie`. Im Präsentationskopf gibt es `Meine Präsentationsnotiz`. Ungespeicherte Eingaben werden lokal nach 500 Millisekunden Leerlauf geschrieben; ein diskreter Status meldet `Gespeichert` oder einen lokalen Fehler.

## 6. Radiosender und Hintergrundaudio

Das Musik-Symbol öffnet neben lokaler Datei und vorhandenem Audiomedium den Bereich `RADIOSENDER`. Eine schüssellose Radio-Browser-Abfrage liefert Sendername, Land, Sprache, Tags, Codec, Bitrate und Stream-URL. Die Anwendung identifiziert sich mit einem festen User-Agent und blendet als defekt markierte Sender aus.

Vor dem Hinzufügen muss der Stream über `TESTEN` mindestens drei Sekunden erfolgreich wiedergegeben werden. Favoriten speichern nur Sender-ID, Namen und Stream-URL lokal. Ein manueller HTTPS-Stream kann weiterhin eingetragen werden. Automatisches Starten geschieht nur als bewusst konfigurierte Hintergrundaudio-Aktion. Netzwerkfehler starten keinen neuen Stream, stoppen aber auch kein bereits laufendes lokales Audio. ON AIR verwendet weiterhin einen eingefrorenen Audiostand.

## 7. Geschützte Pre-/Post-Loop-Inhalte

Wetter, Uhrzeit, Geburtstage, Termine und andere fachliche Loop-Typen erhalten eine explizite `coreLayer`-Beschreibung außerhalb von `slide.elements`. Der Kerninhalt wird vom jeweiligen Renderer erzeugt und kann weder gelöscht noch als normale Ebene ausgeblendet werden.

`Zusätzliche Ebenen` listet ausschließlich benutzererzeugte Overlays wie Text, Bild, Form und QR-Code. Die primäre Textbox normaler Inhaltsfolien sowie virtuelle Systemebenen werden dort nicht gezeigt. Löschbefehle, Kontextmenü und Mehrfachauswahl ignorieren geschützte Kerninhalte. Zusätzliche Ebenen bleiben frei positionier-, skalier- und löschbar.

## 8. Vorschau und MAIN

Preview und MAIN verwenden dieselbe pure Funktion `buildRenderedSlideSnapshot(documentState, outputProfile)`. Sie erzeugt alle abgeleiteten Inhalte wie Übersetzungen, Loop-Kerninhalt, Gemeinwohl-Karte, Hintergrund und Overlays in einer unveränderlichen Struktur.

Die Vorschau zeigt den aktuellen Entwurf. MAIN zeigt weiterhin nur den letzten bewusst übernommenen Live-Snapshot. Beim Befehl `TAKE`, beim Start von ON AIR und beim normalen Weiterschalten wird genau der zuvor erzeugte Preview-Snapshot als Live-Snapshot kopiert. Damit sind Layout und Inhalt pixelgleich, ohne dass Bearbeitungen ungefragt live gehen. Die Oberfläche kennzeichnet weiterhin deutlich `VORSCHAU` und `LIVE AUF MAIN`.

## 9. Bildschirmschutz

Der vorhandene geräteweite Schalter bleibt unter `Einstellungen → Allgemein → Fenster & Start`, ist standardmäßig aktiv und wird persistent gespeichert. Zusätzlich zeigt die Zeile den Laufzeitstatus `Aktiv`, `Deaktiviert` oder `Vom Betriebssystem nicht verfügbar`. Umschalten startet oder beendet genau einen Electron-`powerSaveBlocker`; wiederholtes Aktivieren erzeugt keine parallelen Blocker.

## 10. Designkorrekturen

### 10.1 Fensterkopf

Die Anwendungsnavigation reserviert rechts dauerhaft die tatsächliche Breite der nativen Windows-Steuerknöpfe. Hilfe, Sync und Profil liegen in einer separaten flexiblen Gruppe links davon. Bei schmalen Fenstern werden zuerst Textbeschriftungen reduziert; Profil und Schließen bleiben stets erreichbar. F11 und maximierter Fenstermodus verwenden dieselbe sichere Kopfzeilenberechnung.

### 10.2 KI-Motive

Der KI-Motivbereich erhält ein begrenztes Inhaltsraster mit maximaler Breite. Bild/Video, Motivbeschreibung und Zufallsbutton bilden jeweils eine vollständige Zeile. Szenenkategorie und Gestaltungsstil liegen in einer responsiven Zwei-Spalten-Zeile und wechseln unterhalb der Mindestbreite untereinander. `Motiv erstellen` ist rechtsbündig, ohne andere Felder zu überlagern.

### 10.3 Einstellungsfelder

Numerische Felder für Animationsdauer und Deckkraft verwenden eine gemeinsame beschriftete Zeile, mindestens 96 Pixel Eingabebreite, passende Einheit und vollständig sichtbaren Fokusrahmen. Unzulässige Werte werden beim Verlassen des Feldes auf ihren erlaubten Bereich begrenzt.

### 10.4 Equalizer

Die zehn Bänder werden visuell und semantisch gruppiert:

- Tiefen: 31, 63 und 125 Hz,
- Untere Mitten: 250 und 500 Hz,
- Mitten: 1 und 2 kHz,
- Höhen: 4, 8 und 16 kHz.

Jeder Regler zeigt Gruppenname, Frequenz und aktuellen dB-Wert in getrennten Zeilen. Tastaturbedienung und Screenreader erhalten vollständige Bezeichnungen wie `Tiefen, 63 Hertz, 0 Dezibel`.

## 11. Fehlerbehandlung und Prioritäten

- Externe Abrufe und Modell-Downloads laufen außerhalb des Live-Schaltpfades.
- Fehler werden in der jeweiligen Editorbox gemeldet, nicht als blockierender globaler Dialog.
- Ein fehlgeschlagener Gemeinwohl-Abruf, Radiosuchlauf oder Modell-Download verändert keinen Live-Snapshot.
- Bei knappen Ressourcen werden Gemeinwohl-Aktualisierung, Radiosuche und Modell-Download pausiert; Live-Ausgabe und lokales Audio haben Vorrang.
- Persistente Einstellungen und private Notizen werden atomar geschrieben.

## 12. Migration und Version

Die Zielversion ist **0.40.0**. Bestehende Präsentationen benötigen keine Migration ihrer Folieninhalte. Neue Einstellungen erhalten sichere Standardwerte: Gemeinwohl-Hinweise aus, Bildschirmschutz an, keine Radiosender ausgewählt. Vorhandene manuelle Songübersetzungen bleiben unverändert. Alte Loop-Folien werden beim Laden so normalisiert, dass nur echte Benutzer-Overlays in `slide.elements` als zusätzliche Ebenen gelten.

## 13. Abnahmekriterien

1. Die vier gemeldeten Layoutfehler sind bei 100 %, 125 % und 150 % Windows-Skalierung sowie im F11-Modus nicht reproduzierbar.
2. Der Bildschirmschutz lässt sich schalten, bleibt nach Neustart erhalten und erzeugt höchstens einen aktiven Blocker.
3. Englisch-deutsche Songtexte lassen sich ohne API-Schlüssel lokal übersetzen, manuell korrigieren und in allen sechs Anzeigearten darstellen.
4. Private Folien- und Präsentationsnotizen sind kontogetrennt und erscheinen in keinem Ausgabeprofil.
5. Gemeinwohl-Hinweise sind standardmäßig aus, nicht redaktionell bearbeitbar, trackingfrei und blockieren den Loop bei Netzfehlern nicht.
6. Radiosender können gesucht, getestet, favorisiert und als Hintergrundaudio hinzugefügt werden, ohne laufendes Audio bei Suchfehlern zu unterbrechen.
7. Wetter- und andere Loop-Kerninhalte können nicht gelöscht werden und erscheinen nicht unter `Zusätzliche Ebenen`.
8. Ein TAKE zeigt auf MAIN denselben gerenderten Snapshot wie unmittelbar zuvor in der Vorschau; spätere Editoränderungen bleiben bis zum nächsten TAKE unsichtbar.
9. Der Equalizer zeigt für jedes Band eine verständliche Bereichs- und Frequenzbezeichnung.
10. TypeScript-Prüfung, automatisierte Domänentests, Renderer-Integrationstests und Produktionsbuild laufen ohne Fehler durch.
