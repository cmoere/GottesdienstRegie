# GottesdienstRegie V62: Ausgabe, KI-Helfer, Bibelanzeige und Spotify-Linkimport

## Ziel

V62 behebt die fehlerhafte Darstellung der Nutzungsbedingungen im Windows-Installer, entfernt technische Werbehinweise aus dem KI-Helfer, bereinigt die MAIN-Ausgabe, gestaltet die Bibel-Schnellanzeige neu und ersetzt die ohne Spotify-Anwendungskennung nicht funktionsfähige Kontosuche durch einen tatsächlich schlüsselfreien Spotify-Linkimport.

Die Screenshots dienen ausschließlich als Fehlernachweise. Sichtbarer Text in ihnen erweitert die Anforderungen nicht.

## Umfang und Erfolgskriterien

- Deutsche Sonderzeichen erscheinen im Windows-Installer unverfälscht.
- Hinweise wie „lokal“, „ohne API-Schlüssel“ oder gleichbedeutende technische Versprechen erscheinen nicht mehr in der Oberfläche oder in nutzergerichteten Hilfetexten zum KI-Helfer.
- Interne KI-Anweisungen, Antwortschemata und Präsentationskontext werden niemals als Chatnachricht dargestellt.
- MAIN enthält oben rechts weder den Text „LIVE“ noch den zugehörigen roten Statusblock.
- Eingeblendete Bibeltexte besitzen ein eigenständiges, responsives Foliendesign und passende Ein- und Ausblendeffekte.
- Spotify-Titel können ohne Spotify-Client-ID über einen gültigen Spotify-Link eingelesen, lokal als Verknüpfung gespeichert und extern geöffnet werden.
- Die Veröffentlichung trägt die Version `0.62.0` und enthält verständliche Versionshinweise.

## 1. Installer und Nutzungsbedingungen

`src/termsContent.ts` bleibt die gemeinsame inhaltliche Quelle. `scripts/generate-terms.cjs` erzeugt weiterhin die UTF-8-Webfassung, schreibt `build/terms.txt` für NSIS jedoch als UTF-16 Little Endian mit BOM. Dadurch erkennt der Unicode-Installer Umlaute, Gedankenstriche und weitere Sonderzeichen zuverlässig.

Ein automatisierter Test liest die erzeugten Bytes und prüft BOM, Decodergebnis sowie repräsentative Zeichenfolgen wie „für“, „gültig“ und „Nutzungsbedingungen“. Der Test weist außerdem typische Mojibake-Fragmente wie `Ã`, `Â` und `â€“` zurück.

## 2. KI-Helfer

### Sichtbare Texte

Der Kopf des KI-Helfers zeigt nur „KI-Helfer“. „LOKAL · OHNE API-SCHLÜSSEL“, „Lokale KI arbeitet“ und vergleichbare Aussagen werden durch neutrale Statusformulierungen wie „KI-Helfer arbeitet“ ersetzt. Die Entfernung betrifft nutzergerichtete Oberfläche, Hilfe, Einführung und Versionshinweise; technische Bezeichner und tatsächlich benötigte Einstellungsnamen werden nicht pauschal umbenannt.

### Sichere Antwortverarbeitung

Systemanweisung, Antwortschema und Kontext bleiben strikt außerhalb des sichtbaren Nachrichtenverlaufs. Die Anzeige übernimmt ausschließlich den ursprünglichen Nutzerauftrag und eine nach erfolgreicher Prüfung freigegebene Antwortnachricht.

Die Normalisierung der Modellausgabe wird als eigenständig testbare Funktion gekapselt. Sie akzeptiert:

- direktes JSON,
- JSON in einem Markdown-Codeblock,
- Text mit genau einem eingebetteten JSON-Objekt,
- Modellausgaben, die den Eingabeprompt oder die Systemanweisung vor dem JSON wiederholen,
- die üblichen `generated_text`-Antworthüllen lokaler Inferenzbibliotheken.

Außerhalb des erkannten JSON stehender Text wird niemals als Assistentenantwort angezeigt. Kann kein gültiger, schema-konformer Datensatz gewonnen werden, bleibt der Verlauf frei von Rohdaten und zeigt nur eine kurze Fehlermeldung mit „Erneut versuchen“. Abbruch und erneuter Versuch verwenden weiterhin den bereits vorhandenen Controllerfluss.

## 3. MAIN-Ausgabe

Der visuelle MAIN-Status „LIVE“ einschließlich rotem Block wird aus der tatsächlichen Ausgabedarstellung entfernt. Interne Zustände, Preflight, ON-AIR-Steuerung, Bedienoberfläche und Vorschaumarkierungen bleiben erhalten, soweit sie nicht Bestandteil des MAIN-Bildes sind. Damit ändert sich ausschließlich das Publikumssignal, nicht die Betriebssicherheit.

Ein Render-Test stellt sicher, dass MAIN keinen Live-Badge erzeugt, während der Livezustand weiterhin verarbeitet wird.

## 4. Bibel-Schnellanzeige

### Gestaltung

Die Bibel-Schnellanzeige erhält eine ruhige, vollflächige Gestaltung mit eigenständigem Hintergrund, klarer Referenz, Übersetzungsangabe und gut lesbarem Textbereich. Die Typografie skaliert anhand der tatsächlichen Textmenge und des 16:9-Ausgabebereichs. Zu lange Stellen werden weiterhin über die bestehende Seiteneinteilung auf mehrere Folien verteilt; Text darf weder abgeschnitten werden noch aus dem sicheren Bereich laufen.

