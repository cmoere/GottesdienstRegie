# GottesdienstRegie V63 – Radio, Medien, Ablauf und OSB

## Ziel

V63 entfernt den fehleranfälligen allgemeinen KI-Helfer und verbessert vier klar getrennte Bereiche: Ablaufbearbeitung, Hintergrund-Audio, Radio-/Medienfunktionen und die On-Screen Bible (OSB). Die Live-Ausgabe bleibt gegen unbeabsichtigte Änderungen geschützt. Technische OSB-Vorgaben gelten für den gemeinsam genutzten Regie-PC und nicht für einzelne Benutzer oder Präsentationen.

## Globale Regeln

- Releaseversion ist `0.63.0` und die Release-Serie ist `0.63`.
- Neue sichtbare Bedienelemente verwenden bestehende Icons, keine Emojis.
- Dialoge und Popovers verwenden keine Schatten.
- `SELECTED` ist nicht `LIVE`: reine Auswahl oder Vorschau verändert MAIN nicht.
- OSB ist eine MAIN-Schnellanzeige und verändert weder die aktuelle Präsentationsposition noch den Ablauf.
- Der allgemeine KI-Helfer wird entfernt. Mediengenerierung bleibt als eigenständige, eng begrenzte Medienfunktion bestehen.
- Kostenlose Mediengenerierung benötigt keinen persönlichen API-Schlüssel. Modelle oder andere große Ressourcen werden nur nach ausdrücklichem Download installiert.
- Nicht installierte, nicht lizenzierte oder anderweitig nicht verfügbare Bibelübersetzungen erscheinen nicht in OSB-Auswahllisten.

## Teilpaket 1: KI-Helfer entfernen

Der allgemeine KI-Helfer wird vollständig aus der ausgelieferten Anwendung entfernt:

- kein Menüeintrag, Toolbar-Knopf, Panel oder Shortcut;
- keine KI-Helfer-Einstellungsseite;
- kein automatischer Modell-Download für den Helfer;
- keine aktiven IPC-Endpunkte oder Hintergrundinitialisierung für Chat-/Aktionsgenerierung;
- keine Hilfe- oder Tutorialtexte, die den KI-Helfer anbieten.

Historische Releasehinweise dürfen den damaligen Funktionsstand weiterhin dokumentieren. Allgemeine Infrastruktur, die ausschließlich von der entfernten Funktion verwendet wird, wird entfernt. Medien-KI und lokale Übersetzungsmodelle bleiben davon unberührt.

## Teilpaket 2: Ablauf und Elementauswahl

### Element hinzufügen

Das Popover zeigt zwei visuell getrennte Gruppen:

1. **Präsentation und Gottesdienst**: Inhalt, Bild, Video, Videoeingang, Audio, Song, Bibel, LiveQuiz, Webseite, PDF, Timer, Countdown, Slideshow, Stage-Nachricht und Schnellanzeige.
2. **Vor- und Nachprogramm**: Meldungen, Geburtstage, Veranstaltungen, Wetter, Quiz, Loop-Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte, Heute bei uns, Nächste Termine und `Läuft gerade`.

Die zweite Gruppe bleibt sichtbar, wird aber für ein unzulässiges Ziel erklärend deaktiviert. Ein Klick außerhalb des Popovers schließt es. Klicks innerhalb, Unterdialoge und die Elementauswahl lösen keinen unbeabsichtigten Außenklick aus.

### `Läuft gerade`

`Läuft gerade` ist ein eigenes Loop-Element für Vor- und Nachprogramm. Es besitzt mindestens eine normale bearbeitbare Folie und verwendet den bestehenden Folieneditor für Hintergrund, Typografie, Text und Elemente. Die Standardfolie zeigt einen ruhigen Hinweis auf den aktuell laufenden Inhalt. Das Element darf nicht in reguläre Gottesdienstabschnitte eingefügt werden.

## Teilpaket 3: Hintergrund-Audio und Radio