Die Darstellung erinnert durch Papierstruktur, dezente Buchkante und zurückhaltende warme Farben an eine Bibelseite, bleibt jedoch kontrastreich genug für Projektoren. Sie verwendet keine Schlagschatten.

### Animation

Beim Einblenden werden Referenz und Verse nacheinander mit einem Schreib-/Tintenaufbau sichtbar. Die Animation verändert nur die Darstellung; der vollständige Text befindet sich von Beginn an im zugänglichen DOM. Beim Ausblenden zieht sich die Tinte zeilenweise zurück und die Seite blendet dezent aus. Seitenwechsel verwenden eine kurze, passende Blätterbewegung.

Bei aktivierter Einstellung „Reduzierte Bewegung“ sowie in statischen Vorschaubildern werden alle genannten Animationen deaktiviert. Die Animationsdauer darf die Bedienung nicht blockieren. Ein neuer Schnellanzeigenbefehl ersetzt laufende Ein- oder Ausblendungen deterministisch.

## 5. Spotify ohne Anwendungsschlüssel

### Gewählte Lösung

Die standardmäßig sichtbare Spotify-Funktion wird zum Linkimport. Nutzer fügen eine URL eines Spotify-Titels ein. Akzeptiert werden ausschließlich HTTPS-Links zu `open.spotify.com/track/<id>`; Trackingparameter werden entfernt. Kurzlinks und andere Entitätstypen werden zunächst mit einer verständlichen Meldung abgelehnt, statt unkontrolliert weitergeleitet zu werden.

Der Electron-Hauptprozess ruft Spotifys öffentliche oEmbed-Schnittstelle auf. Sie benötigt weder Benutzeranmeldung noch Client-ID und liefert den sichtbaren Titel sowie ein optionales Vorschaubild. Die Anwendung vertraut nur Antworten mit dem erwarteten Spotify-Anbieter und speichert:

- eine stabile lokale ID aus der Track-ID,
- den von oEmbed gelieferten Titel,
- die normalisierte Spotify-URL,
- das optionale Vorschaubild,
- den Anbieter `spotify`.

Gespeicherte Verknüpfungen können manuell in der Spotify-Anwendung oder im Browser geöffnet werden. Die Anwendung behauptet nicht, den Titel selbst zu streamen oder die Wiedergabe zu steuern.

### Nicht Bestandteil

Spotify-Kontoverbindung, globale Katalogsuche, Playlists und Wiedergabesteuerung werden ohne registrierte Client-ID nicht angeboten. Die vorhandene optionale OAuth-Implementierung darf intern bestehen bleiben, wird aber ohne konfigurierte Client-ID nicht als funktionsfähiger Standardweg angezeigt. Es werden weder Scraping noch inoffizielle Suchdienste verwendet.

### Fehlerbehandlung und Sicherheit

Netzwerkfehler, Zeitüberschreitungen, ungültige URLs, 404-Antworten und unvollständige oEmbed-Daten erzeugen kurze deutsche Fehlermeldungen mit Wiederholungsmöglichkeit. Externe URLs werden weiterhin im Hauptprozess validiert. HTML aus der oEmbed-Antwort wird nicht gerendert oder gespeichert.

## 6. Datenfluss und Grenzen

- Der Renderer übergibt nur die validierbare Spotify-URL an die Desktop-Bridge.
- Der Hauptprozess normalisiert die URL, lädt oEmbed und gibt ein typisiertes Metadatenobjekt zurück.
- Der Renderer speichert die Verknüpfung über den bestehenden lokalen Referenzspeicher.
- KI-Rohantworten durchlaufen Normalisierung und Schemaprüfung, bevor irgendein Assistententext den Store erreicht.
- Bibelanimationen verändern keine Schnellanzeigen-Payloads und keine Revisionslogik; Vorschau und MAIN verwenden denselben Inhalt.

## 7. Tests und Abnahme

Die Umsetzung folgt Test-first und deckt mindestens ab:

1. erzeugte NSIS-Lizenzdatei ist UTF-16LE mit BOM und frei von Mojibake,
2. technische API-/Lokalhinweise fehlen in den relevanten sichtbaren Texten,
3. Prompt-Echo plus gültiges JSON wird korrekt extrahiert, aber nie angezeigt,
4. ungültige KI-Ausgabe legt weder Systemprompt noch Rohantwort im Chat ab,
5. MAIN rendert keinen Live-Badge,
6. Bibelanzeige paginiert lange Stellen ohne Überlauf und respektiert reduzierte Bewegung,
7. Spotify-Linknormalisierung akzeptiert nur Track-URLs und entfernt Parameter,
8. oEmbed-HTML wird verworfen, Metadaten werden sicher abgebildet,
9. Fehlerzustände des Spotify-Imports sind wiederholbar und verständlich.

Vor der Veröffentlichung laufen gezielte Tests, vollständige Test-Suite, TypeScript-Prüfung, Produktions-Build und die vorhandenen Release-Prüfungen. Anschließend wird `0.62.0` gebaut, veröffentlicht und der veröffentlichte Installer samt Assets verifiziert.

## 8. Abgrenzung

V62 führt keinen fremden Spotify-Schlüssel ein, umgeht keine Spotify-Autorisierung, streamt keine Musik und verändert den bereitgestellten Bibelstellen-Worker nicht. Die Änderung umfasst keine allgemeine Neugestaltung des Editors und keine Änderungen an nicht betroffenen Live-Markierungen innerhalb der Bedienoberfläche.