### Kompaktes Audiofenster

Ein Klick auf ein Lautsprecher-Icon eines Abschnitts oder Elements öffnet bei vorhandenen Titeln ein kompaktes Audiofenster. Es zeigt:

- alle zugeordneten Titel in der tatsächlichen Reihenfolge;
- Titelname und, sofern vorhanden, Interpret;
- einen globalen Shuffle-Schalter für diese Zuordnung;
- Entfernen jedes Titels über einen X-Knopf;
- einen klaren Einstieg zum Hinzufügen weiterer Audios.

Ist noch kein Audio zugeordnet, führt derselbe Klick direkt zur bestehenden Audioauswahl. Entfernen des letzten Titels entfernt die leere Audiozuordnung. Die Laufzeitwiedergabe reagiert auf Shuffle und Listenänderungen, ohne MAIN-Folien zu wechseln.

### Radio-Metadaten

Radio-Wiedergabe versucht laufende Metadaten aus dem Stream zu lesen. Die Desktop-Schicht verarbeitet ICY-/Shoutcast-Metadaten und gibt nur normalisierte Werte an die Oberfläche:

```ts
interface RadioNowPlaying {
  stationId: string;
  title?: string;
  artist?: string;
  artworkUrl?: string;
  source: "icy" | "station";
  updatedAt: string;
}
```

`StreamTitle` wird defensiv in Interpret und Titel zerlegt. Nicht jeder Sender stellt diese Daten bereit. Dann zeigt die Oberfläche Sendername und Senderbild statt leerer oder erfundener Angaben. Fehlerhafte Metadaten stoppen die Audiowiedergabe nicht. Metadaten werden beim Senderwechsel verworfen und niemals einem anderen Sender zugeordnet.

## Teilpaket 4: Kostenlose Medien-KI

Der bisherige prozedurale SVG-Generator wird durch eine echte, lokale und auf Medien beschränkte Generierung ersetzt.

### Modellverwaltung

- Ein katalogisiertes Open-Source-Bildmodell wird erst nach Benutzeraktion heruntergeladen.
- Vor dem Download zeigt die Anwendung Größe, Speicherort und eine Aktion `Herunterladen`.
- Downloadfortschritt, Abbruch, Wiederaufnahme, Integritätsprüfung und Entfernen folgen den vorhandenen Mustern für Modellpakete.
- Fehlt das Modell, bleibt die Medienbibliothek nutzbar; nur `Motiv erstellen` ist blockiert und erklärt die erforderliche Installation.
- Die Inferenz läuft lokal. Prompts und erzeugte Daten werden nicht an einen externen KI-Dienst gesendet.

### Erzeugung

- Bildgenerierung berücksichtigt Beschreibung, Negativbeschreibung, Seitenverhältnis, Stil und einen neuen Seed pro Generierung.
- `Neu generieren` erzeugt mit gleichem Prompt eine sichtbare Variante.
- Das Ergebnis bleibt zunächst eine Vorschau und wird erst nach `In Medienbibliothek speichern` dauerhaft importiert.
- Fehler zeigen einen kleinen `Erneut versuchen`-Knopf.
- Videohintergründe werden lokal aus einem generierten Bild mit Zoom, Kamerafahrt oder Parallax erzeugt. V63 enthält kein eigenständiges Text-zu-Video-Großmodell.
- Die vorhandene Mindestdauer der Erstellanzeige und die reduzierten Bewegungsoptionen bleiben erhalten.

## Teilpaket 5: Zentrale OSB-Einstellungen

### Speicherort und Besitz

Die vollständige Konfiguration liegt ausschließlich unter:

`Einstellungen → Präsentation → MAIN Schnellanzeigen → OSB`

Sie wird als technische Geräte-/Organisationsvorgabe gespeichert. Sie gehört nicht zu einer einzelnen Präsentation und nicht zu persönlichen Benutzerpräferenzen. Ein Benutzerwechsel auf demselben registrierten Regie-PC ändert die Darstellung nicht.

```ts
interface OsbSettings {
  enabled: boolean;
  defaultBibleTranslationId: string;
  secondaryBibleTranslationId: string | null;
  allowTranslationChangeInQuickScreen: boolean;
  style: "classic" | "book" | "focus" | "column" | "modern" | "minimal";
  accentColor: "green" | "turquoise" | "blue" | "violet" | "red" | "gold";
  showBookIntroduction: boolean;
  showReference: boolean;
  showTranslationName: boolean;
  referencePosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  animationSpeed: "slow" | "normal" | "fast";
}
```

Voreinstellungen:

- aktiviert;
- erste verfügbare Luther-Ausgabe, bevorzugt Luther 2017;
- keine alternative Übersetzung;
- Übersetzung im F9-Dialog änderbar;
- Stil `Klassisch`;
- Farbe `Grün` (`#608F3E`);
- keine Bucheinleitung;
- Referenz und Übersetzungsname sichtbar;
- Referenz unten links;
- Geschwindigkeit normal.

### Bibelübersetzungen

Standard- und Alternativauswahl verwenden denselben bestehenden Bibelkatalog wie die Bibelsuche. Es werden ausschließlich tatsächlich abrufbare und erlaubte Ausgaben gezeigt, nach Sprache gruppiert. Die alternative Übersetzung kann `Keine` sein und darf nicht identisch zur Standardübersetzung sein. Ohne Alternative wird weder eine zweite Ausgabe geladen noch dargestellt.

### Sechs Stile

Exakt sechs vordefinierte Stile stehen zur Wahl:

1. Klassisch
2. Buch
3. Fokus
4. Spalte
5. Modern
6. Minimal

Jeder Stil definiert Bibelseitenoptik, Textposition, Fokusform und Bewegungscharakteristik. Alle Stile verwenden dieselben semantischen Inhalte und respektieren sichere Ränder. Kein Stil darf Text abschneiden.

### Sechs Farben

Die Farbauswahl besteht aus sechs Farbfeldern:

- Grün `#608F3E`
- Türkis `#608F9A`
- Blau `#3F6F96`
- Violett `#765A8C`
- Rot `#A65353`
- Gold `#B48A3C`

Die Farbe steuert Hervorhebung, Markierungsfläche, Referenzakzent und Fokuslinie, nicht die gesamte Bibelseite.

### Buchintro, Referenz und Geschwindigkeit

Mit aktiviertem Buchintro erscheint zuerst eine kurze Buchdarstellung, danach die animierte Fahrt zur Stelle. Ohne Buchintro beginnt die Passage direkt. Referenz und Übersetzungsname sind getrennt schaltbar. Die Referenz kann an allen vier Ecken positioniert werden.

Die Stile besitzen eigene Animationen. Der Geschwindigkeitsfaktor beträgt intern:

- langsam: `1.8`;
- normal: `1.0`;
- schnell: `0.7`.

`prefers-reduced-motion` beziehungsweise die bestehende Einstellung für reduzierte Bewegung erzeugt eine direkte, ruhige Darstellung ohne informationsverlust.

### Echte Einstellungs-Vorschau

Die OSB-Seite enthält eine echte animierte Vorschau mit Teststellenfeld und `Vorschau abspielen`. Sie verwendet Standardübersetzung, Stil, Farbe, Buchintro, Referenzoptionen und Geschwindigkeit. Die Vorschau existiert ausschließlich im Einstellungsfenster und sendet keine Ausgabe an MAIN.

## Teilpaket 6: F9 und Live-Verhalten

F9 öffnet einen schnellen OSB-Dialog mit Bibelstellenfeld und `Anzeigen`. Das Übersetzungsfeld erscheint nur, wenn `allowTranslationChangeInQuickScreen` aktiv ist. Der Dialog enthält keine Stil-, Farb-, Referenz- oder Animationseinstellungen.

Beim Öffnen werden die gespeicherten Gerätevorgaben geladen. Enter lädt und zeigt die Stelle. Die OSB-Ausgabe liegt temporär über dem aktuellen MAIN-Livezustand. Ausblenden stellt exakt diesen Zustand wieder her. Ein fehlgeschlagener Bibelabruf verändert MAIN nicht. Ist OSB deaktiviert, erklärt F9 knapp, wo es aktiviert werden kann.

## Fehlerbehandlung

- Unbekannte oder nicht mehr verfügbare Standardübersetzungen fallen auf die erste erlaubte Ausgabe zurück und aktualisieren die gespeicherte Einstellung kontrolliert.
- Ein Ausfall des Bibelproviders, der Radio-Metadaten oder der lokalen Mediengenerierung beendet keine laufende MAIN- oder Audiowiedergabe.
- Ungültige gespeicherte OSB-Werte werden einzeln auf Standardwerte normalisiert.
- Medienmodell-Downloads verwenden temporäre Dateien und werden erst nach erfolgreicher Integritätsprüfung aktiviert.
- Außenklick-Handler respektieren verschachtelte Dialoge und Pointer-Capture.

## Abnahmetests

1. In der Anwendung existieren kein KI-Helfer-Panel, kein KI-Helfer-Menüeintrag und keine zugehörige Einstellungsseite.
2. `Element hinzufügen` zeigt die beiden beschriebenen Gruppen und schließt bei Außenklick.
3. `Läuft gerade` kann in Vor- und Nachprogramm erstellt und im normalen Folieneditor gestaltet werden, nicht jedoch im Gottesdienstabschnitt.
4. Ein Lautsprecher-Klick zeigt zugeordnete Titel, Shuffle und Entfernen per X; der letzte entfernte Titel löscht die Zuordnung.
5. Ein Radio mit ICY-Metadaten zeigt Titel und Interpret. Ein Radio ohne Metadaten zeigt stabil den Sender-Fallback.
6. Medien-KI fordert bei fehlendem Modell einen ausdrücklichen Download an und sendet den Prompt an keinen externen KI-Dienst.
7. Zwei Generierungen mit demselben Prompt können unterschiedliche Varianten erzeugen; dauerhaft gespeichert wird erst nach Bestätigung.
8. Die vollständige OSB-Konfiguration befindet sich unter `Einstellungen → Präsentation → MAIN Schnellanzeigen → OSB`.
9. Standardübersetzung, alternative Übersetzung, sechs Stile, sechs Farben, Buchintro, Referenzoptionen und Geschwindigkeit werden gespeichert und nach Neustart wiederhergestellt.
10. Nicht verfügbare oder nicht erlaubte Bibelübersetzungen erscheinen nicht.
11. `Vorschau abspielen` zeigt die gewählten Werte nur in den Einstellungen; MAIN bleibt unverändert.
12. F9 verwendet die Standardübersetzung und zeigt das Übersetzungsfeld nur bei aktivierter Option.
13. F9 zeigt keine Designoptionen.
14. OSB verändert die normale Präsentationsposition nicht und stellt beim Ausblenden den vorherigen Livezustand wieder her.
15. Ein Benutzerwechsel auf demselben registrierten Gerät verändert die technische OSB-Konfiguration nicht.
16. Alle neuen Bedienelemente sind per Tastatur bedienbar und besitzen zugängliche Bezeichnungen.
17. Release- und Update-Metadaten weisen konsistent `0.63.0` aus.

## Nicht Bestandteil von V63

- keine Spotify-Kontosuche oder Spotify-Wiedergabesteuerung ohne offiziell registrierte Spotify-Anwendung;
- kein extern gehosteter kostenloser KI-Proxy;
- kein großes Text-zu-Video-Modell;
- keine persönlichen OSB-Designprofile;
- keine Designoptionen im F9-Dialog;
- keine zweite Bibelausgabe, wenn `Alternative Übersetzung` auf `Keine` steht.
