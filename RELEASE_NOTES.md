# GottesdienstRegie 0.86.0

Veröffentlicht: Fr., 23.10.2026

Das Vor- und Nachprogramm erhält lokale Nachrichten mit Quellenlogos sowie Fußball-Spieltermine, Ergebnisse und Tabellen. Neue Uhrdesigns, ein automatischer Bildschirmtest und ein zweisprachiger Störungshinweis unterstützen die Vorbereitung. Besucherausgabe und Live-Vorschau verwenden einen gemeinsamen vorbereiteten Datenstand; Aktualisierungen werden erst beim sicheren Folienwechsel übernommen.

## Neu

Westfalen-Blatt und WDR sind getrennt auswählbar. Fußball bietet Bundesliga-Auswahl, Vereinsfilter, Ergebnisse und vollständige Tabellen. Quellen und Datenstand bleiben sichtbar. Ein begrenzter Offline-Cache überbrückt Netzfehler; ohne gültige Daten wird das optionale Element übersprungen.

## Verbessert

Sechs Designkacheln verbinden digitale und analoge Uhren mit Datum, Sekunden, Farben und Ausrichtung. Lange Listen erhalten automatisch eine lesbare Mindestdauer. Bei reduzierter Bewegung bleiben Inhalte als statische Teilansichten vollständig lesbar. Die technische Störungsanzeige wechselt mit gemeinsamem Zeitbezug zwischen Deutsch und Englisch und zeigt ein Informationssymbol.

## Behoben

Der Bildschirmtest wartet auf die Rückmeldung des tatsächlichen MAIN-Renderers, bietet Abbrechen und stellt die vorherige Ausgabe wieder her. Vor und zurück in einer bereits geladenen Bibelschnellanzeige öffnet nicht erneut den Eingabedialog. Aktualisierte Nachrichtendaten verändern keine bereits sichtbare Folie.

## Bekannte Einschränkungen

Regionalvarianten sind noch nicht vollständig übersetzt. Fehlende UI-Texte werden auf Hochdeutsch angezeigt. Diese Version ist mit diesem offengelegten Umfang als normales Update freigegeben.

Der experimentelle originalgetreue PowerPoint-Spieler ist noch nicht freigegeben und bleibt deaktiviert. Diese Aktualisierung erklärt ihn nicht für fertig. Bildschirmtests ersetzen keine Sichtprüfung der tatsächlichen Projektoren und Lautsprecher.

---

# GottesdienstRegie 0.85.0

Veröffentlicht: Mi., 21.10.2026

Diese Aktualisierung verbessert die Besucherinformationen vor und nach dem Gottesdienst. Meldungslaufbänder bleiben beim Wechsel zum Ankommen und Countdown in Bewegung. Lange Meldungen werden auf einer zusammenhängenden Fläche langsam gescrollt, während der QR-Code fest an seiner Position bleibt. Neue Schnellanzeigen, ein optionaler kleiner Gottesdienst-Countdown und ein RSS-Feed für die Versionshinweise ergänzen den Ablauf.

## Neu

### Schnellanzeigen und Versionsfeed

MAIN erhält eine vorbereitete Schnellanzeige für technische Störungen. Unter den Schnellanzeigen lässt sich außerdem ein kleiner Countdown bis zur effektiven Gottesdienstzeit unten links aktivieren. Die Versionswebseite bietet einen RSS-Link zum Abonnieren der vollständigen Versionshinweise. Infokarten werden nicht mehr zum Hinzufügen angeboten; vorhandene Inhalte und die geschützte Nachprogrammfolie bleiben erhalten.

## Verbessert

### Durchlaufende Meldungen

Das kräftiger gesetzte Laufband verbindet mehrere Meldungen mit Abstand und einem mittigen Punkt. Wiederholte Textgruppen verhindern eine vollständig leere Laufbandfläche. Die Startposition bleibt bei Wechseln zwischen Vorprogramm, Ankommen und Countdown erhalten. Meldungsfolien beginnen weiter oben und bewahren Fettdruck, Kursivschrift, Unterstreichungen und Absätze. Die QR-Code-Größe ist von 120 bis 480 Pixeln bei 1920 × 1080 einstellbar. Die Mindestanzeigedauer wird automatisch verlängert, damit ein langer Scrolltext vollständig durchlaufen kann.

## Behoben

### Countdown und geschütztes Nachprogramm

Ein abgelaufener Countdown im Vorprogramm oder Ankommen führt zum ersten freigegebenen Gottesdienstinhalt. Verspätete Abschlussereignisse eines bereits verlassenen Countdowns lösen keinen weiteren Sprung aus. Die automatische Folie Nächste Veranstaltung / Raum verlassen ist während ihrer ersten 60 Sekunden gegen NEXT, PREV und direktes Anspringen anderer Inhalte geschützt. Der automatische Loop wartet auf dieselbe Freigabe. Schwarz, Schnellanzeigen und OFF AIR bleiben für Notfälle verfügbar.

## Bekannte Einschränkungen

### Regionalübersetzungen weiterhin unvollständig

Regionalvarianten sind noch nicht vollständig übersetzt. Fehlende UI-Texte werden auf Hochdeutsch angezeigt. Auch diese Version erscheint mit ausdrücklicher Freigabe als normales Update mit diesem eingeschränkten Sprachumfang. Der Hinweis bleibt in der Sprachauswahl sichtbar.

### Originalgetreue PowerPoint-Wiedergabe noch in Prüfung

Die neue originalgetreue PowerPoint-Wiedergabe ist noch nicht freigeschaltet. Native Steuerung und isolierte Testdateien werden geprüft; die Bildübertragung und Synchronität müssen die vorgesehenen Abnahmekriterien noch erfüllen. Der bisherige Import bleibt verfügbar.

[Versionshinweise per RSS abonnieren](https://cmoere.github.io/GottesdienstRegie/release-notes/feed.xml)

---

# GottesdienstRegie 0.84.0

Veröffentlicht: Di., 20.10.2026

Diese reguläre Aktualisierung macht die ersten 15 deutschen Regionalvarianten unter **Einstellungen → Allgemein → Sprache** auswählbar. Sie enthält regionale Hilfe, den bisherigen Versionsverlauf sowie weitere Beschriftungen für die Bedienoberfläche. Die Regionalauswahl betrifft ausschließlich die Bedienung, nicht die Inhalte der Ausgaben.

## Neu und verbessert

- 15 deutsche Regionalvarianten und Hochdeutsch als jederzeit erreichbarer Standard. Die Auswahl wird gerätebezogen gespeichert; die übrigen Regionalvarianten bleiben verborgen.
- 63 Hilfeartikel und die bisherigen Versionshinweise bis einschließlich 0.83.0 sind für die freigegebenen Varianten lokal hinterlegt. Es wird kein Online-Übersetzungsdienst benötigt.
- Regionale Beschriftungen für die Veranstaltungsverknüpfung, Schnellanzeigen und ausgewählte Audio-, Barrierefreiheits- und Versionsdetails. Bereits vorhandene Übersetzungen anderer Basissprachen bleiben erhalten.
- Sprachwechsel verändern weder gespeicherte Audio-Geräte noch Präsentationsinhalte oder die aktuelle Liveposition. Eigene Titel, Bibel- und Liedtexte und Firebase-Inhalte werden nicht umgeschrieben.

## Bekannte Einschränkungen

Regionalvarianten sind noch nicht vollständig übersetzt. Fehlende UI-Texte werden auf Hochdeutsch angezeigt.

Diese Veröffentlichung erfolgt auf ausdrücklichen Wunsch als normales Update mit eingeschränktem regionalem UI-Umfang. Die Sprachauswahl weist sichtbar darauf hin. Eine vollständige Übersetzung aller Menüs, Dialoge und Werkzeuge wird nicht behauptet. Hochdeutsch bleibt jederzeit auswählbar.

Automatische Sprachansagen, Gong, Stimmwahl und Sprachpakete bleiben deaktiviert. Die Regionalauswahl aktiviert keine Sprachausgabe und verändert nicht die Besucher-Ausgaben. Das System-Wasserzeichen **TESTBETRIEB** bleibt unverändert.

---

# GottesdienstRegie 0.83.0

Veröffentlicht: Do., 15.10.2026

Diese Version ergänzt die Vorbereitung von Saal-Durchsagen und sichert die vorhandene Hintergrund-Audiosteuerung ab. Unter Einstellungen → Präsentation → Ansagen lassen sich das spätere Intervall und der verbleibende Musikpegel gerätebezogen speichern. Freigegebene Saaltexte werden aus den bestehenden Gemeindemeldungen angezeigt, ohne Firebase-Daten zu verändern.

## Neu

### Ansageneinstellungen und öffentliche Saaltexte

Das Intervall lässt sich von 1 bis 120 Minuten und der während einer zukünftigen Durchsage verbleibende Musikpegel von 0 bis 100 Prozent vorbereiten. 20 Prozent bedeutet ein Fünftel des ansonsten gültigen Musikpegels. Die Schaltfläche „Ansageneinstellungen speichern“ übernimmt die Werte für diesen Regie-PC. Die Einstellungen bleiben beim Schließen der Seite erhalten.

Die Textliste berücksichtigt öffentliche Freigabe, Gültigkeitszeit, Saalzuordnung und die vorhandene Textauswahl. Interne Kommentare werden nicht angezeigt. Änderungen und zurückgezogene Meldungen werden aus dem zentralen Datenbestand übernommen; „Texte aktualisieren“ prüft zusätzlich inzwischen abgelaufene Einträge. Noch nicht geladene Gemeindedaten werden von einer leeren gültigen Auswahl unterschieden.

## Behoben

### Audiosteuerung ohne gegenseitiges Aufheben

Video- und vorbereitete Durchsageabsenkungen besitzen getrennte Ansprüche. Die stärkere Absenkung hat Vorrang. Änderungen an Lautstärke, Stummschaltung und Ausgangspegel werden nicht durch einen alten Fade-Zielwert zurückgesetzt. Der neue Absenkungsbaustein startet oder trennt weder Radio noch Playlist. Unveränderte Audiozuordnungen und unbeteiligte Einstellungen beenden einen laufenden Musik-Ausblendvorgang nicht vorzeitig.

## Bekannte Einschränkungen

### Automatische Sprachansagen sind deaktiviert

Diese Veröffentlichung enthält ausschließlich die Vorbereitung. Es werden keine automatischen Sprachansagen, kein Gong und kein Sprachpaket aktiviert oder heruntergeladen. Die Aktivierung ist sowohl in der Oberfläche als auch im Hauptprozess gesperrt. Stimmwahl, Probeanhören, Synthese und zeitgesteuerte Wiedergabe sind noch nicht verfügbar; eine geprüfte lokale Sprachengine bleibt Voraussetzung für eine spätere Freigabe. Es wird nicht unbemerkt auf Windows- oder Cloud-Stimmen gewechselt.

### Sprachumfang und bestehende Bannergrenze

Die neue Ansagenseite und ihre Anleitung sind deutsch; die Versionsbeschreibung ist deutsch und englisch verfügbar. Die bestehenden Übersetzungen anderer Hilfethemen bleiben erhalten. Ein ausschließlich aus unsichtbaren Zeichen bestehender Bannertext kann weiterhin eine leere Leiste reservieren; solche Texte bitte in der Datenquelle bereinigen.

---

# GottesdienstRegie 0.82.0

Veröffentlicht: Do., 15.10.2026

Die Medienbibliothek bietet 60 native, offline verfügbare Countdowns in zehn Zeitlängen und sechs ruhigen Designs. Als Meldungsscreen-Banner freigegebene Gemeindemeldungen laufen unabhängig vom Folienwechsel über MAIN und dessen echte Vorschauen; der übrige Inhalt wird proportional eingepasst.

Alle 63 Hilfethemen wurden um praktische Anleitungen und Fehlerbehebung in 17 Sprachen ergänzt. Eine neue Artikelansicht, aktuelle Aufnahmen der Anwendung und ein einheitlich aufbereiteter Versionsverlauf erleichtern die Vorbereitung im Gemeindeteam. Die abschließende Prüfung hat außerdem Countdown-Neustarts durch Editoränderungen und vorzeitig beendete Banner korrigiert.

## Neu

### 60 stille Countdown-Vorlagen

Unter Medienbibliothek → Countdowns stehen 20, 15, 10, 5, 3, 2 und 1 Minute sowie 30, 20 und 10 Sekunden bereit. Jede Dauer gibt es in Klar, Natur, Licht, Kreuz, Kerze und Geometrisch. Nur die ausgewählte Vorschau läuft. Die Übernahme erstellt ein eigenständiges Ablauf-Element; sie ersetzt weder ein Hintergrundbild noch eine Audiodatei. Die Countdowns bleiben standardmäßig ohne Ton und halten bei 00:00, sofern kein anderes Ende-Verhalten gewählt wurde.

### Unabhängiger Meldungsscreen-Banner

Die bestehende Firebase-Freigabe showMeldungBanner steuert einen eigenen öffentlichen Meldungskanal. Der rote Text läuft auf weißem Band im Vor- und Nachprogramm oder über einem Countdown. Oben oder unten wird gerätebezogen unter Einstellungen → Präsentation → Meldungsscreen-Banner festgelegt; unten ist Standard. Schwarz, Logo und OSB haben Vorrang. Textänderungen werden an Laufgrenzen übernommen, die reservierte Bildfläche an sicheren Wechselpunkten. STAGE und andere eigenständige Ausgaben werden nicht ungefragt verändert.

## Verbessert

### Ausführlichere, gegliederte Hilfe

Alle 63 Themen erhalten praktische Schritte, Probe- und Fehlerhinweise sowie passende Themenverweise in allen 17 vorhandenen Sprachen. Inhaltsverzeichnisse, lesbare Abstände, Tastaturfokus und Rechts-nach-links-Darstellung unterstützen die Bedienung. Zehn aktuelle native Aufnahmen zeigen die tatsächliche Oberfläche. Überholte Anweisungen zu Testbetrieb, Schnellanzeigen und Unsplash-Zugangsschlüsseln wurden mit dem heutigen Ablauf abgeglichen.

### Nachvollziehbarer Versionsverlauf

Die bisherigen 118 Builds bleiben mit ihren ursprünglichen Versionsnummern, Daten und ihrer Reihenfolge erhalten. Beschreibungen wurden sachlich und einheitlich aufbereitet; die ursprünglichen ausführlichen Notizen bleiben zusätzlich archiviert. Historische Bildschirmaufnahmen werden weiterhin als historische Ansichten verwendet, nicht als aktuelle Oberfläche ausgegeben.

## Behoben

### Stabile Live-Takes und Countdown-Zeit

Eine Änderung an einem anderen Ablauf-Element startet einen laufenden Countdown nicht mehr neu. MAIN und echte Vorschauen verwenden denselben ursprünglichen Zeitanker; ein bewusster erneuter Take startet weiterhin neu. Banner übernehmen ihren Abschnittskontext aus dem Live-Snapshot. Das Verschieben oder Entfernen des Editor-Elements ändert die sichtbare Bannerfreigabe daher nicht rückwirkend.

### Banner vollständig lesen und Medien weiterlaufen lassen

Eine entfernte oder abgelaufene Meldung beendet ihren aktuellen Lauf beziehungsweise ihre statische Lesephase auch über einen Folienwechsel hinweg; sie wird danach nicht erneut begonnen. Separate Banner-Revisionen vermeiden ein erneutes Laden des aktuellen Medieninhalts. Native Prüfungen bestätigen weiterlaufendes Video und unveränderte Website-Identität beim Bannerwechsel. Das Testwasserzeichen bleibt unabhängig darüber sichtbar.

### Sicherer Abschluss nativer Prüfläufe

Temporäre Chromium-Testprofile werden erst nach dem Ende des zugehörigen Prozesses bereinigt. Gesperrte Dateien erhalten begrenzte Wiederholungsversuche; ein weiterhin belegtes Profil bleibt mit Diagnose erhalten, statt beim Beenden eine unkontrollierte EBUSY-Ausnahme auszulösen. Diese Korrektur betrifft das Prüfwerkzeug und ist keine pauschale Bestätigung für die Behebung des früher gemeldeten grauen Programmstarts.

## Bekannte Einschränkungen

### Unsichtbare Zeichen in Bannertexten

Ein Text, der ausschließlich aus unsichtbaren Zeichen wie einem Zero-Width Space besteht, kann derzeit noch als Bannerinhalt erkannt werden und eine leere Leiste reservieren. Solche Meldungstexte bitte in der Datenquelle bereinigen. Normale Texte mit sichtbaren Zeichen sind davon nicht betroffen.

---

# GottesdienstRegie 0.81.0

Veröffentlicht: Mi., 14.10.2026

Automatische Veranstaltungs- und Meldungsfolien sowie der Nachprogramm-Raumhinweis nutzen die verfügbare Breite mit einem kleinen Sicherheitsrand. Timeline-Markierungen folgen ihrer Zeile und bleiben beim Scrollen auf der Linie. Die Lesedauer langer Titel wird mit den tatsächlichen Spaltenbreiten abgestimmt.

Neue Windows-Startoptionen erlauben das Öffnen bei der Anmeldung oder eine reine Update-Suche ohne Regiefenster. Dazu kommen stille Medienvorbereitung, Warnungen bei fehlenden Schriften, der Zeitpunkt der letzten Gemeindedaten-Aktualisierung und eine verbesserte Wiederherstellung ungespeicherter Änderungen nach Abstürzen.

## Neu

### Zwei getrennte Windows-Startoptionen

Unter Einstellungen lässt sich die installierte Windows-App bei der Anmeldung öffnen oder nur im Hintergrund nach Updates suchen. Beide Schalter sind zunächst aus. Die reine Hintergrundsuche startet weder Ladescreen noch Regie, Ausgaben, Audio oder Remote-Server und installiert nichts ungefragt. Nach der Suche oder einem begrenzten Timeout beendet sich der Prozess; verfügbare Updates werden per Windows-Benachrichtigung gemeldet.

### Stille Vorbereitung der nächsten Medien

Die nächsten zwei aktivierten Folien werden auf Bild-, Video- und lokale Audiodateien geprüft. Pro Fenster werden höchstens sechs Ressourcen mit zwei gleichzeitigen Ladeaufträgen vorbereitet. Bilder sowie Video-/Audio-Metadaten werden vorab geladen; es wird niemals play() ausgelöst. Radio, Websites und Live-Streams werden nicht vorab gestartet. Überholte oder zu lange hängende Aufträge werden freigegeben.

### Schriftprüfung und Gemeindedaten-Stand

Verwendete Schriften sichtbarer Textobjekte werden geprüft. Fehlende Familien erscheinen im Bedienbereich und im Preflight; die gespeicherten Schriftwünsche bleiben unverändert und MAIN zeigt keine technische Warnung. Der Gemeindedatenstatus nennt online die letzte Datenaktualisierung und offline den Stand des gespeicherten Snapshots.

## Verbessert

### Mehr nutzbare Folienbreite

Automatische Folien verwenden links und rechts 32 Pixel Sicherheitsrand bei 1920 Pixel Ausgabe. Meldungstext gewinnt Breite, wenn QR-Codes deaktiviert sind; mit QR-Code bleibt eine eigene Spalte erhalten. Gewöhnliche selbst gestaltete Folien werden nicht verändert. Scroll- und Mindestlesezeiten berücksichtigen die verbreiterten Titelbereiche.

### Wiederherstellung mit getrennten Zwischenständen

Ungespeicherte Änderungen erhalten nach einer kurzen Eingabepause einen separaten Wiederherstellungsstand; bei laufender Bearbeitung wird spätestens nach fünf Sekunden gesichert. Der regulär gespeicherte Präsentationsstand bleibt getrennt. Beim nächsten Start nach einem Absturz wird eine Wiederherstellung angeboten und nur nach Bestätigung geladen. Ein beschädigter letzter Zwischenstand kann auf den vorherigen gültigen Stand zurückfallen. Ausgaben und Audio werden niemals automatisch fortgesetzt.

## Behoben

### Timeline-Linie und Markierungen

Eine in der nativen Prüfung reproduzierte Verschiebung der Markierungen neben die Timeline-Linie wurde korrigiert. Jede Markierung bleibt an ihrer eigenen Zeilenmitte, einschließlich der letzten sichtbaren Zeile nach dem Scrollen. Titelanimation und vertikale Bewegung verwenden abgestimmte Anzeigezeiten.

### Geordneter Start und sichere Sicherungsreihenfolge

Normales Speichern und Wiederherstellungsstände werden geordnet verarbeitet, damit eine alte Sicherung keine neuere ausdrücklich gespeicherte Fassung ersetzt. Das Überspringen des Ladescreens überspringt nicht die notwendige Dokument- und Wiederherstellungsentscheidung. Sauberes Beenden wartet auf ausstehende Sicherungen und erzeugt keinen falschen Absturzhinweis.

## Bekannte Einschränkungen

### Grenzen der Vorbereitung und Systemintegration

Vorbereitung ist keine Garantie für verzögerungsfreie Wiedergabe jedes Netzwerkmediums; Videos und lokale Audiodateien werden zunächst mit Metadaten vorbereitet. Windows-Benachrichtigungen hängen von den Systemeinstellungen ab. Autostart ist in der installierten Windows-App verfügbar. Ein harter Absturz vor dem nächsten Zwischenstand kann die allerletzten Änderungen verlieren. Der frühere graue Programmstart bleibt weiterhin nicht als behoben bestätigt.

---

# GottesdienstRegie 0.80.0

Veröffentlicht: Di., 13.10.2026

Meldungen bieten acht Design-Kacheln mit Regie-Farben, einer lokalen QR-Freigabe, Kategorienfilter, Prioritätssortierung und einstellbarer Lesedauer. Die neue Veranstaltungsansicht zeigt eine helle Tabelle ohne Bilder und Etagen; vollständige Titel scrollen nur bei Platzmangel.

Der Ablaufbereich lässt sich bis auf 15 Prozent der Fensterbreite ziehen. Explizite Einfügepositionen verbessern das Umordnen, während geschützte Systemfolien und Bereichsregeln erhalten bleiben. Vorschautitel stehen außerhalb der Folie. Live-Vorschauen sind stumm und lösen keine zweite Video-Ende-Navigation aus.

## Neu

### Acht Meldungsdesigns und lokale Steuerung

Klar, Hell, Akzent, Seitenspalte, Grün, Silber, Rahmen und Fußbereich stehen als Vorschaukacheln bereit. Die QR-Option gilt für alle Meldungen des Elements; eine in Firebase nicht freigegebene QR-Anzeige wird dadurch nicht freigeschaltet. Kategorien und Prioritätssortierung filtern ausschließlich bereits freigegebene Meldungen. Lange Inhalte bleiben vollständig auf Folgeseiten erhalten.

### Helle Veranstaltungstabelle

Die neue Standardansicht orientiert sich an der Veranstaltungsauskunft: Datum, Uhrzeit, Veranstaltung und Ort/Raum stehen in klaren Spalten mit dünnen Linien. Bis zu 50 Termine können vorbereitet werden. Titel werden nicht gekürzt oder verkleinert; nur überlange Titel bewegen sich horizontal. Große Listen scrollen vertikal und erhalten eine berechnete Mindestdauer.

## Verbessert

### Ablaufbreite und sichere Einfügeziele

Die Breite wird am rechten Rand gezogen und lokal als persönliche UI-Einstellung gespeichert. Die Grenze liegt bei 15 Prozent der Fensterbreite. Zeilen bieten Ziele vor und nach dem Eintrag; leere und eingeklappte Abschnitte erhalten ein eigenes Ziel. Loop-Bereichsregeln und die geschützte erste Nachprogrammfolie bleiben wirksam. Umordnungen sind rückgängig machbar.

### Regie-Farben, Titel und Datumsformat

Systemakzente verwenden #699f3e, #608f9a und #b6bec3; eigene Folien und Fehlerfarben bleiben erhalten. Die Einzelvorschau zeigt den Folientitel links oberhalb des Bildes. Sichtbare Veranstaltungs- und Übersichtsdatumsangaben verwenden den tatsächlichen Wochentag mit Datum, etwa Mi., 01.01.2020. Meldungen zeigen keinen laufenden Zeitbalken.

## Behoben

### Aktuelle Live-Daten während Übergängen

Geänderte Daten derselben Folie werden in der eintretenden Übergangsebene sofort übernommen und warten nicht auf das Ende einer langen Überblendung. Bedien- und Ausgabefenster deaktivieren die Browser-Hintergrunddrosselung, damit verdeckte Fenster nicht ihre Timer ausbremsen. Gemeinsame Snapshots und Anzeigezeitpunkte bleiben erhalten.

### Keine doppelte Video-Audiowiedergabe aus Vorschauen

Beide Live-Vorschauen verwenden einen stummen Spiegelmodus. Videos laufen visuell weiter, erzeugen aber keine zusätzliche Audioausgabe und melden ihr Ende nicht als weiteren MAIN-Navigationsbefehl. Die echte MAIN-Ausgabe behält Audio und Medien-Ende-Steuerung.

## Bekannte Einschränkungen

### Prüfgrenzen

Softwareseitig gemeinsame Anzeigezeitpunkte garantieren keine hardwareseitige Bildsynchronisation unterschiedlicher Monitore. Sehr lange Tabellen können entsprechend lange Mindestzeiten benötigen. Der früher gemeldete graue Programmstart ist weiterhin nicht als behoben bestätigt.

---

# GottesdienstRegie 0.79.0

Veröffentlicht: Di., 13.10.2026

Bildschirmzuordnungen werden unabhängig von Präsentationen als Geräteprofil gespeichert. Geänderte Monitor-IDs werden nur bei eindeutig passender Identität übernommen; fehlende oder mehrdeutige Ausgänge werden dem Operator gemeldet.

Meldungen verwenden Cera Pro und bewahren Fettdruck, Kursivschrift, Unterstreichungen und Absätze über Folgeseiten hinweg. Laufende Musik wird bei jedem Take und zusätzlich sekündlich abgeglichen. Veranstaltungslisten nutzen native Browseranimationen statt React-Neuberechnung bei jedem Bild; MAIN und Live-Vorschauen arbeiten mit gemeinsam vorbereiteten Snapshots und Anzeigezeitpunkten.

## Neu

### Technisches Ausgabeprofil

MAIN, Stage und weitere Ausgabezuordnungen werden dauerhaft zusammen mit den Geräteeinstellungen gespeichert. Bildschirmname und physische Auflösung unterstützen die Wiedererkennung bei geänderten IDs. Unklare Treffer starten keine falsche Ausgabe. Eine während ON AIR erkannte neue ID wird nach dem Stoppen übernommen, ohne laufende Zuordnungen still zu verändern.

## Verbessert

### Formatierte Meldungen in Cera Pro

Titel und Beschreibung erhalten einen kleinen dünnen Trenner. Normaler Text bleibt normal; Fett, Kursiv und Unterstreichung werden als sichere Stilinformationen übernommen. Absätze einschließlich leerer Zeilen bleiben erhalten. QR-Codes und vollständige Folgeseiten bleiben verfügbar, ohne ungeprüftes HTML zu rendern.

### Ruhigere Vorschau und Ausgabe

Veranstaltungslisten werden über native Browseranimationen bewegt; statische Listen lösen keine React-Neuberechnungen pro Bild aus. Folienwechsel nutzen einen gemeinsamen Anzeigezeitpunkt. Beide MAIN-Vorschauen zeigen den erfolgreich übertragenen Snapshot mit denselben Übergängen und dem passenden Renderer für scrollende Songs. Neue Ausgabefenster werden erst sichtbar, wenn alle geladen sind.

### Ausführlichere Versionsgeschichte

29 bisher knappe ältere Builds wurden anhand der vorhandenen Änderungsprotokolle ausführlicher beschrieben. Die Darstellung unterstützt echte Absätze. Historische Angaben werden nicht nachträglich als neue Fehlerbehebungen ausgegeben.

## Behoben

### Läuft gerade erneut zuverlässig vorbereiten

Bei jedem Anzeigen wird der aktuelle Audiozustand übernommen, auch wenn derselbe Titel bereits zuvor lief. Ein sekündlicher Abgleich fängt verpasste Zustandsereignisse auf. Titel, Interpret und Cover bilden einen gemeinsamen Snapshot; unveränderte Daten verursachen keine unnötige Neuausgabe.

### Temporäre Windows-Dateisperren

Das atomare Ersetzen des Gemeindedaten-Caches und der Geräteeinstellungen wird bei vorübergehenden Zugriffssperren begrenzt erneut versucht. Der letzte gültige Stand wird dabei nicht gelöscht; dauerhafte Fehler bleiben erkennbar.

## Bekannte Einschränkungen

### Grenzen der Wiederherstellung

Bereits vor v79 verlorene Bildschirmzuordnungen können nicht rekonstruiert werden; bitte einmal neu auswählen. Ein gemeinsamer Software-Anzeigezeitpunkt ist keine hardwareseitige Bildsynchronisation. Der zuvor gemeldete graue Bildschirm beim Programmstart ist weiterhin nicht als behoben bestätigt.

---

# GottesdienstRegie 0.78.0

Veröffentlicht: Di., 13.10.2026

Meldungen bieten vier wählbare Designs: Klar, Hell, Akzent und Seitenspalte. Titel und Text erhalten getrennte Bereiche; lange Texte werden vollständig auf lesbare Folgeseiten verteilt, während der QR-Code daneben sichtbar bleibt. Der Loop zeigt alle Seiten einer Meldung vor dem nächsten Inhalt.

Veranstaltungslisten mit Platzmangel scrollen ruhig vertikal. Die automatische Mindestdauer berücksichtigt Scrollweg, Anfangs- und Lesepausen und erhält längere manuell eingestellte Zeiten. Das gilt auch für die geschützte Nachprogramm-Raumanzeige; bei reduzierter Bewegung erscheinen statische Seiten. Ihr farbiger Kopfbereich beansprucht nun 15 statt 17,5 Prozent der Bildhöhe.

## Neu

### Vier Meldungsdesigns

Im Bearbeiten-Bereich stehen Klar, Hell, Akzent und Seitenspalte als Design-Kacheln bereit. Getrennte Titel- und Textbereiche halten den Inhalt sicher innerhalb der Folie, während der QR-Code daneben sichtbar bleibt.

## Verbessert

### Vollständige Meldungen auf Folgeseiten

Lange Meldungstexte werden vollständig auf lesbare Seiten verteilt. Der Loop zeigt zuerst alle Seiten einer Meldung und wechselt erst danach zum nächsten Inhalt. Erste und letzte Seiten sowie alle vier Designs wurden auch in nativen Electron-Ausgaben geprüft.

### Scrollweg bestimmt die Mindestdauer

Überlange normale Veranstaltungslisten und die geschützte Nachprogramm-Raumanzeige scrollen ruhig vertikal. Die Mindestdauer berücksichtigt den gesamten Scrollweg und Pausen am Anfang sowie zum Lesen. Eine längere eingestellte Dauer bleibt bestehen. Reduzierte Bewegung verwendet statische vollständige Seiten.

### Kompakterer Nachprogramm-Kopf

Der farbige Kopfbereich wurde von 17,5 auf 15 Prozent der Bildhöhe reduziert. Die bereits gewählte Sitzungsfarbe bleibt erhalten.

## Bekannte Einschränkungen

### Grauer Bildschirm beim Start

Der zuvor gemeldete graue Bildschirm beim Programmstart ist mit dieser Version weiterhin nicht als behoben bestätigt.

---

# GottesdienstRegie 0.77.0

Veröffentlicht: Di., 13.10.2026

Beim Vorbereiten des Testbetriebs wird die letzte Auswahl gemerkt und bei jedem neuen Test erneut abgefragt. Ein bis zwölf gekennzeichnete Testveranstaltungen können normal, verspätet, ausgefallen, mit Raumwechsel oder gemischt erscheinen. Die geschützte Nachprogrammfolie öffnet die Vorschau; Bearbeitungsversuche zeigen einen bestätigbaren Hinweis. Raum- und Veranstaltungshinweise laufen standardmäßig 60 Sekunden, auch bei älteren Präsentationen.

Freigegebene Meldungen ohne zusätzliche Regie-Zuordnung erscheinen wieder. MAIN erhält bereits beim Start vorbereiteten öffentlichen Meldungstext; laufende Inhalte bleiben bis zum nächsten Wechsel stabil. Das Wasserzeichen bleibt innerhalb der Vorschau, beide Live-Vorschauen verwenden das passende Seitenverhältnis. Die Hilfe wurde ausführlicher und in allen 17 angebotenen Sprachen statisch übersetzt.

## Neu

### Mehrere Testveranstaltungen

Beim Vorbereiten eines Tests können ein bis zwölf ausdrücklich gekennzeichnete Testveranstaltungen normal, verspätet, ausgefallen, mit Raumwechsel oder gemischt angezeigt werden. Die letzte Auswahl wird gemerkt und bei jedem neuen Test erneut abgefragt. Echte Gemeindedaten bleiben unverändert.

## Verbessert

### Geschützte Folie und 60 Sekunden Nachprogramm

Die geschützte Nachprogrammfolie öffnet die Vorschau. Bearbeitungsversuche führen zu einem bestätigbaren Hinweis. Raum-verlassen- und Veranstaltungsanzeige verwenden standardmäßig 60 Sekunden, auch wenn eine ältere Präsentation übernommen wird.

### Ausführliche Hilfe in 17 Sprachen

Die Hilfe enthält ausführlichere Artikel und statische Übersetzungen für alle angebotenen Sprachen. Die Übersetzungen sind maschinell unterstützt; Schweizerdeutsch verwendet Schweizer Standardschreibung. Aktuelle Hilfe-Aufnahmen wurden erneuert, historische Release-Bilder bleiben unverändert.

## Behoben

### Öffentliche Meldungen und sichere Wechsel

Freigegebene Meldungen ohne zusätzliche Regie-Zuordnung erscheinen wieder. MAIN erhält beim Start vorbereiteten öffentlichen Text. Laufende Meldungen bleiben bis zum nächsten Wechsel stabil; leere Meldungen und nicht verfügbare Raumhinweise lösen keine Wechsel-Endlosschleife aus.

### Wasserzeichen und MAIN-Vorschau

Das Test-Wasserzeichen bleibt innerhalb der Vorschau und liegt nicht über Hilfe oder Bedienfenstern. Beide Live-Vorschauen zeigen das vorbereitete MAIN-Bild im passenden Seitenverhältnis.

## Bekannte Einschränkungen

### Grauer Bildschirm beim Start

Der zuvor gemeldete graue Bildschirm beim Programmstart ist mit dieser Version weiterhin nicht als behoben bestätigt.

---

# GottesdienstRegie 0.76.0

Veröffentlicht: So., 11.10.2026

Das Nachprogramm beginnt immer mit einer geschützten Systemfolie für nächste Veranstaltungen oder die Bitte, den Raum zu verlassen. Diese Folie kann weder bearbeitet, entfernt, verschoben noch über Plus hinzugefügt werden. Eigene Nachprogrammfolien folgen danach und bleiben ohne Überlagerung durch den Raumhinweis sichtbar.

Die Veranstaltungstabelle verwendet ruhigere Schrift und kleinere Spaltenüberschriften. Vollständige Titel bleiben einzeilig; überlange Zellen scrollen langsam. Etagen und Veranstaltungsbilder entfallen. Sind die benötigten Veranstaltungsdaten nicht auflösbar, wird eine leere Systemausgabe übersprungen oder die letzte Gottesdienstfolie bleibt stehen.

## Neu

### Feste erste Nachprogrammfolie

Das Nachprogramm enthält immer eine geschützte erste Systemfolie für nächste Veranstaltungen oder den Raum-verlassen-Hinweis. Sie ist nicht bearbeitbar, entfernbar oder verschiebbar und lässt sich nicht über Plus hinzufügen. Eigene Nachprogrammfolien bleiben danach sichtbar.

## Verbessert

### Ruhigere Veranstaltungstabelle

Ruhigere Schrift und kleine Spaltenüberschriften verbessern die Übersicht. Vollständige Veranstaltungstitel bleiben ohne Zeilenumbruch sichtbar; überlange Zellen scrollen langsam. Etagen und Veranstaltungsbilder werden nicht angezeigt.

## Behoben

### Eigene Folien und fehlende Daten

Der Raumhinweis überlagert eigene Nachprogrammfolien nicht mehr. Wenn Veranstaltungsdaten nicht aufgelöst werden können, wird die leere Systemausgabe übersprungen; alternativ bleibt die letzte Gottesdienstfolie stehen.

## Bekannte Einschränkungen

### Grauer Bildschirm beim Start

Der zuvor gemeldete graue Bildschirm beim Programmstart ist mit dieser Version nicht als behoben bestätigt.

---

# GottesdienstRegie 0.75.3

Veröffentlicht: Sa., 10.10.2026

Der Teststart bietet Automatisch, Raum verlassen und Testveranstaltung als Nachprogramm-Szenarien an. Die beiden ausdrücklich gewählten Beispiele funktionieren ohne verknüpfte Veranstaltung und ohne Gemeindedaten. Sie sind gekennzeichnet, gelten nur für den Testlauf und werden nicht in Firebase gespeichert; echtes ON AIR nutzt weiterhin die verknüpfte Veranstaltung.

Die Ausgabeprüfung wartet begrenzt auf initiale Gemeindedaten. Neue Abonnenten erhalten vorhandenen Verbindungsstatus und bereits synchronisierte leere Listen. Verknüpfungen aus älteren Veranstaltungsdialogen werden sofort berücksichtigt und konsistent gespeichert. Der letzte Weiter-Klick erreicht auch bei den beiden Testszenarien das Nachprogramm. Der Raum-verlassen-Hinweis verwendet etwas größere Schrift ohne Fettdruck.

## Neu

### Testauswahl

Raumhinweis und gekennzeichnete Testveranstaltung auch ohne Gemeindedaten testen; echte Termine bleiben unverändert.

## Verbessert

### Raum-verlassen-Anzeige

Etwas größere Schrift ohne Fettdruck.

## Behoben

### Verknüpfung und Ladezustand

Ältere Veranstaltungsfelder werden sofort abgeglichen. Die Startprüfung wartet auf Daten; bestehender Verbindungsstatus wird nachgereicht.

---

# GottesdienstRegie 0.75.2

Veröffentlicht: Sa., 10.10.2026

Der Weiter-Pfeil bleibt nach der letzten Gottesdienstfolie verfügbar, wenn eine Veranstaltung verknüpft ist und das automatische Nachprogramm erreicht werden kann. Auch wiederholtes Nachprogramm lässt sich weitersteuern; manuelle Gottesdienstfolien bleiben manuell bedienbar.

Einzelvorschau und LIVE AUF MAIN zeigen jetzt den vorbereiteten Raumhinweis aus der tatsächlichen Ausgabe: passende Folgetermine innerhalb von 61 Minuten oder die Bitte, den Raum zu verlassen. Die bearbeitbare Folie wird dabei nicht verändert. Die Kopfbereichsfarbe bleibt während einer Session fest, Änderungen werden beim nächsten sicheren Wechsel übernommen. Der Raumhinweis wird in der kleinen MAIN-Vorschau nicht mehr durch Beschriftungsformatierung abgeschnitten.

## Behoben

### Nachprogramm-Wechsel

Weiter bleibt für den automatischen Einstieg nach der letzten Gottesdienstfolie und für wiederholte Nachprogramm-Wechsel verfügbar.

### Live-Vorschauen

Einzelvorschau und LIVE AUF MAIN zeigen den vorbereiteten Raumhinweis, ohne die bearbeitbare Folie zu verändern oder den Text abzuschneiden.

---

# GottesdienstRegie 0.75.1

Veröffentlicht: So., 04.10.2026

Testbetrieb starten öffnet die Testausgaben direkt nach Bestätigung. ON AIR beginnt den normalen Betrieb mit einer verknüpften Veranstaltung; der Wechsel aus einem laufenden Test erfordert eine ausdrückliche Bestätigung.

Start und Live-Navigation beachten die Reihenfolge von Abschnitten, Elementen und Folien. Beim Weiterschalten nach der letzten Gottesdienstfolie wird ein fehlender Nachprogramm-Einstieg automatisch ergänzt, wenn eine Veranstaltung verknüpft ist. Der Raumhinweis nutzt weiterhin zentrale Veranstaltungs- und Raumdaten; manuelle Folien bleiben manuell gesteuert. Gespeicherte Fenstergrößen unterhalb der Desktop-Mindestgröße werden nicht als Arbeitsbereich wiederhergestellt.

## Behoben

### Live-Ablauf

Die letzte Gottesdienstfolie wird in der richtigen Reihenfolge gezeigt; Weiterschalten erreicht auch ohne angelegte Nachprogramm-Folie den Raumhinweis einer verknüpften Veranstaltung.

### Test und ON AIR

Testbetrieb starten öffnet die Testausgabe direkt nach Bestätigung. ON AIR bleibt der bestätigte Produktivstart mit Veranstaltung.

---

# GottesdienstRegie 0.75.0

Veröffentlicht: So., 04.10.2026

Beim Öffnen erhält MAIN den aktuellen versionierten Live-Zustand. Das Test-Wasserzeichen bleibt unabhängig von ON AIR auf den Ausgaben sichtbar.

Das Nachprogramm zeigt alle passenden Belegungen im effektiven Raum innerhalb von 61 Minuten. Die Kopfbereichsfarbe bleibt pro Session fest; neue Daten werden erst beim nächsten echten Wechsel übernommen. Raum-IDs werden zentral aufgelöst, vollständige lange Veranstaltungstitel bei Bedarf auf Folgeseiten verteilt.

Radio nutzt den konfigurierten Background-Audio-Ausgang. Die Pegelerfassung greift nicht mehr in den hörbaren Signalweg ein. Die Diagnose zeigt Route, Ausgang, Signal, Lautstärke, Mute und AudioContext und unterstützt damit die Prüfung der tatsächlichen Wiedergabe.

## Behoben

### MAIN und Radio

Initiale Ausgabe wird zuverlässig nachgeladen; Radio folgt der Background-Audio-Route mit Signaldiagnose.

### Veranstaltungen und Nachprogramm

Stabile Raum-IDs, vollständige Titel, sichere Seitenwechsel und feste Sessionfarbe.

---

# GottesdienstRegie 0.74.0

Veröffentlicht: Sa., 03.10.2026

Veranstaltungen, Meldungen und Räume werden zentral in Echtzeit aus der bestehenden Firebase-Datenquelle verarbeitet. Stabile Child-Keys bleiben erhalten und verschachtelte Raumdaten werden tolerant aufgelöst. MAIN erhält normalisierte öffentliche Inhalte; bei Verbindungsproblemen kann der letzte sinnvolle Stand weiterverwendet werden. Preflight zeigt fehlende oder nicht auflösbare Daten nur im Operator-Bereich.

Beim Nachprogramm-Einstieg wird der effektive Raum der verknüpften Veranstaltung geprüft. Eine weitere nicht abgesagte Veranstaltung innerhalb von 61 Minuten erscheint mit Titel, Startzeit und lesbarem Raum; andernfalls wird zum Verlassen des Raums aufgefordert. Testbetrieb und ON AIR sind unabhängige Zustände. MAIN, Livestream, Stage, Quick Screens, Videos, Websites und Schwarzbild tragen im Test ein dauerhaftes Wasserzeichen, auch während Übergängen.

## Neu

### Automatischer Raumhinweis

Das Nachprogramm zeigt die nächste Veranstaltung im effektiven Raum innerhalb von 61 Minuten oder bittet Besucher, den Raum zu verlassen.

### Test-Wasserzeichen

Alle tatsächlichen Ausgaben bleiben im Testbetrieb auch bei ON AIR eindeutig gekennzeichnet.

## Verbessert

### Zentrale Firebase-Daten

Veranstaltungen, Meldungen und verschachtelte Räume werden über gemeinsame Services mit stabilen IDs und normalisierten Ausgabedaten verarbeitet.

### Offline und Preflight

Der letzte sinnvolle Datenstand bleibt verfügbar; technische Probleme erscheinen nur im Operator-Bereich.

---

# GottesdienstRegie 0.73.0

Veröffentlicht: Do., 01.10.2026

Die automatische Update-Suche startet erst zwei Sekunden nachdem der Ladescreen vollständig durch den Arbeitsbereich ersetzt wurde. Die Netzwerkanfrage beginnt dadurch nach dem sichtbaren Programmstart.

Bei einem gültigen Konto ohne freigeschalteten GottesdienstRegie-Zugang nennt der Hinweis nun einen konkreten nächsten Schritt: Bitte wende dich an den Administrator.

## Verbessert

### Update-Suche nach dem Start

Die automatische Suche startet erst zwei Sekunden nachdem der Arbeitsbereich sichtbar geworden ist.

### Zugangshinweis

Bei einem gültigen Konto ohne GottesdienstRegie-Freigabe wird jetzt auf den Administrator verwiesen.

---

# GottesdienstRegie 0.72.1

Veröffentlicht: Do., 01.10.2026

Die vier Designkarten für Veranstaltungsfolien sind wieder im tatsächlich verwendeten Produktionseditor erreichbar. Dort lassen sich die Anzahl sichtbarer Termine und ihre Anzeigedauer direkt einstellen. Veranstaltungen zeigen neben dem Beginn auch die Endzeit.

Firebase rooms/ dient als zentrale abonnierte Raumquelle. Der RoomService löst stabile IDs sowie kompatible Namen und Kurzbezeichnungen auf und normalisiert interne, hybride, zusätzliche und Ersatzräume. MAIN und Vorschau verwenden Raumname, Etage und Gebäude; eine nicht aufgelöste interne ID erscheint nicht als öffentlicher Raumname.

## Neu

### Zentraler RoomService

Interne, hybride, zusätzliche und geänderte Räume werden anhand stabiler IDs aus Firebase rooms/ geladen.

## Verbessert

### Start- und Endzeit

Veranstaltungsfolien zeigen jetzt neben dem Beginn auch die Endzeit.

## Behoben

### Designauswahl sichtbar

Die vier Veranstaltungsdesigns und die Anzahl der Termine lassen sich wieder direkt im produktiven Editor auswählen.

### Keine rohen Raum-IDs

MAIN, Vorschau und dynamische Veranstaltungsdaten verwenden Raumname, Etage und Gebäude statt interner Firebase-IDs.

---

# GottesdienstRegie 0.72.0

Veröffentlicht: Do., 01.10.2026

Für jede gefundene neue Version erscheint ein eigenes Informationsfenster mit den Optionen Jetzt installieren, Später, Beim Beenden installieren und Abbrechen. Die Entscheidung steuert, wann ein automatischer Hintergrunddownload beginnt und ob das Update beim Beenden übernommen werden soll.

Unter Einstellungen → Updates kann die Option Heruntergeladene Updates beim Beenden installieren dauerhaft festgelegt werden. Download und Installation respektieren die Auswahl im Dialog; ein Hintergrunddownload löst keine ungefragte Installation aus.

## Neu

### Update-Dialog

Bei einer neuen Version stehen Jetzt installieren, Später, Beim Beenden installieren und Abbrechen zur Auswahl.

### Installation beim Beenden

Das Verhalten kann zusätzlich dauerhaft unter Einstellungen → Updates festgelegt werden.

## Verbessert

### Kontrollierter Hintergrunddownload

Automatische Downloads starten erst nach der Entscheidung im Hinweisfenster und installieren nicht ungefragt.

---

# GottesdienstRegie 0.71.1

Veröffentlicht: Mi., 30.09.2026

Der gemeldete JavaScript-Absturz im Electron-Hauptprozess beim Schließen oder Neustarten wird verhindert. Verzögerte Update-, Übersetzungs-, Spotify-, Ausgabe- und Fernsteuerungsereignisse werden beim Beenden verworfen, statt an bereits zerstörte Fenster zu senden.

Auch die Bildschirm-Wachhaltung wird sicher freigegeben, wenn Electron das zugrunde liegende Objekt bereits beendet hat.

## Behoben

### Kein zerstörtes Fenster mehr angesprochen

Verzögerte Update-, Übersetzungs-, Spotify-, Ausgabe- und Fernsteuerungsereignisse werden beim Beenden sicher verworfen. Auch die Bildschirm-Wachhaltung wird kontrolliert freigegeben.

---

# GottesdienstRegie 0.71.0

Veröffentlicht: Mi., 30.09.2026

Nächste Veranstaltungen zeigt mehrere kommende Termine gemeinsam. Karten, Zeitstrahl, Plakat und Minimal bieten vier Darstellungen; die Anzahl von zwei bis acht Terminen lässt sich für den jeweiligen PRE-/POST-Loop einstellen.

MAIN erhält den normalisierten Veranstaltungssnapshot gemeinsam mit der Live-Folie. Titel, effektive Zeit, Ort und vorhandene Cover stehen dadurch auch im separaten Ausgabefenster bereit; Firebase bleibt ausschließlich über den zentralen EventService angebunden. Bei Läuft gerade kann das Cover zusätzlich rund dargestellt werden. Die gespeicherte Einstellung wird identisch in Vorschau und MAIN angewendet.

## Neu

### Vier Veranstaltungsdesigns

Karten, Zeitstrahl, Plakat und Minimal stehen mit kleinen Vorschauen zur Auswahl.

### Runde Musikcover

Cover auf „Läuft gerade“ können optional kreisförmig dargestellt werden.

## Verbessert

### Mehr kommende Veranstaltungen

Pro Folie lassen sich zwei bis acht sortierte Termine anzeigen.

## Behoben

### Veranstaltungen auf MAIN

Der aktuelle Veranstaltungssnapshot wird sicher mit der Live-Folie an das separate MAIN-Fenster übertragen.

---

# GottesdienstRegie 0.70.0

Veröffentlicht: Mi., 30.09.2026

Läuft gerade erhält zehn Animationen, darunter drehendes Vinyl sowie zoomen, schweben, pulsieren, aufklappen und leuchten. Der vollständige Designer ist auch in der Produktionsansicht erreichbar. Cover werden bei jedem Titelwechsel neu eingesetzt, damit die Anzeige nicht beim vorherigen Lied stehen bleibt.

Veranstaltungsfolien übernehmen zentral normalisierte Firebase-Ereignisse mit Titel, effektiver Zeit und effektivem Ort; fehlen gültige Termine, erscheint ein klarer Leerzustand. ON AIR wechselt automatisch aus Bearbeiten in Vorschau. Das Hintergrund-Audio-Feld bietet Medienbrowser, zuletzt verwendete Medien, Import und Radio. Eine optionale maximale Wiedergabedauer beendet Audio mit der gewählten Ausblendzeit; Radiovorschauen laden ihre Quelle vor dem Start.

## Neu

### Zehn Musik-Animationen

Von drehendem Vinyl bis Cover-Zoom, Aufklappen und Leuchten stehen zehn passende Animationen mit reduzierter Bewegung bereit.

### Audiolaufzeit steuerbar

Hintergrund-Audio kann optional nach einer frei gewählten Sekundenzahl ausblenden und stoppen.

## Verbessert

### Vollständiger Läuft-gerade-Editor

Design, Animation, Farben, Metadaten, Visualizer und Dauer sind jetzt auch in der Produktionsansicht direkt konfigurierbar.

### Mehr Audioquellen

Medienbrowser, zuletzt verwendete Medien, Import und Radio sind gemeinsam im Hintergrund-Audio-Feld erreichbar.

## Behoben

### Radio und Cover synchron

Radiostreams starten erst nach gesetzter Quelle; Cover werden bei jedem Titelwechsel neu eingesetzt.

### Veranstaltungen sichtbar

Veranstaltungsfolien übernehmen normalisierte Firebase-Daten und zeigen einen klaren Leerzustand.

### Saubere MAIN-Vorschau

ON AIR wechselt aus Bearbeiten in Vorschau; der rote Folienrahmen und Punkt wurden entfernt.

---

# GottesdienstRegie 0.69.0

Veröffentlicht: Mi., 30.09.2026

Veranstaltungen und Meldungen werden zentral aus Firebase Realtime Database verarbeitet. Stabile Child-Keys überstehen Umbenennungen, geplante und effektive Zeiten werden getrennt behandelt und PRE-/POST-Loop-Ziele strikt berücksichtigt. MAIN erhält normalisierte öffentliche Daten. Echtzeitänderungen werden am sicheren Folienwechsel übernommen; der letzte weiterhin gültige Snapshot bleibt bei Verbindungsproblemen offline verfügbar.

Läuft gerade bietet einen vollständigen Designer mit zehn Vorschaukarten. Farben, Schreibweise, Metadaten, Visualizer-Stil und -Position sowie die Dauer ab einer Sekunde sind einstellbar. Der Visualizer reagiert auf analysierbares Audio und verwendet bei blockierten Radiostreams einen bewegten Fallback unter Beachtung reduzierter Bewegung. Preflight prüft Verbindung, Veranstaltungsverknüpfung und optionale leere Loop-Inhalte, ohne ON AIR unnötig zu blockieren.

## Neu

### Zentrale Firebase-Quelle

Stabile Veranstaltungs- und Meldungs-IDs, effektive Zeiten, Offline-Snapshot und sichere Live-Wechsel verwenden eine gemeinsame Datenlogik.

### Visueller Läuft-gerade-Designer

Zehn Designkarten sowie Farben, Schreibweise, Sichtbarkeit, Visualizer und Anzeigedauer werden direkt konfiguriert.

## Verbessert

### Audio-reaktiver Visualizer

Lokales Audio steuert die Bewegung; Radiostreams erhalten bei blockierter Analyse einen aktiven Fallback.

## Behoben

### Leere Musikfolie sicher übersprungen

Die Wiedergabe wird bei Auswahl und direkt vor MAIN erneut geprüft; Umlaute werden nicht mehr abgeschnitten.

---

# GottesdienstRegie 0.68.0

Veröffentlicht: Mi., 30.09.2026

Automatisch gespeiste Loop-Elemente zeigen kein allgemeines Folientextfeld mehr, dessen Platzhalter ihren tatsächlichen Inhalt nicht verändert. Das betrifft Läuft gerade, Wetter, Uhrzeit, Meldungen, Geburtstage, Veranstaltungen, Heute bei uns und Nächste Termine.

An dessen Stelle erscheint eine passende kompakte Konfiguration. Die zehn Läuft-gerade-Designs sowie Schalter für Cover, Album und Überspringen bei inaktiver Wiedergabe sind direkt im sichtbaren Editor erreichbar; Änderungen erscheinen sofort in der Vorschau. Manuell gepflegte Elemente wie Quiz, Countdown, Bibelvers, QR-Code und Infokarte behalten ihre Inhaltsfelder.

## Verbessert

### Läuft-gerade-Design direkt wählen

Alle zehn Designs sowie Cover-, Album- und Überspringen-Optionen sind direkt im sichtbaren Folieneditor verfügbar.

## Behoben

### Unnötige Textfelder entfernt

Automatisch gespeiste Loop-Elemente zeigen kein irreführendes allgemeines Textfeld mehr; manuell gepflegte Elemente behalten ihre Eingaben.

---

# GottesdienstRegie 0.67.0

Veröffentlicht: Di., 29.09.2026

Laufende Radiotitel erhalten passende Cover, wenn MusicBrainz eine exakte Kombination aus Titel und Interpret findet und das Cover Art Archive ein Frontcover bereitstellt. Die Auflösung verwendet einen identifizierbaren User-Agent, höchstens eine MusicBrainz-Anfrage pro Sekunde und einen Ergebnis-Cache. Ohne sicheren Treffer bleiben Senderlogo oder neutrales Plattensymbol sichtbar.

Die Läuft-gerade-Folie erweitert die bisherigen acht Designs um Split Card und Neon. Coverwechsel werden weich eingeblendet und synchron an Vorschau sowie MAIN übertragen.

## Neu

### Automatische Coverauflösung

Exakte Titel- und Interpretenpaare werden über MusicBrainz gesucht und mit dem passenden Frontcover aus dem Cover Art Archive ergänzt.

### Zehn Läuft-gerade-Designs

Split Card und Neon ergänzen die bisherigen acht Varianten.

## Verbessert

### Sicherer Cover-Fallback

Nur exakte Treffer werden verwendet; andernfalls bleiben Senderlogo oder Plattensymbol sichtbar. Treffer werden zwischengespeichert und Anfragen begrenzt.

---

# GottesdienstRegie 0.66.0

Veröffentlicht: Di., 29.09.2026

Update-Suche und Download laufen unabhängig vom geöffneten Einstellungsfenster im Electron-Hauptprozess weiter. Nach dem erneuten Öffnen werden aktueller Zustand und Downloadfortschritt sofort angezeigt. Ein Download endet durch den ausdrücklichen Abbrechen-Button, einen Fehler oder den erfolgreichen Abschluss.

Radiometadaten folgen jetzt sicheren HTTPS-Weiterleitungen zur eigentlichen Streamadresse. Liefert der Sender ICY-Metadaten, kann Läuft gerade Titel und Interpret anzeigen. Streams ohne Titelinformationen behalten Sendername und Online-Radio als Fallback.

## Verbessert

### Radiotitel über Weiterleitungen

Der Metadatenabruf folgt sicheren HTTPS-Weiterleitungen und zeigt Titel sowie Interpret, wenn der Sender sie übermittelt.

## Behoben

### Update-Fortschritt bleibt erhalten

Das Schließen der Einstellungen beendet weder Suche noch Download; beim erneuten Öffnen wird der aktuelle Fortschritt sofort angezeigt.

---

# GottesdienstRegie 0.65.0

Veröffentlicht: Di., 29.09.2026

Läuft gerade übernimmt Titel, Interpret, Album und vorhandene Cover aus aktiver Hintergrundwiedergabe. Kompatible Radiosender liefern zusätzlich laufende ICY-Metadaten. Acht Designs stehen bereit: Cover links, Cover groß, Minimal, Vinyl, Radio, Verlauf, Typografie und Bühne. Cover- und Albumanzeige sind einzeln steuerbar.

Echte Wiedergabedaten und ein Bereitschaftszustand ersetzen die doppelte Platzhalterdarstellung. Die Option Folie überspringen, wenn gerade nichts läuft hält das Element im Ablauf, ohne bei inaktiver Wiedergabe eine leere Folie auszugeben. Bei neuen Läuft-gerade-Elementen ist sie standardmäßig aktiviert.

## Neu

### Acht Läuft-gerade-Designs

Cover links, Cover groß, Minimal, Vinyl, Radio, Verlauf, Typografie und Bühne stehen direkt im Elementeditor zur Auswahl.

### Automatisch überspringen

Eine Checkbox überspringt die Folie automatisch, wenn gerade kein Audio läuft.

## Verbessert

### Live-Radiodaten

Unterstützte Radiosender reichen laufenden Titel und Interpreten direkt an die Läuft-gerade-Folie weiter.

## Behoben

### Keine doppelte Platzhalterzeile

Die Folie zeigt echte Wiedergabedaten oder einen klaren Bereitschaftszustand statt zweimal „Läuft gerade“.

---

# GottesdienstRegie 0.64.0

Veröffentlicht: Di., 29.09.2026

MAIN-Schnellaktionen zeigen ihr funktionierendes Tastenkürzel unten links; der Bibelzugriff bleibt auf F9. Loop-Elemente sind im Menü Element hinzufügen immer erreichbar. Aus einem normalen Gottesdienstbereich werden sie sicher im Vorprogramm angelegt; die Platzierungsregel für Ankommen und Gottesdienst bleibt wirksam.

Die On-Screen Bible übernimmt Stil, Akzentfarbe, Referenzposition und Geschwindigkeit aus zentralen OSB-Einstellungen. Einzelvorschau und MAIN nutzen denselben 16:9-Renderer. Lange Stellen werden auf Seiten verteilt, die in der Regie vor- und zurückgeschaltet werden; MAIN folgt der gewählten Seite. Beim Bearbeiten verdeckt die Bibel-Schnellanzeige den Editor nicht mehr, und gelieferte Schreibweisen wie GOtt werden als Gott normalisiert.

## Neu

### Tasten direkt sichtbar

MAIN-Schnellaktionen zeigen ihr Tastenkürzel klein unten links und lassen sich darüber auslösen.

### Mehrseitige Bibeltexte

Lange Stellen werden lesbar aufgeteilt und in der Regie synchron vor- und zurückgeschaltet.

## Verbessert

### OSB-Design durchgängig

Bibeleinblendung, Einzelvorschau und MAIN übernehmen dieselben zentralen Stil-, Farb- und Positionswerte.

### Loop-Elemente immer erreichbar

Loop-Elemente bleiben im Hinzufügen-Menü auswählbar und werden sicher einem zulässigen Loop-Bereich zugeordnet.

## Behoben

### Bibeltext im Editor

Beim Wechsel zu Bearbeiten verdeckt die Bibel-Schnellanzeige den Editor nicht mehr; „Gott“ wird korrekt geschrieben.

---

# GottesdienstRegie 0.63.0

Veröffentlicht: Di., 29.09.2026

Der allgemeine KI-Helfer samt Einstellungen und Laufzeit wird entfernt; getrennte Medien- und Übersetzungsfunktionen bleiben verfügbar. Die On-Screen Bible erhält zentrale Einstellungen unter Präsentation → MAIN Schnellanzeigen → OSB: Standard- und alternative Übersetzung, sechs Stile und Farben, Bucheinleitung, Referenzdarstellung und -position sowie Geschwindigkeit. F9 nutzt die gespeicherten Gerätewerte, ohne die normale Folienposition zu verändern; die Einstellungsvorschau bleibt lokal.

Unterstützte ICY-Radiostreams zeigen Titel und Interpret. Fehlerhafte oder übergroße Metadaten werden ohne Audiounterbrechung verworfen. Das Lautsprechersymbol öffnet eine kompakte Liste zum Entfernen, Nachladen und Umschalten von Shuffle. Element hinzufügen trennt allgemeine und Loop-Elemente; Läuft gerade kommt als gestaltbare Loop-Folie hinzu.

## Neu

### Zentrale OSB-Einstellungen

Sechs Stile, sechs Farben, Referenzposition und Animation werden geräteweit festgelegt und von F9 automatisch verwendet.

### Live-Radiotitel

Unterstützte Radiosender zeigen Titel und Interpret direkt im Audiofenster.

### Läuft-gerade-Folie

Vor- und Nachprogramm erhalten eine frei gestaltbare „Läuft gerade“-Loop-Folie.

## Verbessert

### Audio direkt verwalten

Das Lautsprechersymbol öffnet eine kompakte Titelliste mit Shuffle, Entfernen und Nachladen.

### Elemente klar gruppiert

Das Hinzufügen-Menü trennt allgemeine Elemente von Vor- und Nachprogramm und schließt sich außerhalb automatisch.

## Behoben

### KI-Helfer entfernt

Der fehleranfällige allgemeine KI-Helfer samt Einstellungen und Laufzeit wurde entfernt; Medien- und Übersetzungsfunktionen bleiben erhalten.

---

# GottesdienstRegie 0.62.0

Veröffentlicht: Mo., 28.09.2026

Die Windows-Installer-Bedingungen werden im erwarteten Unicode-Format erzeugt, sodass Umlaute und Sonderzeichen lesbar bleiben. Der KI-Helfer erkennt lokale Modellantworten auch mit vorangestellten Prompts, Codeblöcken oder Begleittext. Interne Anweisungen und ungültige Rohantworten gelangen nicht in den Chat; bei ungültiger Antwort bleibt Wiederholen verfügbar.

Die MAIN-Vorschau zeigt die Folie ohne zusätzliche rote LIVE-Plakette. Die Bibelanzeige verwendet ein responsives Buchdesign mit Schreib-, Tinten- und Seitenwechselanimationen; reduzierte Bewegung zeigt den vollständigen Text sofort. Spotify-Titellinks laden Name und Bild aus der öffentlichen Linkvorschau, speichern bereinigte Metadaten und öffnen den Titel ausschließlich nach ausdrücklichem Klick extern in Spotify.

## Neu

### Spotify-Titellinks

Spotify-Titellinks laden eine sichere Vorschau, lassen sich lokal speichern und werden nur nach ausdrücklichem Klick extern geöffnet.

### Neue Bibelanzeige

Bibelstellen erscheinen in einem responsiven Buchdesign mit Schreib-, Tinten- und Seitenwechselanimationen sowie vollständiger Unterstützung für reduzierte Bewegung.

## Verbessert

### Robuster KI-Helfer

Prompt-Wiederholungen und Begleittext lokaler Modelle bleiben verborgen; nur sicher geprüfte Antworten erscheinen im Chat.

### Saubere MAIN-Vorschau

Die aktive MAIN-Folie wird ohne zusätzliche rote LIVE-Plakette dargestellt.

## Behoben

### Lesbare Installer-Bedingungen

Unicode-Encoding verhindert fehlerhafte Umlaute und Sonderzeichen in den Windows-Nutzungsbedingungen.

---

# GottesdienstRegie 0.61.0

Veröffentlicht: Mo., 28.09.2026

Die gepackte Anwendung findet ihre Oberfläche unabhängig vom TypeScript-Ausgabeverzeichnis und bietet bei Ladefehlern Wiederholen an. ON AIR und Testbetrieb beginnen nach derselben Auswahlregel auf der ersten aktiven Folie: Vorprogramm, Warm-up, Gottesdienst und Nachprogramm. Vor- und Nachprogramm bleiben zwingende Loops und behalten beim Hinzufügen ihr Ziel.

Audiozustände erscheinen nur am Lautsprechersymbol statt als gefärbte Ablaufzeilen. Stoppunkte können direkt an Abschnitten gesetzt und reine Bedientöne unabhängig von Medien abgeschaltet werden. Die optionale Spotify-Verbindung verwendet PKCE und verschlüsselt gespeicherte Token außerhalb der Präsentation. Titel werden als bereinigte Verknüpfungen gespeichert und manuell in Spotify geöffnet; Spotify-Audio wird weder heruntergeladen noch automatisch abgespielt oder übertragen.

## Neu

### Spotify-Verknüpfungen

Spotify verbinden, Titel suchen, Verknüpfungen speichern und manuell öffnen – ohne automatische Wiedergabe.

## Verbessert

### Präzise Audiosteuerung

Audiozustände nur am Lautsprecher, Abschnitts-Stopppunkte und abschaltbare Bedientöne.

## Behoben

### Zuverlässiger Programmstart

Saubere Pakete laden die Oberfläche korrekt und bieten bei Fehlern Wiederholen an.

---

# GottesdienstRegie 0.60.0

Veröffentlicht: Mo., 28.09.2026

Der integrierte KI-Helfer verarbeitet Fragen, Entwürfe und strukturierte Präsentationsänderungen nach dem gewählten Modellprofil. Elf Schnellaktionen unterstützen Planung, Texte, Ankündigungen, Bibel- und Songideen, Prüfung, Übersetzung, vorhandene Medien, Moderation, Gebete und Stil. Modell, Bestätigungsmodus und Berechtigungen lassen sich einstellen.

Persönliche Notizen, Zugangsdaten und lokale Pfade bleiben außerhalb des Modellkontexts. Geprüfte Änderungen werden als Vorschau oder auf ausdrücklichen Wunsch direkt angewendet, atomar gespeichert und über die gemeinsame Historie rückgängig gemacht. Die Desktop-App lädt ein fest versioniertes Modell mit sichtbarem Fortschritt; danach arbeitet der Helfer offline. Download, Aktualisierung, Entfernung und Chatverlauf sind verwaltbar. Nicht unterstützte Browser verweisen auf die Desktop-App.

## Neu

### Lokaler KI-Helfer

Elf Schnellaktionen und freie Aufträge helfen bei Ablauf, Texten, Ankündigungen, Bibel- und Songideen, Übersetzungen, Moderation, Gebeten und Stil.

### Modelleinstellungen

Automatische Modellwahl, Bestätigungsmodus, Berechtigungen, Downloadfortschritt, Aktualisierung, Entfernung und Verlauf lassen sich verwalten.

## Verbessert

### Kontrollierte Änderungen

Vorschläge werden geprüft, als Vorschau gezeigt und atomar über die gemeinsame Rückgängig-Historie angewendet.

### Privat und offline

Persönliche Notizen, Geheimnisse und lokale Pfade bleiben außerhalb des Modellkontexts. Nach dem Download arbeitet der Helfer offline.

---

# GottesdienstRegie 0.59.0

Veröffentlicht: Sa., 26.09.2026

Version 0.59.0 kennzeichnet laufendes Hintergrund-Audio über alle betroffenen Folien, ergänzt eindeutige Stop-Cues und erweitert die lokale Bild- und Videoerstellung um Format-, Qualitäts- und Bewegungsoptionen.

## Neu

### Audioverlauf im Ablauf

Eine dezente blaue Kennzeichnung folgt dem geplanten Hintergrund-Audio vom Start über alle betroffenen Elemente und Folien bis zum konfigurierten Ende.

### Erweiterte Medienerstellung

Seitenverhältnis, Qualitätsstufe, Negativbeschreibung und drei Video-Bewegungsarten stehen direkt im KI-Motiv-Arbeitsbereich bereit.

## Verbessert

### Eindeutige Audio-Stopps

Stop-Cues erscheinen rot mit Lautsprecher und X. Neues Audio am selben Element löst einen alten Stop-Cue automatisch auf.

### Mehr Varianten

Neue Seeds, Ausschnitte, Farbabstimmungen und Bewegungsprofile erzeugen klarer unterscheidbare Bild- und Videovarianten.

---

# GottesdienstRegie 0.58.0

Veröffentlicht: Sa., 26.09.2026

Version 0.58.0 ergänzt eine globale Vorschau-Audioregel, einen sicheren Folien-Dauermodus, mehr gruppierte Bibelübersetzungen, einen responsiven Bibeldialog und vollständig lokalisierte Nutzungsansichten.

## Neu

### Audio nur bei ON AIR

Eine standardmäßig aktive Einstellung erlaubt Radio und Background Audio in der Vorschau. Wird sie ausgeschaltet, startet automatische Wiedergabe erst bei ON AIR; manuelles Vorhören bleibt möglich.

### Folien-Dauermodus

Der Zeitkreis kann angeklickt werden, um automatisches Weiterschalten bis zu einem erneuten Klick auszusetzen.

## Verbessert

### Mehr Bibelübersetzungen nach Sprache

Worker und öffentlicher Katalog werden zusammengeführt, doppelte Ausgaben entfernt und die Auswahl nach Sprache gruppiert.

### Lokalisierte Bedingungen

Alle Anwendungssprachen erhalten lokalisierten Abschnittsinhalt in App und Webansicht.

## Behoben

### Bibeldialog bleibt im Fenster

Feste Kopf- und Fußbereiche sowie getrennt scrollbare Inhalte verhindern abgeschnittene Felder und Aktionen.

### Radiosuche schnell leeren

Ein X direkt im Suchfeld entfernt den eingegebenen Text.

---

# GottesdienstRegie 0.57.0

Veröffentlicht: Sa., 26.09.2026

Version 0.57.0 ordnet Zeitsteuerung und Tastaturnavigation in der Einzelvorschau neu, baut Radiosender als eigenständigen Dialog aus und zeigt lange Bibelstellen in einer bildschirmgerechten, animierten Buchansicht. Die Online-Nutzungsbedingungen erhalten außerdem einen Sprachumschalter für alle Anwendungssprachen.

## Neu

### Mehrseitige Bibelanzeige

Bibeltexte erscheinen auf einem eigenständigen Buchhintergrund mit responsiver Typografie und dezenter Seitenanimation. Lange Stellen werden nur zwischen Versen getrennt und lassen sich im Bedienbereich manuell vor- und zurückschalten.

### Radio-Wiedergabestatus

Der eigenständige Radiosender-Dialog zeigt Laden, Wiedergabe und Fehler am unteren Rand. Verfügbare Senderbilder und vom System gemeldete Live-Titel werden dort ebenfalls dargestellt.

## Verbessert

### Vorschau ohne Fokus navigieren

Linke und rechte Pfeiltaste wechseln Folien nun auch ohne vorherigen Klick in die Vorschau. Eingabefelder, Editoren und geöffnete Dialoge bleiben davon ausgenommen.

### Sprachumschalter für Nutzungsbedingungen

Die App öffnet die Nutzungsbedingungen passend zur gewählten Softwaresprache. Die Webfassung bietet alle siebzehn Anwendungssprachen in einer eigenen Auswahl und berücksichtigt automatisch die Browsersprache.

## Behoben

### Zeitkreis außerhalb der Folie

Der verkleinerte Zeitkreis besitzt jetzt eine eigene rechte Navigationsschiene und kann den sichtbaren Folienbereich nicht mehr überdecken.

### Kompakter Bibeldialog und klares Lautsprechermenü

Der Bibeldialog passt sich kleineren Bildschirmhöhen an und hält Vorschau sowie Aktionen erreichbar. Radiosender öffnen am Lautsprecher ohne Audiobrowser-Hinweise; der zusätzliche Audio-Einstellungen-Eintrag wurde entfernt.

---

# GottesdienstRegie 0.56.0

Veröffentlicht: Sa., 26.09.2026

Version 0.56.0 bindet den bereitgestellten Bibelstellen-Worker unverändert als bevorzugte Quelle ein, ordnet Bücher im gemeinsamen Suchfeld nach Altem und Neuem Testament und behält einen automatischen Rückfall bei. Außerdem wurden der Audiobrowser repariert, Radiosender direkt am Lautsprecher erreichbar gemacht, die Elementauswahl für den Gottesdienst korrigiert, die Schnellanzeige Ohne Text abgesichert und ein grafischer Zeitkreis in der Einzelvorschau ergänzt.

## Neu

### Bibelbücher nach Testament

Die Buchsuche bleibt in einer gemeinsamen Box und trennt ihre Treffer dort klar in Altes und Neues Testament. Übersetzungen und Bibeltexte werden über den öffentlichen Worker geladen; fällt er aus, versucht die Anwendung weiterhin die bisherige freie Quelle.

### Grafischer Folien-Zeitkreis

Zeitgesteuerte Folien zeigen in der Einzelvorschau links neben dem rechten Navigationspfeil einen schlichten Kreis, dessen Umfang mit der verbleibenden Zeit abnimmt. Der Kreis enthält bewusst weder Text noch Symbol und beeinflusst die Ausgabe nicht.

## Verbessert

### Radiosender am Lautsprecher

Das Lautsprechermenü bietet neben Audiobrowser, Import und Einstellungen nun direkt Radiosender an. Die Auswahl öffnet die vorhandene Onlinesuche als Popup, in dem Streams gesucht, vorgehört und zur Playlist hinzugefügt werden können.

### Ausführlichere Nutzungsbedingungen

Alle achtzehn Regelungsbereiche wurden erweitert und erläutern Zuständigkeiten, Liveprüfung, Medienrechte, Drittanbieter, Synchronisierung, Sicherungen, Updates und Haftung genauer. App, Installer und eigenständige Webfassung werden weiterhin aus derselben Textquelle erzeugt.

## Behoben

### Audiobrowser ohne leere obere Fläche

Eine widersprüchliche Grid-Zuordnung reservierte im Auswahlfenster eine große leere Fläche und schob Treffer sowie Details nach unten. Der Audiobrowser verwendet jetzt durchgehend seine vorgesehenen Zeilen und bleibt bei leeren Filtern vollständig bedienbar.

### Sichere Element- und Schnellanzeigenauswahl

Der zentrale Plus-Button zielt eindeutig auf den Gottesdienst und zeigt dort sämtliche normalen Elemente; die zusätzlichen Plus-Schaltflächen neben Vor- und Nachprogramm wurden entfernt. Ohne Text bleibt sichtbar, ist ohne ausblendbare Folieninhalte jedoch gesperrt und erklärt den Grund beim Darüberfahren.

---

# GottesdienstRegie 0.55.0

Veröffentlicht: Sa., 26.09.2026

Version 0.55.0 erweitert die MAIN-Bibelanzeige um einen dynamischen Katalog mit wesentlich mehr frei verfügbaren Übersetzungen, Suchvorschläge für Ausgaben und Bücher sowie gültige Kapitel- und Versbereiche. Gleichzeitig behebt das Update den Absturz beim Start des Testbetriebs, stellt verdeckte Elementmenüs wieder her, macht die Radiosuche durch mehrere Ausweichserver belastbarer und verlinkt die eigenständige Onlinefassung der Nutzungsbedingungen direkt im Hilfemenü.

## Neu

### Durchsuchbarer Bibel-Katalog

Übersetzungen werden aus dem öffentlichen GetBible-Katalog geladen und können nach Name, Sprache oder Kürzel gefiltert werden. Luther 1545 bleibt voreingestellt; bei einem Netzfehler bleibt die integrierte Grundauswahl verfügbar.

### Vorschläge für Stelle und Bereich

Bücher werden über deutsche und englische Namen sowie übliche Kürzel gefunden. Kapitel folgen den Grenzen des ausgewählten Buchs; Kapitel und Verse bieten nummerische Vorschläge und werden vor MAIN anhand der geladenen Vorschau geprüft.

## Verbessert

### Radiosuche mit Ausweichservern

Mehrere öffentliche Radio-Browser-Knoten werden nacheinander verwendet. Suche per Enter, verständliche Leer- und Fehlermeldungen sowie die vorhandene Vorschau erleichtern das Hinzufügen eines erreichbaren HTTPS-Streams.

### Nutzungsbedingungen direkt erreichbar

Das Hilfemenü in Desktop- und Webversion öffnet die getrennte öffentliche Seite der Nutzungsbedingungen direkt.

## Behoben

### Testbetrieb startet ohne Revisionsfehler

Die Ausgaberevision wird einer sicheren Kopie hinzugefügt, statt einen eingefrorenen Renderzustand zu verändern. Dadurch tritt der Fehler „object is not extensible“ nicht mehr auf.

### Elemente wieder sichtbar

Die Elementauswahl verwendet bei fehlender Abschnittszuordnung einen sicheren Standardbereich und bleibt auch in schmalen Ansichten vollständig sichtbar.

### Radio bleibt bei Serverausfall nutzbar

Ein nicht erreichbarer erster Suchserver blockiert die Funktion nicht mehr; die Suche wechselt automatisch zum nächsten Knoten.

---

# GottesdienstRegie 0.54.0

Veröffentlicht: Fr., 25.09.2026

Version 0.54.0 führt eine sprachabhängige Rechtschreibprüfung mit Korrekturmenü ein, hält Vorschau und MAIN über versionierte Renderzustände deckungsgleich, erzeugt deutlichere KI-Motivvarianten und ersetzt die bisher kaum nutzbare Bibelanzeige durch einen vollständigen Auswahl-, Vorschau- und Liveablauf.

## Neu

### Neue Bibel-Schnellaktion für MAIN

Ein Klick auf „Bibel einblenden“ öffnet nun zuerst einen eigenen Dialog. Buch, Kapitel, Versbereich und Übersetzung werden getrennt gewählt; der echte Text wird geladen, zwischengespeichert, vollständig geprüft und erst nach Bestätigung als temporäre MAIN-Ebene angezeigt. Luther 1545 ist voreingestellt, weitere freie deutsche und englische Ausgaben stehen direkt bereit.

### Rechtschreibprüfung folgt der gewählten Sprache

Die Desktop-Rechtschreibprüfung wechselt gemeinsam mit der Anwendungssprache. Unbekannte Wörter werden rot markiert; das Kontextmenü zeigt höchstens sechs Vorschläge sowie Schreibweise lernen, Google-Suche, Rückgängig, Wiederholen, Ausschneiden, Kopieren, Einfügen und Alles auswählen.

## Verbessert

### Vorschau und MAIN verwenden denselben aktuellen Zustand

Änderungen an einer bereits live geschalteten Folie lösen jetzt ebenfalls eine neue MAIN-Ausgabe aus. Jede Ausgabe trägt eine fortlaufende Revision; verspätete ältere Zustände werden ignoriert. Temporäre Bibelanzeigen bleiben während normaler Folienaktualisierungen sichtbar und lassen sich gezielt zur aktuellen MAIN-Folie zurücksetzen.

### Deutlichere KI-Motivvarianten

Wiederholte Generierungen derselben Beschreibung verwenden einen stabilen Variantengenerator statt einer anfälligen Zeichensumme. Farbwerte, Ausschnitt, Verschiebung, Zoom, leichte Drehung und Spiegelung unterscheiden sich dadurch sichtbar, ohne Szene oder Stil zu verlassen.

### Nutzungsbedingungen als Aufzählung

Regelungen erscheinen in Anwendung, Installertext und Webansicht als ruhige Aufzählungen mit Gedankenstrichen beziehungsweise Listenpunkten statt als Folge einzelner Absätze.

## Behoben

### Präsentationsnotizen mit Escape schließen

Der modale Editor für Präsentationsnotizen reagiert jetzt zuverlässig auf Escape und gibt die darunterliegende Oberfläche erst nach dem Schließen wieder frei.

### Keine leere Bibelanzeige mehr

Die bisherige Schnellaktion konnte eine inhaltslose Bibelkonfiguration direkt an MAIN senden, weil nur wenige lokale Beispielstellen existierten. Der neue Ablauf verlangt erfolgreich geladene Vorschauinhalte und zeigt bei Netzwerk- oder Stellenfehlern eine verständliche Wiederholen-Aktion.

---

# GottesdienstRegie 0.53.0

Veröffentlicht: Fr., 25.09.2026

Version 0.53.0 startet ON AIR verlässlich mit der ersten aktiven Folie, stabilisiert die Bibel-Schnellanzeige, gibt der KI-Motiverstellung mindestens acht Sekunden sichtbare Arbeitszeit und reduziert entbehrliche Statusangaben sowie Schatten.

## Verbessert

### Mindestens acht Sekunden KI-Erstellung

Ein erfolgreiches KI-Motiv erscheint frühestens acht Sekunden nach dem Start. Spinner und wechselnde Statusmeldungen bleiben bis dahin sichtbar; Fehler erscheinen weiterhin unverzüglich.

### Ruhigere Bedienoberfläche

Folien-, Song- und Elementmengen, der rote ON-AIR-Punkt, die MAIN-ON-AIR-Markierung, der obere Vorschautimer und der doppelte Menüpunkt Medienverwaltung wurden entfernt. Dialoge und Popups verwenden keine Schatten mehr; Favoriten zeigen einen ausgefüllten Stern.

## Behoben

### ON AIR beginnt am Ablaufanfang

Der Start ignoriert die aktuelle Editor- oder Vorschauauswahl und verwendet immer die erste aktive Folie des ersten aktiven Elements, auch im Vorprogramm oder Ankommen.

### Bibeltext lässt sich wieder einblenden

Die voreingestellte Stelle Johannes 3,16 wird im lokalen Paket korrekt gefunden. Falls ON AIR noch nicht aktiv ist, startet der sichere Live-Ablauf zuerst und sendet den bestätigten Bibeltext danach als unabhängige MAIN-Schnellanzeige.

---

# GottesdienstRegie 0.52.1

Veröffentlicht: Fr., 25.09.2026

Version 0.52.1 behebt die Veröffentlichung der öffentlichen Versionshinweise. Die Einträge 0.50.0, 0.51.0 und 0.52.0 waren zwar in der Anwendung und im Release enthalten, die Webseite wurde nach 0.49.0 jedoch nicht mehr neu bereitgestellt.

## Verbessert

### Webseite folgt künftig jedem Release

Neben Aktualisierungen des Hauptbranches löst nun auch jeder Versions-Tag die Veröffentlichung der Release-Notes-Webseite aus. Damit gelangen neue Hinweise zusammen mit den Installationsdateien online.

## Behoben

### Versionen ab 0.50.0 nachgetragen

Die öffentliche Übersicht enthält wieder lückenlos 0.49.0, 0.50.0, 0.51.0, 0.52.0 und die aktuelle Version 0.52.1 einschließlich der ausführlichen deutschen und englischen Beschreibungen.

---

# GottesdienstRegie 0.52.0

Veröffentlicht: Fr., 25.09.2026

Version 0.52.0 erzeugt sichtbar unterschiedliche Motivvarianten, repariert das Löschen lokaler Medien, begrenzt Notizen auf 5.000 Zeichen und erlaubt gezielte ON-AIR-Wechsel zwischen den Programmabschnitten.

## Neu

### ON-AIR per Klick wechseln

In der Vorschau schaltet ein Klick, im Bearbeitungsmodus ein Doppelklick das gewählte Element live. Abschnittstitel führen per Doppelklick zum ersten aktiven Inhalt.

## Verbessert

### Neue Motivvarianten und kompaktere Vorschau

Ausschnitt, Skalierung und Farbgebung variieren zwischen Aufträgen. Die leere Vorschau verwendet nur noch eine kleine Beschriftung und das Beschreibungswerkzeug ein Aktualisieren-Symbol.

### Notizen bis 5.000 Zeichen

Der Zähler rechts unten zeigt die aktuelle Länge; Eingabe und Speicherung halten dieselbe feste Grenze ein.

## Behoben

### Medien lassen sich wieder löschen

Lokale Dateien werden lokal entfernt; nur synchronisierte Medien verwenden den Cloud-Löschpfad und dessen Schutzprüfungen.

---

# GottesdienstRegie 0.51.0

Veröffentlicht: Fr., 25.09.2026

Version 0.51.0 korrigiert das Layout der KI-Motive-Seite, zeigt beim Erstellen einen kleinen Spinner und speichert ein Ergebnis erst nach deiner ausdrücklichen Bestätigung in der Medienbibliothek.

## Neu

### Ergebnisentscheidung

Nach der Erstellung bleibt das tatsächliche Bild oder Video als Vorschau stehen. „Neu generieren“ verwirft es zugunsten einer neuen Variante; „In Medienbibliothek speichern“ legt genau dieses Ergebnis dauerhaft ab.

## Verbessert

### Kompaktere KI-Motive-Seite

Spaltenbreiten, Innenabstände, Formulargruppen und die 16:9-Vorschau sind sauber ausgerichtet. Ein kleiner Spinner informiert direkt im Vorschaubereich über die laufende Erstellung.

## Behoben

### Keine unbeabsichtigten Bibliothekseinträge

Generieren allein verändert die Medienbibliothek nicht mehr. Erst die Speicheraktion schreibt die Datei samt KI-Kennzeichnung dauerhaft in den lokalen Medienspeicher.

---

# GottesdienstRegie 0.50.0

Veröffentlicht: Fr., 25.09.2026

Version 0.50.0 gestaltet KI-Motive und Mediendetails neu, erweitert den Editor für Präsentationsnotizen und macht Vor- sowie Nachprogramm zu verlässlichen, nicht abschaltbaren Schleifen.

## Neu

### Erweiterter Notizeneditor

Absatzformate, Zitate, Durchstreichen, drei Ausrichtungen, Einzüge, Textfarbe und Formatbereinigung ergänzen die vorhandenen Werkzeuge in einem sicheren modalen Dialog.

## Verbessert

### KI-Motive und Mediendetails neu geordnet

Der Generator verwendet eine sichtbare zweigeteilte Arbeitsfläche mit Vorschau. Mediennamen werden erst nach einem Klick bearbeitet; KI-Herkunft erscheint direkt nach dem Dateiformat.

## Behoben

### Verpflichtende Vor- und Nachprogramm-Schleifen

Der abschaltbare LOOP-Schalter wurde entfernt. Neue und geladene Präsentationen halten beide Bereiche technisch im Schleifenbetrieb; die Elementauswahl bleibt vollständig sichtbar und die Amen-Animation sitzt mittig.

---

# GottesdienstRegie 0.49.0

Veröffentlicht: Fr., 25.09.2026

Der Startbildschirm erscheint wieder schmal und mittig auf dem vorgesehenen Monitor mit bis zu 410 × 700 Pixeln. Logo, Ladefortschritt, Synchronisierung überspringen und Schließen bleiben erreichbar. Die kompakte Größe wird nicht als normale Fensterposition gespeichert.

Sobald Konto, Gerät und Arbeitsbereich bereit sind, wird dasselbe Fenster auf die gespeicherte Desktop-Größe erweitert; Vergrößern, Maximieren und der Startmodus werden aktiviert. Falls das Bereitsignal ausbleibt, aktiviert ein 30-Sekunden-Sicherheitsweg den großen Arbeitsbereich.

## Verbessert

### Sauberer Fensterübergang

Das Startfenster ist auf dem vorgesehenen Monitor mittig platziert. Nach dem Bereitsignal werden Mindestgröße, Vergrößerbarkeit, Maximierung und gespeicherter Startmodus gemeinsam aktiviert.

## Behoben

### Startansicht nicht mehr bildschirmfüllend

Die Ladeansicht verwendet wieder bis zu 410 × 700 Pixel statt der späteren Desktop-Abmessungen. Ein Sicherheitszeitgeber verhindert zugleich ein dauerhaft kleines Bedienfenster.

---

# GottesdienstRegie 0.48.0

Veröffentlicht: Fr., 25.09.2026

Version 0.48.0 startet immer in einer verwendbaren Desktop-Größe, verbindet Web- und Desktop-Ausgabe, modernisiert die Medienbibliothek und ergänzt eine sichere Bibeltext-Schnellanzeige für MAIN.

## Neu

### Bibeltext anzeigen

Bibelstellen können gesucht, in Luther 1912 oder einer installierbaren freien Übersetzung vorab geprüft und anschließend als unabhängige MAIN-Schnellanzeige eingeblendet werden.

### Verknüpfte Web- und Desktop-Version

Die Desktop-App öffnet den Web-Editor; der Web-Editor verweist direkt auf den aktuellen Desktop-Download.

## Verbessert

### Medienbibliothek und KI-Motive

Großansicht, validierte Namen bis 300 Zeichen, KI-Herkunft, echte zuletzt verwendete Medien sowie 15 zugängliche Erstellungsphasen und eine Wiederholen-Aktion beschleunigen den Medienworkflow.

## Behoben

### Fenster bleibt nicht mehr klein

Das Hauptfenster erhält vor dem Laden gültige Desktop-Abmessungen und ist unabhängig vom Renderer-Bereitsignal vergrößerbar.

### MAIN-Schnellanzeige bleibt stabil

Folienwechsel und zugehörige Countdown-Timer ersetzen eine aktive Bibel- oder andere Schnellanzeige nicht mehr.

---

# GottesdienstRegie 0.47.0

Veröffentlicht: Fr., 25.09.2026

Version 0.47.0 entfernt die starre 220-Zeichen-Grenze der Update-Karte. Lange Versionsbeschreibungen bleiben bis zum Ende der angezeigten Absätze erhalten und werden innerhalb der verfügbaren Breite sauber umgebrochen.

## Verbessert

### Robuste Aufbereitung von Versionshinweisen

Klartext, Markdown und HTML werden einheitlich aufbereitet. Überschriften werden ausgelassen, während die ersten beiden inhaltlichen Absätze vollständig sichtbar bleiben.

## Behoben

### Kein abgeschnittener Text mehr

Die bisherige feste Grenze von 220 Zeichen konnte Sätze mitten im Wort beenden. Sie wurde entfernt; normale und besonders lange Wörter brechen nun innerhalb der Update-Karte um, ohne verborgen zu werden.

---

# GottesdienstRegie 0.46.0

Veröffentlicht: Fr., 25.09.2026

Version 0.46.0 veröffentlicht erstmals den gemeinsamen GottesdienstRegie-Editor als native Browser-Vorschau. Präsentationen werden lokal und revisionsgeschützt im Browser gespeichert. Responsive Arbeitsbereiche ermöglichen die Vorbereitung auf PC, Tablet und Smartphone, während Liveausgaben weiterhin sicher der Desktop-App vorbehalten bleiben.

## Neu

### Web-Editor ohne Installation

Der Editor startet direkt im Browser, legt beim ersten Öffnen eine lokale Präsentation an und lädt sie beim nächsten Besuch wieder. Der Browser-Build benötigt keine Electron-Bridge.

### Touch-Navigation

Tablet und Smartphone erhalten eine Navigation für Ablauf, Song, Folie und Vorschau mit großen Touchzielen und sicheren Bildschirmrändern.

## Verbessert

### Klare Plattformgrenzen

Der Web-Editor erklärt sichtbar, dass MAIN, STAGE, Livestream und Gerätefunktionen die installierte Desktop-App benötigen. Die gemeinsame Plattformarchitektur verhindert undefinierte Electron-Aufrufe im Browser.

## Behoben

### Revisionsgeschützte lokale Speicherung

Lokale Präsentationen erhalten fortlaufende Revisionen. Eine ältere Grundfassung kann einen neueren Stand nicht unbemerkt überschreiben.

## Bekannte Einschränkungen

### Noch keine geräteübergreifende Synchronisierung

Diese erste Vorschau speichert Präsentationen und persönliche Notizen ausschließlich im aktuellen Browserprofil. Cloud-Anmeldung, Team-Synchronisierung und Fernsteuerung folgen getrennt, damit Live- und Konfliktsicherheit unabhängig geprüft werden können.

---

# GottesdienstRegie 0.45.1

Veröffentlicht: Fr., 25.09.2026

Persönliche Präsentations- und Foliennotizen zeigen nun für Ruhe, Speichern, Erfolg und Fehler jeweils ein passendes Symbol. Die laufende Punktanzeige macht den Speichervorgang sichtbar; die Erfolgsbestätigung verschwindet nach höchstens fünf Sekunden wieder.

## Verbessert

### Verständlicher Speicherablauf

Im privaten Ruhezustand steht das Schloss. Während des Speicherns erscheint ein Synchronisationssymbol mit einem, zwei und drei Punkten. Ein Haken bestätigt die erfolgreiche Speicherung kurzzeitig; Fehler bleiben bis zum nächsten Versuch sichtbar.

## Behoben

### Robuste Zeitsteuerung und Screenreader-Ausgabe

Neue Eingaben beenden veraltete Timer. Beim Schließen werden alle ausstehenden Vorgänge bereinigt. Screenreader erhalten während der visuellen Animation eine stabile Meldung und reduzierte Bewegung wird berücksichtigt.

---

# GottesdienstRegie 0.45.0

Veröffentlicht: Mo., 21.09.2026

Version 0.45.0 vervollständigt die visuelle Sprachauswahl und korrigiert mehrere Wechselwirkungen des Präsentationsnotizen-Dialogs. Jede im Übersetzer angebotene Sprache besitzt nun eine lokal gebündelte, SVG-basierte repräsentative Länderflagge. Der Notizen-Dialog liegt als echte oberste Modalebene über dem Editor, blendet dessen Formatierungsleiste aus und sperrt sämtliche Mausbewegungen im darunterliegenden Canvas. Zusätzlich wurden die Notizen-Symbole und die Hilfe-Schaltfläche der Veranstaltungsverknüpfung verbessert.

## Neu

### Flaggen für den gesamten Sprachkatalog

Nicht nur die Standardsprachen, sondern auch alle weiteren auswählbaren Übersetzungssprachen zeigen jetzt eine passende Flagge. Die Grafiken werden als lokale SVG-Ressourcen mit der Anwendung ausgeliefert und benötigen weder Emoji-Unterstützung noch eine Internetverbindung.

## Verbessert

### Klarere Notizen-Werkzeuge

Vor dem Datenschutzhinweis steht nun ein Schloss-Symbol. Rückgängig und Wiederholen erscheinen als eindeutige Symbole mit zugänglichen Beschriftungen und Tooltips.

### Hilfe zur Veranstaltungsverknüpfung ausgerichtet

Die Hilfe-Schaltfläche sitzt in einer eigenen festen Rasterspalte rechts neben der Veranstaltung und ist unabhängig von Textlänge und Anzeigegröße vertikal zentriert.

## Behoben

### Editorleiste hinter Notizen

Beim Öffnen der Präsentationsnotizen bleibt die Textformatierungsleiste des Folieneditors nicht mehr sichtbar. Der Dialog wird direkt unterhalb des Dokumentkörpers gerendert und kann nicht von lokalen Stapelkontexten der Seitenleiste eingeschränkt werden.

### Keine Bearbeitung hinter einem Dialog

Die Anwendung unterhalb des Notizen-Dialogs erhält keine Mausereignisse mehr. Auch globale Canvas-Bewegungen prüfen den Modalzustand, brechen laufende Ziehvorgänge ab und verhindern so das versehentliche Verschieben oder Skalieren von Elementen.

---

# GottesdienstRegie 0.44.0

Veröffentlicht: Mo., 21.09.2026

Version 0.44.0 hebt die Standardgröße der Bedienoberfläche behutsam um zehn Prozent an. Navigation, Menüs, Schaltflächen, Symbole und allgemeine Beschriftungen sind dadurch leichter erfassbar, während Eingabefelder ihre bisherigen festen Abmessungen behalten und mehr Inhalt nicht unnötig verdrängt wird. Vorschau, MAIN, STAGE, Livestream, Recording und alle anderen Ausgabefenster bleiben unverändert.

## Verbessert

### Leicht vergrößerter Standard

Die bisherige fünfstufige Anzeigegröße startet nun auf der Stufe „Groß“ mit Faktor 1,1. Das gilt nach dem Update einmalig auch für bestehende Installationen; anschließend kann die Größe wie gewohnt zwischen Sehr klein, Klein, Standard, Groß und Sehr groß gewählt werden.

---

# GottesdienstRegie 0.43.1

Veröffentlicht: So., 20.09.2026

Version 0.43.1 behebt eine CSS-Kollision zwischen dem großen Sprachschalter der Anmeldung und den kompakten SVG-Sprachsymbolen im Song-Übersetzer. Flaggen behalten nun zuverlässig ihre vorgesehene Größe, Text, Eigenbezeichnung und Downloadstatus liegen in getrennten Rasterspalten und überdecken sich nicht mehr.

## Verbessert

### Eigener, kollisionsfreier SVG-Selektor

Die Flaggenkomponente verwendet einen ausschließlich für Übersetzungssprachen bestimmten Klassennamen. Feste Maße von 24 × 16 Pixeln, neutrales Schattenverhalten und eine stabile erste Rasterspalte verhindern, dass globale Login-Regeln die Auswahlliste verändern.

## Behoben

### Überlappung in der Sprachsuche

In der geöffneten Sprachsuche lagen Flagge, Sprachname und Eigenbezeichnung teilweise übereinander, weil eine später geladene globale Regel das SVG auf 46 × 38 Pixel vergrößerte. Die Klassennamen-Kollision ist entfernt und durch eine automatische Regressionsprüfung abgesichert.

---

# GottesdienstRegie 0.43.0

Veröffentlicht: So., 20.09.2026

Version 0.43.0 erweitert die Nutzungsbedingungen zu einer gemeinsamen Langfassung für App, Installer und eine eigenständige Online-Seite. Loop-Elemente werden zuverlässig genau einmal eingefügt, Veranstaltungsverknüpfungen zeigen ihren Zustand verständlich, und die neue Speicherpflege räumt ausschließlich freigegebene Cache-Bereiche auf. Übersetzungsmodelle werden gestreamt, geprüft und nur nach einem bewussten Klick geladen; lokale SVG-Sprachsymbole ersetzen sämtliche Emoji-Flaggen.

## Neu

### Getrennte Online-Nutzungsbedingungen

Die deutlich ausführlichere Fassung deckt Konten, Live-Verantwortung, Rechte an Medien, Cloud-Synchronisierung, lokale Daten, Übersetzungsmodelle, Updates, Verfügbarkeit, Haftung, Beendigung und Kontakt ab. App, Windows-Installer und die neue Seite /terms/ werden aus derselben Quelle erzeugt; die Versionshinweise bleiben eine getrennte Seite.

### Speicherübersicht mit sicherer Bereinigung

Einstellungen → Allgemein zeigt die aktuelle Größe von Sprachmodellen, Modellcache, Mediencache, Vorschaubildern, temporären Downloads und Web-Cache. Kategorien werden einzeln gewählt und vor dem unwiderruflichen Leeren nochmals mit Größe bestätigt. Präsentationen, Konten, Einstellungen, Originalmedien und gespeicherte Übersetzungstexte bleiben unberührt; ON AIR und laufende Downloads sperren die Aktion.

### Lokale SVG-Sprachsymbole

Häufig verwendete Sprachen erhalten gebündelte SVG-Flaggen. Mehrdeutige Sprachzuordnungen verwenden einen neutralen Globus. Fehlerhafte Dateien fallen ebenfalls auf den Globus zurück; externe Bildabrufe und Emoji-Flaggen werden nicht verwendet.

## Verbessert

### Gestreamte und prüfbare Übersetzungsmodelle

Große Modelldateien werden blockweise auf die Festplatte geschrieben statt vollständig im Arbeitsspeicher gesammelt. Fortschritt zeigt Bytes und, sofern bekannt, Prozentwerte. Abbrechen entfernt temporäre Daten, ein Paket gilt erst nach Prüfung aller Pflichtdateien als bereit, und beim Programmstart findet kein automatischer Modelldownload mehr statt.

### Veranstaltung klar verknüpfen

Die Statuszeile unterscheidet unverknüpft, verknüpft, abgesagt und nicht erreichbar. Titel, Datum und planmäßige Uhrzeit werden beim Verknüpfen als Snapshot gespeichert. Suche, HEUTE/MORGEN/KOMMEND, bewusste Auswahl und explizites Speichern bleiben erhalten; nach dem Schließen kehrt der Tastaturfokus zum Auslöser zurück.

## Behoben

### Loop-Elemente ohne Doppelanlage und gequetschtes Menü

Ein Einfüge-Schutz verhindert doppelte ServiceItems durch schnelle Mehrfachklicks. Standardwerte liegen nun in einer gemeinsamen Factory, QR-Code und Bibelvers werden vor der Anlage geprüft, und das responsive Raster bleibt bei schmalen Fenstern scrollbar und lesbar. Loop-Inhalte bleiben auf Vor- und Nachprogramm beschränkt.

## Bekannte Einschränkungen

### Modelle und Online-Fassung benötigen Internet

Neue lokale Übersetzungsmodelle und die Online-Fassung der Bedingungen benötigen eine Verbindung. Die installierte Textfassung, gespeicherte Übersetzungen, Präsentationen und Live-Ausgaben bleiben offline nutzbar. Sprachrichtungen ohne verfügbares lokales Modell bleiben auswählbar, können aber nicht automatisch neu übersetzt werden.

---

# GottesdienstRegie 0.42.0

Veröffentlicht: So., 20.09.2026

Version 0.42.0 trennt Vor- und Nachprogramm konsequent von normalen Gottesdienst-Elementen, ersetzt Platzhalter der 2D-Galerie durch echte Vektorgrafiken und verbessert Notizen, Videoauswahl, Popovers sowie die plattformgerechte Bedienoberfläche. Fünf klar definierte Anzeigegrößen, schattenlose Einzelvorschau und die Grundlage für macOS 26 Liquid Glass verbessern die tägliche Arbeit, ohne MAIN, STAGE oder Livestream zu verändern.

## Neu

### Vektorformen und fünf Anzeigegrößen

Die durchsuchbare 2D-Galerie verwendet nun eigenständige SVG-Pfade für alle Formen einschließlich Kirche, Bibel, Kreuz und Pfeilen. Die Bedienoberfläche kann in fünf festen Stufen skaliert werden; diese Einstellung bleibt strikt vom Ausgabebild getrennt.

## Verbessert

### Sprachpakete, Popovers und Plattformdarstellung

Sprachauswahl und Objektgalerie erhalten kollisionssichere, scrollbar bleibende Popovers. Sprachpakete werden mit nachvollziehbarem Downloadstatus vorbereitet. Auf unterstützten macOS-26-Systemen kann die Bedienoberfläche transparente Materialien verwenden; reduzierte Transparenz schaltet den Effekt ab.

## Behoben

### Loop-Menüs, Video, Radio und Notizstatus

Vor- und Nachprogramm zeigen ausschließlich die dafür vorgesehenen Elemente; Song, Bibel und andere normale Inhalte erscheinen dort nicht mehr. Die Videoauswahl ist typisiert, Radiosender verwenden ausschließlich geprüfte HTTPS-Streams, und der Status Gespeichert bei persönlichen Notizen verschwindet nach fünf Sekunden wieder.

## Bekannte Einschränkungen

### Downloads und Online-Suche benötigen Internet

Neue Übersetzungsmodelle und die Radiosuche benötigen eine Internetverbindung. Bereits gespeicherte Präsentationen sowie laufende Ausgaben bleiben bei Netzwerkfehlern unverändert.

---

# GottesdienstRegie 0.41.0

Veröffentlicht: So., 20.09.2026

Version 0.41.0 führt eine zentrale Abschnittsregel für Loop-Elemente, durchsuchbare Übersetzungssprachen mit lokalen Sprachpaketen, Rich-Text-Präsentationsnotizen und eine deutlich größere 2D-Objektgalerie ein. Gleichzeitig wurden schmale Zahlenfelder, Kontraste und der Schwarz-Weiß-Modus für die Bedienoberfläche korrigiert.

## Neu

### Sprachen mit Suche, Flaggen und Cloud-Paketen

Der Song-Editor bietet eine durchsuchbare Sprachauswahl mit Namen, Eigenbezeichnung und Flagge. Fünfzehn häufige Sprachen werden im Hintergrund vorbereitet; weitere Sprachen bleiben sichtbar und können über das Wolkensymbol mit Fortschrittsanzeige lokal geladen werden. Gespeicherte Übersetzungstexte bleiben auf anderen Rechnern lesbar, auch wenn das Modell dort erst für eine erneute Übersetzung geladen werden muss.

### Rich-Text-Notizen und erweiterte 2D-Objekte

Direkt unter dem Präsentationstitel öffnet ein Notizknopf einen lokalen Editor für Fett, Kursiv, Unterstreichen, Listen, Ausrichtung sowie Rückgängig und Wiederholen. Die neue 2D-Galerie zeigt Symbole, Namen, Kategorien und eine Suche für mehr als dreißig Formen.

## Verbessert

### Loop-Elemente nur am richtigen Ort

Eine gemeinsame Regel steuert Hinzufügen, Verschieben und Einfügen. Wetter, Meldungen, Geburtstage, Uhr, Quiz und weitere Loop-Inhalte erscheinen ausschließlich im Vor- oder Nachprogramm; ungültige Altbestände werden nicht stillschweigend gelöscht.

## Behoben

### Bedienoberfläche, Zahlenfelder und Ausgabefarben

Zahlenfelder bleiben lesbar und bedienbar, Popovers besitzen stärkere Kontraste und passen sich an schmalere Fenster an. Der Schwarz-Weiß-Modus verändert nur noch die Bedienoberfläche; MAIN, STAGE, Livestream und weitere Ausgaben behalten ihre vorgesehenen Farben.

## Bekannte Einschränkungen

### Erster Modelldownload benötigt Internet

Noch nicht vorhandene Sprachmodelle benötigen einmalig eine Internetverbindung und lokalen Speicherplatz. Bereits gespeicherte Texte und der Livebetrieb bleiben davon unabhängig.

---

# GottesdienstRegie 0.40.0

Veröffentlicht: So., 20.09.2026

Version 0.40.0 ergänzt automatische Songübersetzung, private Folien- und Präsentationsnotizen, Radiosender im Hintergrundaudio und standardmäßig deaktivierte Gemeinwohl-Hinweise. Geschützte Loop-Kerninhalte, unveränderliche Live-Snapshots und mehrere Layoutkorrekturen erhöhen die Sicherheit im Livebetrieb.

## Neu

### Lokale automatische Übersetzung

Englische und deutsche Songtexte können im Song-Editor mit einem lokal ausgeführten Sprachmodell übersetzt werden. Akkorde und Zeilenumbrüche bleiben geschützt; das Ergebnis bleibt vor dem Einsatz vollständig bearbeitbar.

### Private Notizen und Radiosender

Persönliche Notizen stehen pro Präsentation und Folie gerätelokal bereit und gelangen in keine Ausgabe. Die Hintergrundaudio-Auswahl kann HTTPS-Radiosender online suchen, vorhören und hinzufügen.

### Gemeinwohl-Hinweise

Unter Präsentation → Sonstiges → Extern steht eine standardmäßig deaktivierte, trackingfreie Konfiguration für nicht editierbare Hinweise offizieller Stellen bereit.

## Verbessert

### Sichere Vorschau und Loop-Inhalte

MAIN erhält beim Schalten eine unveränderliche Kopie des gerenderten Folienstands. Wetter, Uhr und andere Loop-Kerninhalte sind geschützt und erscheinen nicht mehr als löschbare zusätzliche Ebene.

## Behoben

### Kopfzeile, KI-Motive, Zahlenfelder und Equalizer

Fensterknöpfe und Profil überdecken sich nicht mehr. Der KI-Motivbereich bleibt responsiv, Zahlenfelder sind breit genug und jedes Equalizerband zeigt Frequenzbereich, Frequenz und Dezibelwert verständlich an.

## Bekannte Einschränkungen

### Modelldownload und Radiosender benötigen Internet

Der erste Download eines Übersetzungsmodells und die Radiosuche benötigen eine Verbindung. Bereits laufende lokale Ausgabe und MAIN bleiben bei Fehlern unverändert.

---

# GottesdienstRegie 0.39.0

Veröffentlicht: Sa., 19.09.2026

Version 39 ergänzt manuell gepflegte Songübersetzungen mit sechs Anzeigearten, einen standardmäßig aktiven und abschaltbaren Bildschirmschutz sowie ausführlichere Hilfethemen mit drei neuen schematischen Abbildungen. Der Unsplash-Bereich erhält verlinkte Bedingungen; der interaktive Windows-Installer verlangt eine ausdrückliche Zustimmung zu den vorhandenen Nutzungsbedingungen.

## Neu

### Übersetzungen direkt am Song

Unter INHALT lässt sich zu jeder Lyrics-Folie eine Übersetzung mit eigener Sprachangabe hinzufügen, bearbeiten oder entfernen. Die Originaltexte bleiben unverändert, wiederholte Songabschnitte übernehmen dieselbe Übersetzung und Änderungen werden mit der Präsentation gespeichert. Es wird kein automatischer Übersetzungsdienst aufgerufen.

### Sechs Anzeigearten im Song-Untermenü

Einstellungen → Präsentation → Song bietet Aus, Klammern unter der Strophe, Übersetzung ohne Klammern, zeilenweisen Wechsel, zwei Spalten und nur Übersetzung. Standardmäßig erscheinen Klammern; ohne Übersetzung bleibt der Originaltext sichtbar. Die Live-Folie übernimmt die Einstellung erst beim Senden, während die separate STAGE-Akkordansicht beim Original bleibt.

### Abschaltbarer Bildschirmschutz

Der standardmäßig aktive Schutz fordert das Betriebssystem auf, das Display bei geöffneter Anwendung eingeschaltet zu lassen. Unter Allgemein → Fenster & Start kann er deaktiviert werden. Die Auswahl bleibt gespeichert und beim Beenden wird der Schutz freigegeben, ohne Energieeinstellungen dauerhaft zu verändern.

### Zustimmung bei der Windows-Installation

Der interaktive Windows-Assistent zeigt die vorhandenen Nutzungsbedingungen und lässt die Installation erst nach Auswahl des Zustimmungsfeldes weiterlaufen. Die Bedingungen bleiben auch in der Anwendung und über den Update-Hinweis erreichbar.

## Verbessert

### Ausführliche Hilfe mit drei neuen Bildern

Neue Artikel erklären Songübersetzungen, Bildschirmschutz und die Installation Schritt für Schritt. Erste Schritte und Unsplash enthalten längere praktische Anleitungen; drei gekennzeichnete Diagramme verdeutlichen die Abläufe. Bei einer Suche ohne Treffer gibt es einen konkreten Hinweis zur Eingrenzung.

### Verlinkter Unsplash-Hinweis

Im Unsplash-Bereich erscheint der gewünschte Nutzungshinweis auch beim Laden und bei Verbindungsproblemen. Nutzungs- und Datenschutzbedingungen öffnen ihre jeweiligen Webseiten; die Unsplash+-Lizenz ist zusätzlich separat verlinkt. Nur diese festgelegten HTTPS-Ziele sind neu für den externen Aufruf freigegeben.

## Bekannte Einschränkungen

### Zweisprachige Folien vor ON AIR prüfen

Preflight berücksichtigt die zusätzliche Textmenge. Teile übersetzte Abschnitte bei Bedarf manuell auf, damit beide Sprachen zusammenbleiben. Die Anzeigeart gilt pro Gerät, die Übersetzung gehört zur Präsentation. Manuelles Sperren und verbindliche Sicherheitsrichtlinien werden vom Bildschirmschutz nicht umgangen; stille Installationen zeigen keine Checkbox.

---

# GottesdienstRegie 0.38.0

Veröffentlicht: Mo., 14.09.2026

Songs lassen sich über die Songbibliothek importieren. Audio erhält einen eigenen Equalizer-Unterpunkt und Medien-Uploads zeigen einen kleinen Fortschrittsbalken.

## Neu

### Songs importieren

TXT-, Markdown-, SONG-, CSV- und JSON-Dateien können direkt über Songbibliothek → Songs importieren … eingelesen werden. Titel, Interpret und Abschnitte werden übernommen.

### Equalizer-Unterpunkt

Audio enthält jetzt Standard und eigene 10-Band-Kurve mit gespeicherten dB-Werten, ohne die schnelle Auswahl der Audioausgänge zu überladen.

### Kompakter Upload-Fortschritt

Beim Upload von Bildern, Videos, Audio und weiteren Medien zeigt der Dialog Prozentfortschritt.

---

# GottesdienstRegie 0.37.1

Veröffentlicht: Mo., 14.09.2026

Die Update-Ansicht zeigt direkt beim Download den Hinweis: Mit der Aktualisierung stimmst du den Nutzungsbedingungen zu. Der verlinkte Begriff Nutzungsbedingungen öffnet die vollständige Fassung ohne Umweg.

Der Hinweis macht die Zustimmung vor dem Download sichtbar. Er ist rein informativ und verändert weder den Downloadablauf noch den Livebetrieb.

## Neu

### Klickbarer Hinweis beim Update

Vor dem Download steht jetzt: „Mit der Aktualisierung stimmst du den Nutzungsbedingungen zu.“ Das Wort Nutzungsbedingungen öffnet direkt die vollständige Fassung.

---

# GottesdienstRegie 0.37.0

Veröffentlicht: Mo., 14.09.2026

Der neue TESTBETRIEB prüft echte MAIN- und STAGE-Ausgaben ohne verknüpfte Veranstaltung. Die vollständigen Nutzungsbedingungen werden bei der Anmeldung bestätigt und bleiben unter Hilfe erreichbar.

## Neu

### TESTBETRIEB ohne Veranstaltung

Ein eigener Button startet eine ausdrücklich bestätigte Probeausgabe. Preflight, Berechtigungen, aktive Folien und MAIN-Zuordnung bleiben Pflicht. Es werden nur MAIN und STAGE geöffnet; LIVESTREAM, NOTES, LOBBY und Recording bleiben aus.

### Nutzungsbedingungen

Die Anmeldung enthält eine bestätigbare Fassung zu Verantwortlichkeit, Livebetrieb, Medienrechten, Cloud-Daten und Fehlern. Die vollständige Fassung ist jederzeit über Hilfe → Nutzungsbedingungen verfügbar.

## Verbessert

### Eigene 0.37-Funktionslinie

Neue Funktionspakete werden nicht mehr als weitere Unterpunkte der 0.36-Linie veröffentlicht. Die bisherige 0.36-Linie bleibt als Archiv erhalten.

## Behoben

### Sicherer Start ohne Veranstaltung

Der normale ON-AIR-Start bleibt an eine Veranstaltung gebunden. Nur der klar markierte Testbetrieb darf diese fachliche Voraussetzung ausnehmen und verwirft den Start bei Änderungen oder fehlender Ausgabe.

---

# GottesdienstRegie 0.36.16

Veröffentlicht: So., 13.09.2026

Leere Vor- und Nachprogramme haben eigene Hinzufügen-Schaltflächen. Loop-Elemente stehen im Bereichsmenü sofort oben; LOOP, Audio und Zeit bleiben im Abschnitts-Header sauber ausgerichtet.

## Neu

### Loop-Elemente in leeren Abschnitten

Meldungen, Wetter, Quiz, Countdown, Uhrzeit, QR-Code und weitere Loop-Typen lassen sich direkt im VORPROGRAMM oder NACHPROGRAMM anlegen, ohne zuvor ein ServiceItem auszuwählen.

## Verbessert

### Stabiler Abschnitts-Header

LOOP-Schalter, Hinzufügen, Background-Audio und Zeit-/Daueranzeige werden als eine kompakte Aktionsgruppe angeordnet und überlappen nicht mehr.

## Behoben

### Loop-Menü in leeren Vorprogrammen

Das Hinzufügen-Menü war auf das aktuell ausgewählte Item angewiesen. Die Bereichsschaltfläche setzt das Ziel jetzt direkt und schaltet die Loop-Unterstützung beim ersten bewussten Hinzufügen frei.

---

# GottesdienstRegie 0.36.15

Veröffentlicht: So., 13.09.2026

Die Auswahl entfernter Folien konnte die App-Hülle nach oben scrollen und das Menü abschneiden. Die Hülle bleibt jetzt an ihrer Position, während die Inhaltsbereiche normal scrollen. Profil, Sync und Fensterbuttons bleiben mit dem Menü ausgerichtet.

## Behoben

### Abgeschnittenes Menü nach Folienauswahl

Fokus und automatisches Scrollen in der Folienübersicht verschieben die äußere Oberfläche nicht mehr. Auch niedrige Fenster erzwingen keine übergroße App-Höhe. Geprüft in Electron bei 1920×1080, 1366×768 und 1280×600 sowie mit ausgeklappter Timeline und Moduswechsel.

---

# GottesdienstRegie 0.36.14

Veröffentlicht: So., 13.09.2026

Lange Songtexte lassen sich passend zur Folienkapazität aufteilen und werden vor ON AIR bei Überlauf markiert. STAGE zeigt aktuelle Lyrics, optionale Akkordzeilen und den nächsten Inhalt getrennt von MAIN. Die Elementbearbeitung ergänzt Raster, magnetisches Einrasten, Tastatur-Nudging, Ausrichten, Verteilen und ein Ebenen-Panel. Mausgesten werden stabil lokal dargestellt und erst beim Loslassen gespeichert.

## Neu

### Song-Ablauf und STAGE

Verse-Chips bleiben per Drag-and-drop sortierbar. Lange Lyrics können automatisch in mehrere Folien geteilt werden. STAGE erhält eine kompakte Ansicht mit JETZT, Akkordzeilen und ALS NÄCHSTES; MAIN bleibt unverändert.

## Verbessert

### Canvas-Ausrichtung und Ebenen

Rastergröße und Snap-Verhalten sind unter Hilfslinien einstellbar. Mehrfach ausgewählte Elemente lassen sich links, mittig, oben und vertikal ausrichten sowie gleichmäßig verteilen. Das Ebenen-Panel bündelt Auswahl, Sichtbarkeit, Sperren und Reihenfolge.

## Bekannte Einschränkungen

### Livebetrieb bleibt priorisiert

Die Hilfen sind Editorfunktionen. MAIN, STAGE, LIVESTREAM, Audio und Recording werden nicht blockiert; Zwischenstände einer Mausgeste erzeugen keinen eigenen History-Eintrag.

---

# GottesdienstRegie 0.36.13

Veröffentlicht: So., 13.09.2026

## Behoben

### Vorschau nutzt die volle Arbeitshöhe

Einzelvorschau und Folienübersicht enden nicht mehr oberhalb einer großen ungenutzten Fläche. Eine fehlerhafte spätere CSS-Regel reservierte zusätzliche Zeilen für Werkzeuge, die im Vorschaumodus gar nicht vorhanden sind. Die Höhenaufteilung entspricht jetzt wieder den tatsächlich sichtbaren Bereichen.

### Timeline und Statuszeile wieder unten

Die Timeline sitzt direkt unter dem Arbeitsbereich und die Statuszeile am unteren Fensterrand. Statusangaben überlagern den Ablauf nicht mehr. Die Anordnung bleibt auch beim Aufklappen der Timeline, bei kleineren Fenstern und nach dem Wechsel zwischen Bearbeiten und Vorschau erhalten.

## Bekannte Einschränkungen

### Umfang dieser Korrektur

Diese Wartungsausgabe korrigiert ausschließlich das Vorschau-Layout. Präsentationsinhalte, Live-Steuerung und die offenen Cloud-Songfunktionen aus 0.36.12 bleiben unverändert. Die Layouttests umfassen 1920×1080 und 1366×768 sowie beide Vorschauansichten und eine ausgeklappte Timeline.

---

# GottesdienstRegie 0.36.12

Veröffentlicht: So., 13.09.2026

Optionales Lyric Scrolling ergänzt die Songausgabe auf MAIN. Die Ausgabe verbessert außerdem Ziehen und Skalieren, Vollbildbuttons, Website-Optionen und lokale Autosaves. Eine authentifizierte Cloud-Songbibliothek und vollständige Design-Vererbung sind weiterhin nicht enthalten.

## Neu

### Lyric Scrolling für Songs

Unter Einstellungen → Präsentation → Songs einschalten. MAIN zeigt aktuelle Lyrics und bis zu zwei abgedunkelte kommende Blöcke. Dauer und Deckkraft sind einstellbar; jeder Song kann im DESIGN-Tab den Standard übernehmen oder normale Slides verwenden. Titel-, Leer- und deaktivierte Folien erscheinen nicht als kommende Lyrics.

### Getrennte Vorschau und gespeicherte Einstellungen

Die Testvorschau über dem Canvas ändert nur den Editor. Die eigentliche Ausgabe folgt WEITER, ZURÜCK und direkten Sprüngen ohne Animationswarteschlange. Einstellungen bleiben im lokalen Dokument erhalten und unterstützen Undo/Redo. STAGE und LIVESTREAM behalten eigene Layouts.

## Verbessert

### Website-Einstellungen in Bereichen

Adresse und Darstellung, Wiedergabe und Bedienung sowie Verbindung und Sicherheit sind gruppiert. Formularfreigabe und Referrer-Verhalten sind pro Website einstellbar. Beim Öffnen erhält das URL-Feld nicht mehr automatisch den Fokus.

### Ruhigeres lokales Speichern

Lokale Autosaves laufen ohne das große Synchronisationsfenster. Die Cloud-Erreichbarkeit wird automatisch alle fünf Minuten geprüft. Eine lokale Sicherung oder Erreichbarkeitsprüfung ist ausdrücklich keine bestätigte Cloud-Synchronisierung der Präsentation.

### Rechtschreib-Kontextmenü

In editierbaren Feldern stehen verfügbare Korrekturvorschläge, Schreibweise lernen und die üblichen Textaktionen bereit. Die optionale Onlinesuche öffnet erst nach bewusstem Anklicken eine externe Suchseite; verfügbare Vorschläge hängen von den geladenen Wörterbüchern ab.

### Ausführlicheres Versionsarchiv

Alle 59 bisherigen Versionen erhalten eine zusätzliche Einordnung in App und Webseite. Die ursprünglichen Einzelpunkte bleiben erhalten. Historische Notizen sind keine erneute Verifikation aller damaligen Funktionen. Das Archiv beginnt bei 0.1.0; eine veröffentlichte 1.0 existiert dort nicht.

## Behoben

### Ruhigeres Ziehen und Skalieren

Die Arbeitsfläche zeichnet während der Mausbewegung eine lokale Vorschau. Erst Loslassen erzeugt einen Undo-Schritt. Abgebrochene Bewegungen werden nicht gespeichert; ein Wechsel der ausgewählten Folie verhindert einen nachträglichen Commit im falschen Kontext.

### F11, Profil und Sync

Eigene Vollbildbuttons erlauben Minimieren, Vollbild verlassen und Schließen. Profil und Synchronisierung halten Abstand zu den Fensterbuttons. Lange Namen werden gekürzt, statt den Sync-Button zu überdecken.

### Verknüpfte Websites und Songübergänge

Website-Änderungen bewahren die eigenen IDs jedes verknüpften Vorkommens und bilden eine gemeinsame Transaktion. Lyric Scrolling übernimmt den bereits aufgelösten Hintergrundübergang statt ihn durch einen anderen Standard zu ersetzen.

## Bekannte Einschränkungen

### Cloud-Songbibliothek noch offen

Eigenständige authentifizierte Cloud-Songbibliothek, verwaltete Library-Arrangements und vollständige Design-Vererbung sind nicht Bestandteil dieser Ausgabe. Dafür fehlt weiterhin die geeignete Anbindung der bestehenden Anmeldung; es werden keine offenen Cloud-Schreibrechte eingeführt.

### Lange Lyrics vor ON AIR prüfen

Die Schrift wird nicht unbemerkt verkleinert. Preflight warnt bei einer zu kleinen Textfläche; überstehender Text wird abgeschnitten. Solche Abschnitte vor ON AIR aufteilen oder die Textfläche vergrößern. Rendererchecks bis 4K ersetzen keinen Test von MAIN, Quick Screens, Audio und Video auf dem tatsächlichen Regie-PC.

---

# GottesdienstRegie 0.36.11

Veröffentlicht: Sa., 12.09.2026

Diese Ausgabe ordnet die Songarbeit um: Grundtext, tatsächliche Abfolge und Metadaten werden voneinander getrennt. Wiederholungen im Ablauf sollen den Grundtext nicht vervielfachen. Die Suche greift auf gespeicherte Präsentationen zurück und ist noch keine eigenständige Cloud-Songbibliothek.

## Neu

### Songablauf

Kompakte Chips steuern die Folienreihenfolge. Wiederholte Abschnitte verwenden denselben Grundtext.

## Verbessert

### Song-Arbeitsbereich

Mehr Platz für Lyrics, sieben Haupttabs und Metadaten in einem eigenen Bereich.

### Song-Suche und Gestaltung

Songs aus gespeicherten Präsentationen lassen sich direkt suchen. Textgestaltung wirkt auf die Songfolien.

## Bekannte Einschränkungen

### Noch offen

Eigenständige Cloud-Songbibliothek, Library-Arrangements und vollständige Design-Vererbung sind noch nicht enthalten.

---

# GottesdienstRegie 0.36.10

Veröffentlicht: Sa., 12.09.2026

Dieser Wartungsstand betrifft den Wechsel vom kleinen Startfenster zum normalen Windows-Arbeitsbereich. Das Titlebar-Overlay wird bereits bei der Fenstererstellung aktiviert, damit spätere Anpassungen der Titelleiste nicht mehr die genannte JavaScript-Ausnahme auslösen.

## Behoben

### Windows-Start repariert

Der Fehler „Titlebar overlay is not enabled“ beim Wechsel vom Ladefenster zum Arbeitsbereich ist behoben.

---

# GottesdienstRegie 0.36.9

Veröffentlicht: Sa., 12.09.2026

Starten und Beenden erhalten jeweils eine kompakte, auf den Speichervorgang konzentrierte Anzeige. Die gespeicherte Arbeitsbereichsgröße bleibt vom Ladefenster getrennt. Beim Beenden wird lokal gespeichert; die Anzeige ist ausdrücklich kein Nachweis einer erfolgreichen Cloud-Übertragung.

## Verbessert

### Kompakter Start

Nur die mittlere Ladekarte erscheint als kleines Fenster. Anschließend öffnet sich der Arbeitsbereich in der eingestellten Größe.

### Speichern beim Beenden

Eine nicht überspringbare Anzeige begleitet die lokale Speicherung der Präsentation vor dem Schließen.

## Bekannte Einschränkungen

### Lokale Speicherung

Die Speicheranzeige beim Beenden bestätigt keine Cloud-Synchronisierung.

---

# GottesdienstRegie 0.36.8

Veröffentlicht: Fr., 11.09.2026

Der Songeditor führt präsentationsbezogene Einstellungen für Ablauf, Tonart und Ausgaben zusammen. Die dokumentierte Arrangement-Auswahl ist von einer verwalteten Library zu unterscheiden: Eigenständige Cloud-Arrangements und eine vollständige mehrstufige Design-Vererbung wurden damit noch nicht geliefert.

## Neu

### Song-Overrides

Songs besitzen getrennte Bereiche für Inhalt, Ablauf, Design, STAGE und LIVESTREAM. Änderungen gelten zunächst nur für das aktuelle Song-ServiceItem.

### Verse Order

Die Reihenfolge V1 C V2 C B C C kann direkt pro Gottesdienst festgelegt werden.

### Arrangement und Tonart

Mehrere Arrangements und zwölf Tonarten stehen direkt im Songeditor bereit.

## Verbessert

### Design-Overrides

Designvorlage, Schriftgröße und Texteffekt können pro Song angepasst und gesammelt zurückgesetzt werden.

### STAGE und LIVESTREAM

STAGE unterstützt Akkorde und Current/Next; der Livestream erhält ein eigenes Lower-Third-Layout.

---

# GottesdienstRegie 0.36.7

Veröffentlicht: Fr., 11.09.2026

Der Schwerpunkt liegt auf direkter Arbeit an der Folie und schnellerem Wiederfinden von Medien. Zusätzliche Elemente können über Maus und Zahlenwerte gestaltet werden; Unsplash-Favoriten ergänzen die Medienauswahl. Der Start kann ohne Verlust der gespeicherten Anmeldung übersprungen werden.

## Neu

### Direkte Folienbearbeitung

Text, QR-Codes und Vordergrundmedien lassen sich auf der 16:9-Arbeitsfläche mit der Maus verschieben und skalieren.

### Neue Ablaufvorlagen

Vier vorbereitete Vorlagen decken kompakte, klassische, Jugend- und Abendgottesdienste ab.

### Unsplash-Favoriten

Bilder aus der Unsplash-Suche können dauerhaft als Favorit gespeichert werden.

## Verbessert

### Start überspringen

Die Start-Synchronisierung kann übersprungen werden, ohne die gespeicherte Anmeldung zu verlieren.

### Präzise Elementwerte

Position, Größe, Drehung und Deckkraft ausgewählter Folienelemente sind direkt einstellbar.

## Behoben

### Stabiler KI-Videobereich

Fehler bei der Videoerzeugung bleiben im Generator und führen nicht mehr zu Unsplash.

### Saubere Werkzeugleisten

Die Inhaltswerkzeuge und der Deckkraftregler überlappen oder verrutschen nicht mehr.

---

# GottesdienstRegie 0.36.6

Veröffentlicht: Fr., 11.09.2026

Die Suchanfrage des Unsplash-Bereichs wird an den zugehörigen Anbieter weitergegeben. Beim Nachladen sollen vorhandene Ergebnisse erhalten bleiben und weitere Treffer angehängt werden. Dieser Stand adressiert damit zwei unterschiedliche Probleme: falsche Leerergebnisse und den kompletten Neuaufbau der Trefferliste.

## Verbessert

### Echte Unsplash-Suche

Der eingegebene Suchbegriff wird direkt von Unsplash verarbeitet; die zurückgegebenen Treffer werden vollständig angezeigt.

### Inkrementelles Nachladen

Weitere Ergebnisse werden an das bestehende Raster angehängt, ohne vorhandene Karten auszublenden oder neu zu sortieren.

## Behoben

### Keine falschen Leerergebnisse

Unsplash-Treffer verschwinden nicht mehr durch einen nachgelagerten lokalen Textfilter.

---

# GottesdienstRegie 0.36.5

Veröffentlicht: Do., 10.09.2026

Präsentationsauswahl, QR-Code-Bearbeitung und Medienrückmeldungen werden ausgebaut. Eigene Präsentationen lassen sich über eine gesonderte Übersicht wiederfinden; QR-Codes erhalten eine Eingabe mit Vorschau. Die Medienauswahl für Vordergrundelemente und Zusatztexte wird direkter in die Bearbeitung eingebunden.

## Neu

### Meine Präsentationen

Das Profil zeigt eine durchsuchbare Präsentationsübersicht mit Titelbild, Datum, Umfang, Größe und direktem Öffnen.

### QR-Code-Editor

Ein eigener Dialog erzeugt aus URL oder Text eine Live-Vorschau und einen echten QR-Code für die Folie.

### Medienanhänge

Fehlerberichte unterstützen bis zu vier Screenshots, Bilder oder kurze Videos.

## Verbessert

### KI-Motive ohne Popup

Die Gestaltung erfolgt als ruhiger, vollständiger Arbeitsbereich innerhalb der Medienbibliothek.

### Unsplash-Seiten

Mehr und weniger Ergebnisse lassen sich über sichtbare Ladebuttons steuern.

### Vordergrund und Zusatztext

Vordergrundbilder bieten Medienauswahl oder Import; Zusatztexte bleiben in ihrer Ebenenbox direkt bearbeitbar.

## Behoben

### Echte QR-Codes

QR-Elemente zeigen nun das generierte QR-Bild und nicht mehr nur einen Textplatzhalter.

### Servicezeit ausgerichtet

Die Servicezeit bleibt rechts im Abschnittskopf und zeigt VORM. oder NACHM.

---

# GottesdienstRegie 0.36.4

Veröffentlicht: Do., 10.09.2026

Zusätzliche Folieninhalte und das persönliche Profil werden klarer voneinander abgegrenzt. Profilangaben bleiben im Profil, Belohnungen in ihrem eigenen Bereich. Für erzeugte Hintergrundvideos wird eine Länge von 30 bis 60 Sekunden angeboten; fotografische Motive sind von abstrakten Formen zu unterscheiden.

## Neu

### Zusätzliche Ebenen

Text, Vordergrundbild, QR-Code und 2D-Objekt besitzen eine eigene Auswahl mit Bearbeiten, Sichtbarkeit und Entfernen.

### Mehr Motive und Stile

Erweiterte Szenenkategorien und Gestaltungsstile werden durch lange wechselnde Motivbeschreibungen ergänzt.

### Getrennte Profilansicht

Profilbild, Kontodaten, Rolle und Organisation erscheinen unter Mein Profil; XP und Abzeichen bleiben im eigenen Fortschrittsbereich.

## Verbessert

### 30–60 Sekunden Video

Die Länge lokaler Videohintergründe ist in Fünf-Sekunden-Schritten von 30 bis 60 Sekunden einstellbar.

### Fotografische Natur

Natur- und Stadtkategorien verwenden echte Bildmotive mit ruhiger Kamerabewegung statt abstrakter Ersatzformen.

### Kompakter Syncstatus

Der Synchronisationsstatus befindet sich unmittelbar links neben dem Profil.

## Behoben

### Unsplash-Zugang

Die Bildsuche benötigt keine manuelle Access-Key-Eingabe mehr.

### Video als Hintergrund

Erzeugte Videos werden von der Hintergrundauswahl übernommen und als vollflächige Videohintergründe angelegt.

---

# GottesdienstRegie 0.36.3

Veröffentlicht: Do., 10.09.2026

Rückmeldungen zur Anwendung können über die Hilfe begonnen werden. Der Hintergrundbereich ergänzt Natur- und Stadtmotive sowie Videoausgabe, während der Website-Editor eine überarbeitete Feldanordnung erhält. Die Bezeichnung KI beschreibt dabei nicht automatisch eine externe generative Video-KI.

## Neu

### Feedback aus der Hilfe

Fehler, Änderungen und Featurewünsche werden in einem klaren eigenen Formular erfasst.

### KI-Videohintergründe

Animierte sechssekündige WebM-Hintergründe lassen sich erzeugen, ansehen und als Hintergrund auswählen.

### Natur und Städte

Acht Szenenkategorien umfassen Natur, Wald, Berge, Stadt, Meer, Himmel, Kirchenraum und abstrakte Motive.

## Verbessert

### Kompatible Videoerzeugung

GottesdienstRegie wählt automatisch einen unterstützten WebM-Codec und zeigt erzeugte Videos direkt in der Medienvorschau.

## Behoben

### Webeditor-Layout

Checkboxen und ihre Texte bleiben kompakt zusammen und werden nicht mehr über die gesamte Breite verteilt.

---

# GottesdienstRegie 0.36.2

Veröffentlicht: Do., 10.09.2026

Webseiten erhalten eigene elementbezogene Optionen, statt alle Einstellungen global zu teilen. Parallel werden das Hinzufügen von Video und 2D-Inhalten sowie Medienaktionen überarbeitet. Die Versionsnotizen betreffen sowohl die Auswahl neuer Inhalte als auch deren anschließende Bearbeitung.

## Neu

### Weboptionen je Element

Zoom-Reset, Interaktion, Audio, Pop-ups, Aktualisierung und Proxy werden separat pro Webelement gespeichert.

### Weitere 2D-Objekte

Acht neue Formen lassen sich direkt im sichtbaren Bearbeiten-Bereich hinzufügen und gestalten.

## Verbessert

### KI-Motive

Zwölf Stile und ausführliche wechselnde Motivbeschreibungen erzeugen bei jedem Öffnen und Generieren neue Varianten.

### Schriften und Webuhr

Die Schriftliste wurde erweitert; Webansichten bevorzugen Cera Pro und zeigen die Uhrzeit einschließlich Sekunden.

## Behoben

### Cloud-Favoriten und Löschen

Favoriten und Löschen funktionieren nun auch bei Medien, die ausschließlich in der Cloud liegen.

### Video und 2D wirklich hinzufügen

Video verwendet einen passenden Dateidialog; 2D-Objekte sind im Bearbeiten-Bereich direkt erreichbar.

---

# GottesdienstRegie 0.36.1

Veröffentlicht: Do., 10.09.2026

Profil- und Bearbeitungsaktionen werden im Hauptfenster deutlicher erreichbar. Ein Schwerpunkt ist die Zuordnung der Befehle aus „Element hinzufügen“ zu den tatsächlichen Elementtypen. Organisationsangabe und Darstellung der verfügbaren Schriftstile werden ebenfalls angepasst.

## Neu

### Profilmenü

Profil, Belohnungen, Einstellungen und Abmelden sind oben rechts in einem klaren persönlichen Menü gebündelt.

### Bearbeiten-Menü

Zentrale Editor-, Zwischenablage- und Folienbefehle sind jetzt über ein vollständiges Bearbeiten-Menü erreichbar.

## Verbessert

### Schriften und Stile

Mehr als 200 Schriftfamilien, neun Gewichte und zusätzliche Textvorlagen erweitern die Gestaltung.

### Alle Elementtypen

Alle 16 unterstützten ServiceItem-Typen sind über Element hinzufügen und das Plus-Menü erreichbar.

## Behoben

### Feste Organisation

Der Organisationsname kann nicht mehr verändert oder durch einen alten Gerätewert überschrieben werden.

### Elemente wirklich hinzufügen

Slideshow und weitere zuvor unvollständige Pfade erzeugen nun das gewählte Element zuverlässig.

---

# GottesdienstRegie 0.36.0

Veröffentlicht: Do., 10.09.2026

Diese Ausgabe bündelt Funktionen für gemeinsam genutzte Gemeindegeräte mit Verbesserungen am Arbeitsbereich. Persönliche Bedienung und gerätebezogene Angaben werden unterschieden. Die dokumentierten Historie- und Monitorfunktionen sind im Kontext der vorhandenen Anmeldung und Berechtigungen zu verstehen.

## Neu

### Gemeinsam genutzte Geräte

Einmalige Geräteregistrierung und persönliche Anmeldung trennen Rechner, Benutzer und lokale Geräteeinstellungen sauber voneinander.

### Websteuerung und persönliche Monitore

Widerrufbare Steuersitzungen und feste Nur-Lese-Monitorseiten stehen im lokalen Netzwerk bereit und verwenden den bestätigten Live-Stand.

## Verbessert

### 2D- und Textgestaltung

Mehr Formen, direkte Transformationsfelder sowie Schatten, Kontur, Leuchten und Deckkraft erweitern den Folieneditor.

### Gerätebezogene Historie

Historieneinträge enthalten nun Benutzer und Gerätenamen getrennt und bleiben danach durchsuchbar.

## Behoben

### Stabile Hauptoberfläche

Die Oberfläche kollabiert nach dem Ladescreen nicht mehr, und die Änderungsanzeige verdeckt keine Werkzeugleiste mehr.

---

# GottesdienstRegie 0.35.0

Veröffentlicht: Do., 10.09.2026

Änderungshistorie und optionale Belohnungen werden als getrennte Bereiche eingeführt. Hinzu kommen lokale Hintergrundmotive, zusätzliche Formen und Schriftgestaltung. Eine lokale Historie oder Punkteanzeige bestätigt dabei weder eine serverseitige Revision noch die Umsetzung aller später gewünschten Cloud-Funktionen.

## Neu

### Dauerhafte Änderungshistorie

Ein eigenes Systemfenster zeigt Revision, Benutzer, Bereich, Quelle, Synchronisierungsstatus und Vorher/Nachher. Sichere Wiederherstellungen erzeugen eine neue Revision.

### Belohnungen und Abzeichen

Das optionale XP-System bietet Level, Abzeichen, Fortschritt und Anti-Farming, ohne Funktionen oder Berechtigungen zu beeinflussen.

### Lokale KI-Motive

Individuelle 16:9-Hintergründe werden direkt im Medienbrowser erzeugt.

### Erweiterte 2D-Formen

Fünfeck, Sechseck, Achteck, Strahlenform, Chevron, Sprechblase und Kreuz ergänzen die bisherigen Objekte.

## Verbessert

### Schriftgestaltung

Mehr als 170 Schriftfamilien, zusätzliche Gewichte und ein normaler oder kursiver Standardstil stehen zur Auswahl.

### Automatischer Ersteller

Neue Präsentationen übernehmen den Ersteller automatisch aus dem angemeldeten Konto.

## Behoben

### 2D-Objekte einfügen

Formen werden atomar eingefügt und sofort ausgewählt; alle neuen Formen sind direkt bearbeitbar.

---

# GottesdienstRegie 0.34.1

Veröffentlicht: Mi., 09.09.2026

Dieser Wartungsstand konzentriert sich auf die Skalierung der Bedienoberfläche. Besonders die obere Leiste soll nach Größenänderungen nicht mehr zusammengedrückt erscheinen. Es handelt sich um eine Korrektur der Arbeitsfläche, nicht um eine neue Präsentations- oder Ausgabelogik.

## Verbessert

### Stabile Oberflächenskalierung

Das Bedienfenster startet jetzt immer mit 100 Prozent Zoom. Browser-Zoomtasten können die Produktionsoberfläche nicht mehr unbeabsichtigt verkleinern oder vergrößern.

## Behoben

### Zusammengedrückte obere Leiste

Menü-, Präsentations- und Formatleiste behalten wieder ihre vorgesehenen Höhen und überlagern sich nicht mehr direkt unter der Windows-Titelleiste.

---

# GottesdienstRegie 0.34.0

Veröffentlicht: Mi., 09.09.2026

Medienverwaltung, Formen und Veranstaltungsauswahl werden gemeinsam erweitert. Der dokumentierte Löschablauf umfasst eine bewusst auszulösende Aktion; die Veranstaltungsauswahl berücksichtigt einen längeren Planungshorizont. Gestaltungsmöglichkeiten und Medienbrowser sind die wesentlichen Arbeitsbereiche dieser Ausgabe.

## Neu

### Bearbeitbare 2D-Objekte

Rechteck, abgerundetes Rechteck, Ellipse, Dreieck, Raute, Stern und Pfeil können eingefügt, verschoben, skaliert, gedreht und mit Füllung, Kontur sowie Deckkraft gestaltet werden.

### Medien sicher löschen

Team-Medien können über einen klaren Bestätigungsdialog dauerhaft gelöscht werden. In Präsentationen oder im Livebetrieb verwendete Dateien bleiben geschützt.

### LiveQuiz-Belohnungen

Für Quizze können Belohnungen für die ersten drei Plätze hinterlegt werden. Eine Rangliste berechnet die Punkte aus den richtigen Antworten.

### Schnelle Änderungsanzeige

Eine kompakte Anzeige informiert über die letzte Änderung und öffnet direkt die vollständige Bearbeitungshistorie.

## Verbessert

### Professioneller Medienbrowser

Ergebnisanzahl, veränderbare Kachelgröße, Favoriten, Mehr-/Weniger-Laden sowie Tastaturbefehle für Suche, Löschen und Schließen beschleunigen die Medienverwaltung.

### Veranstaltungen bis drei Jahre

Die Verknüpfung zeigt heutige und kommende Veranstaltungen für maximal drei Jahre, chronologisch sortiert und verständlich gruppiert. Eine klare Leermeldung erklärt fehlende Treffer.

### Textgestaltung

Titel-, Untertitel- und Normalstil wirken jetzt direkt. Textfarbe, Textschatten und die Live-Einblendung „Fade in Text“ sind funktionsfähig.

## Behoben

### Arrangement duplizieren

Der bisher wirkungslose Button dupliziert nun die aktuelle Folie über die vorhandene Editor- und Undo-Logik.

### Sicherer Löschablauf

Alle sichtbaren Löschaktionen öffnen denselben App-Dialog; ein versehentliches sofortiges Löschen über die Detailansicht ist ausgeschlossen.

---

# GottesdienstRegie 0.33.1

Veröffentlicht: Mi., 09.09.2026

Die Ausgabe ergänzt eine sichtbare Fehlerabsicherung für die Oberfläche nach dem Start. Statt einer nicht bedienbaren Ansicht soll ein Fehler nachvollziehbar werden. Dieser Stand ist vor allem für die Wiederaufnahme der Arbeit und die Diagnose eines fehlerhaften Starts relevant.

## Verbessert

### Sichtbare Fehlerabsicherung

Falls zukünftig ein unerwarteter Darstellungsfehler auftritt, zeigt GottesdienstRegie eine verständliche Meldung und einen Button zum erneuten Laden statt einer leeren Fläche.

## Behoben

### Bedienoberfläche nach dem Start

Ein instabil erzeugtes Tastenkürzel-Objekt verursachte eine endlose React-Aktualisierung. Der Zustand wird jetzt stabil gecacht und die vollständige Oberfläche erscheint wieder nach dem Ladescreen.

---

# GottesdienstRegie 0.33.0

Veröffentlicht: Mi., 09.09.2026

Einführung und Hilfe werden durch Bilder ergänzt, während die Medienbibliothek komfortabler bedienbar wird. Nachladen, Filter ohne Treffer und das Umbenennen von Elementen stehen im Mittelpunkt. Die Übergangsvorschau unterstützt zusätzlich die Kontrolle vor der Live-Ausgabe.

## Neu

### Bebilderte Einführung

Ein neuer mehrstufiger Rundgang erklärt Arbeitsbereich, Ablauf, Medien, Einstellungen, Vorschau und Livebetrieb mit echten Softwareaufnahmen; er lässt sich jederzeit im Hilfe-Menü erneut starten.

### Medien komfortabel nachladen

Große Ergebnislisten lassen sich mit „Mehr laden“ schrittweise erweitern und mit „Weniger anzeigen“ wieder kompakt darstellen.

## Verbessert

### Medienbibliothek

Cloud, Community und Unsplash sind jetzt getrennte, korrekt wechselnde Bereiche; Bibliotheksfilter funktionieren und Unsplash ist eindeutig gekennzeichnet.

### Tastenkürzel

Zusätzliche Befehle öffnen Hilfe, Einstellungen, Präsentations- und Medienbibliothek, Folienübersicht und Preflight. Vor dem Zurücksetzen erscheint eine Bestätigung.

### Versionsbilder

Neue Versionen erhalten ab jetzt ein eigenes Bild direkt in den Web-Versionshinweisen.

## Behoben

### Element umbenennen

Das Umbenennen verwendet nun einen eigenen zuverlässigen App-Dialog mit Enter, Escape, Undo, Autosave und Sync statt eines blockierten Browserdialogs.

### Übergangsvorschau

Die Vorschau des Standardübergangs funktioniert auch ohne ausgewählte Folie mit einer eingebauten Testfolie und verändert MAIN nicht.

### Filter ohne Treffer

Bei null Treffern erscheint eine passende Erklärung mit direktem Button zum Zurücksetzen statt der irreführenden Meldung „Noch keine Medien“.

---

# GottesdienstRegie 0.32.0

Veröffentlicht: Mi., 09.09.2026

Fehler- und Hilfeseiten werden besser in die Bedienung eingebunden. Die Medienanbindung an Cloud und Unsplash erhält zusätzliche Erläuterungen und Korrekturen. Anbieterzugang und Erreichbarkeit bleiben dabei von der lokalen Bearbeitung einer Präsentation zu unterscheiden.

## Neu

### Eigene Fehlerseite

Fehlerberichte werden auf einer eigenen GottesdienstRegie-Seite geprüft, kopiert, gespeichert oder über die Systemfreigabe versendet – ohne direkte Weiterleitung auf eine GitHub-Eingabeseite.

### Cloud- und Unsplash-Hilfe

Neue Unterthemen erklären Suche, Lesemodus, Berechtigungen, Preload und konkrete Schritte bei Verbindungsproblemen.

## Verbessert

### Kontextmenü und Shortcuts

Das ServiceItem-Menü folgt dem App-Farbschema, benennt die Live-Aktion eindeutig und verwendet Umschalt+F5 für ON AIR sowie Strg+R zum Umbenennen.

### Breiteres Hilfezentrum

Navigation und Artikel nutzen mehr Platz, vermeiden horizontales Abschneiden und zeigen fokussierte Ausschnitte echter Softwareaufnahmen.

## Behoben

### Medien-Cloud erreichbar

Die falsche, nicht vorhandene Repository-Adresse wurde durch einen abgegrenzten Medienbereich des erreichbaren Projekts ersetzt; API-Fehler erhalten einen sicheren Lese-Fallback.

### Unsplash ohne Schlüsselabfrage

Der eingerichtete App-Zugang wird automatisch genutzt und die Suche zeigt verständlichere Netzwerk- und Dienstfehler.

---

# GottesdienstRegie 0.31.0

Veröffentlicht: Di., 08.09.2026

Das ServiceItem-Kontextmenü bündelt Aktionen für ausgewählte, mehrfach markierte und verknüpfte Elemente. Weitere Änderungen betreffen den Präsentationskopf, die Veranstaltungsauswahl und Quick Screens. Die Bedienung soll vorbereitet werden können, ohne die aktive Live-Ausgabe unbeabsichtigt zu verändern.

## Neu

### Professionelles ServiceItem-Kontextmenü

Das native Desktop-Menü unterstützt Ausschneiden, Kopieren, Einfügen, Duplizieren, Löschen, Verknüpfen, Gruppieren, Ausblenden, Undo/Redo, Umbenennen, Folienexport und ON AIR mit passenden Zuständen.

### Mehrfachauswahl und verknüpfte Elemente

Strg-/Cmd-Klick wählt mehrere Ablauf-Elemente; Gruppen bewegen sich gemeinsam und verknüpfte Instanzen behalten eigene IDs bei gemeinsamer Inhaltszuordnung.

### Folie als Bild

Gerenderte Folien lassen sich ohne Bedienoberfläche in die Systemzwischenablage kopieren oder über einen echten Speichern-Dialog als PNG exportieren.

## Verbessert

### Veranstaltungsauswahl

Termine sind einmalig nach HEUTE, MORGEN und KOMMEND gruppiert; Auswahl und Übernahme sind getrennt, Änderungen werden bewusst gespeichert und der Dialog schließt per Escape oder Außenklick.

### Hilfe und Präsentationskopf

Hilfeartikel erklären Bedienabläufe ohne interne Speichertechnik, verwenden mehr echte Softwareaufnahmen und der kompakte Veranstaltungskopf besitzt eine kollisionsfreie Hilfe-Schaltfläche.

### Live-Sicherheit

Editoraktionen bleiben von MAIN getrennt; ON AIR aus dem Kontextmenü verwendet die vorhandene Preflight- und Take-Logik.

## Behoben

### Servicezeit nicht mehr abgeschnitten

Der enge Abschnittskopf zeigt die Uhrzeit ohne abgeschnittenen Vormittags-/Nachmittagszusatz.

### Schwarz und Amen

Die Schwarz-Schnellanzeige enthält keinen Text mehr; Amen liegt transparent über dem sichtbaren Folienhintergrund.

### Ruhiger Programmstart

Beim Start erscheint nur noch der Ladebereich auf neutralem Hintergrund und kein vollflächiges Fotomotiv.

---

# GottesdienstRegie 0.30.0

Veröffentlicht: Di., 08.09.2026

Der Schwerpunkt liegt auf Audio-Routing und der Prüfung von Ausgabewegen vor dem Gottesdienst. Geräte-Fallbacks und getrennte Routen ergänzen die Bedienung; Timeline-Bilder und Hilfe erleichtern die Orientierung. Ein angeschlossenes Gerät sollte dennoch vor Ort mit dem tatsächlichen Audiosignal geprüft werden.

## Neu

### Professionelles Audio-Routing

Videos, Background Audio, Systembenachrichtigungen, Vorhören und LiveQuiz-Soundeffekte besitzen getrennte, gerätebezogene Ausgänge mit Lautstärke, Mute und Testton.

### Vollständiges Hilfezentrum

Schnellstart, Livebetrieb, Audio, Präsentation und System enthalten ausführliche Bedien-, Preflight-, Fehler- und Problemlösungshilfen sowie kontextbezogene Hilfe-Schaltflächen.

### Timeline-Vorschaubilder

Die aufgeklappte Timeline kann kleine echte Folienvorschaubilder anzeigen; die Darstellung lässt sich in den Präsentationseinstellungen deaktivieren.

## Verbessert

### Sicheres Geräte-Fallback

Getrennte Audiogeräte werden anhand stabiler IDs wiedererkannt; getrennte oder fehlende Geräte werden sichtbar gemeldet und sicher durch Systemstandard ersetzt.

### Ausfallende Veranstaltungen

Ausfallende Firebase-Veranstaltungen bleiben chronologisch sichtbar, tragen „Fällt aus!“ und sind für neue Verknüpfungen per Maus und Tastatur gesperrt; bestehende Verbindungen bleiben mit Warnung erhalten.

### Preflight prüft Audiowege

Preflight kontrolliert benötigte Video- und Background-Ausgänge sowie nicht blockierende Preview- und Benachrichtigungsausgänge und zeigt den Fallback verständlich an.

## Behoben

### Cloudstatus stabilisiert

Eine erreichbare Medien-Cloud bleibt als verbunden sichtbar, selbst wenn eine leere oder vorübergehend nicht lesbare Medienliste zurückkommt; der Status wird regelmäßig neu geprüft.

### Audio-Routen überschreiben sich nicht

Die frühere globale Audioauswahl überschreibt die neue Background-Audio-Route nicht mehr; laufende Wiedergabe wird bei Änderungen nicht neu gestartet.

### Präsentationstitel begrenzt

Titel sind beim Erstellen, Laden, Umbenennen und Speichern konsistent auf maximal 500 Zeichen begrenzt.

---

# GottesdienstRegie 0.29.0

Veröffentlicht: Di., 08.09.2026

Schriften, Medienauswahl und Statusanzeigen werden zusammen überarbeitet. Cera Pro wird mit der Anwendung ausgeliefert und ist damit nicht nur ein ausgewählter Name in der Schriftliste. Weitere Korrekturen betreffen sichtbare Servicezeiten, Übergangsvorschau und den Leerzustand der Medienbibliothek.

## Neu

### Cera Pro vollständig mitgeliefert

Alle zwölf bereitgestellten Schnitte von Thin bis Black, jeweils normal und kursiv, sind direkt in der Anwendung enthalten und benötigen keine Systeminstallation.

### Mehr moderne Schriften

Über 40 zusätzliche moderne Sans-, Serif-, Display- und Monospace-Familien erweitern die Schriftartenauswahl.

### Cloudstatus im Kopf

Ein grünes Cloudsymbol oben rechts zeigt sofort, wenn der Medien-Cloudspeicher erreichbar ist.

## Verbessert

### Medienbibliothek und Unsplash

Öffentliche Cloud-Repositories lassen sich jetzt lesen, authentifizierte Uploads bleiben geschützt und Unsplash-Suchen laufen zuverlässig über den Desktop-Prozess.

### Sicherer ON-AIR-Start

ON AIR kann erst gestartet werden, wenn die Präsentation dauerhaft mit einer Firebase-Veranstaltung verknüpft ist.

### Ausführlichere Hilfe

Erste Schritte führt jetzt detailliert durch Präsentation, Veranstaltung, Ablauf, Medien, Displays, Vorschau, ON AIR und sichere Speicherung.

## Behoben

### Servicezeit bleibt sichtbar

Das Servicezeit-Popup wird nicht mehr links abgeschnitten und passt sich vollständig in die Ablaufspalte ein.

### Übergangsvorschau reagiert

VORSCHAU ANSEHEN zeigt nun einen klar erkennbaren Übergang statt dieselbe Folie unmerklich gegen sich selbst zu wechseln.

### Sauberer Medien-Leerzustand

Der doppelte und abgeschnittene Hinweis wurde entfernt; es erscheint nur noch „Wähle bitte ein Medium aus.“.

### Eigenständiges Medienfenster

Der überflüssige zweite Schließen-Button entfällt und Fenstertitel folgen dem Schema „GottesdienstRegie - Medienbibliothek“.

---

# GottesdienstRegie 0.28.0

Veröffentlicht: Di., 08.09.2026

Veranstaltungsdaten, Medienquellen und der Präsentationskopf werden enger miteinander verbunden. Eine verknüpfte Veranstaltung liefert weiterhin ihre ursprüngliche Planzeit; die Darstellung und Bearbeitung der Servicezeit ist davon zu unterscheiden. Die Schriftbereitstellung und Beschriftungen werden ebenfalls vereinheitlicht.

## Neu

### Firebase-Veranstaltungen

Präsentationen werden über den dauerhaften eventKey mit veranstaltungen/<eventKey> verknüpft; Auswahl, Suche und kompakter Kopf sind integriert.

### Cera Pro eingebettet

Eine lizenzierte Cera-Pro-Datei kann in den Schriftarten-Einstellungen eingebettet und ohne Systeminstallation verwendet werden.

### Unsplash und Cloud-Medien

Die Medienbibliothek arbeitet als Cloud-Bibliothek und kann Unsplash nach lokaler Eingabe eines Access Keys durchsuchen.

## Verbessert

### Präsentationskopf

Titel lassen sich inline bearbeiten; verknüpfte Veranstaltung, aktuelle Servicezeit und Verspätung erscheinen kompakt über dem Ablauf.

### Logo und Webauftritt

Die Logo-Schnellanzeige nutzt das Philippus-Gemeindelogo, kann angepasst werden und die App sowie Versionshinweise besitzen ein Favicon.

### Eindeutige Beschriftungen

MAIN LIVE heißt jetzt EINZELVORSCHAU und Hinweise verwenden eine freundlichere Bitte-Formulierung.

## Behoben

### Planzeit bleibt erhalten

Servicezeitänderungen überschreiben nicht mehr die planmäßigen start_/ende_-Felder, sondern aktualisieren ausschließlich die vorhandenen Verspaetungs*-Felder bei gleicher Dauer.

---

# GottesdienstRegie 0.27.0

Veröffentlicht: Mo., 07.09.2026

Diese Ausgabe konzentriert sich auf die MAIN-Ansicht und einen einheitlicheren typografischen Auftritt. Cera Pro wird als Standard gewählt, und die Amen-Schnellanzeige erhält eine Animation. Übergänge und Statusabläufe werden im Zusammenhang mit der Bedienung des Hauptausgangs angepasst.

## Neu

### Cera Pro als Standard

Neue Folien und Texte starten mit Cera Pro; zentrale Schriftarten-Einstellungen steuern Familie, Größe und Gewicht.

### MAIN-Liveansicht

Die Einzelansicht zeigt MAIN und schaltet ON AIR mit großen Pfeilen oder den Links-/Rechts-Tasten direkt live weiter.

### Animiertes Amen

Die neu gestaltete Amen-Schnellanzeige erscheint sechs Sekunden mit dynamischer Typografie und stellt danach die MAIN-Folie wieder her.

## Verbessert

### Übergang und Synchronisation

Der Standardübergang besitzt eine kleine Vorschau; Autosave läuft alle 15 Sekunden und das Wolkensymbol zeigt vier Sync-Schritte.

### Konsequent auf MAIN

Weitere Ausgangsreiter und die Karte „Ausgewählt“ entfallen, während Datei-Untermenüs sauber am jeweiligen Eintrag ausgerichtet sind.

## Behoben

### Saubere Bedienabläufe

Element hinzufügen schließt nach dem Anlegen automatisch, die Dauerneingabe ist nicht mehr eingeengt und Pfeiltasten wechseln nicht doppelt.

---

# GottesdienstRegie 0.26.0

Veröffentlicht: Mo., 07.09.2026

Mehr Übergänge und Schriftoptionen erweitern die Gestaltung. Die Vorschau wird stärker auf das Ergebnis ausgerichtet und soll Änderungen direkt sichtbar machen. Die dokumentierte Entfernung einer Bereitschaftsanzeige ist eine Oberflächenänderung und hebt Prüfungen vor ON AIR nicht grundsätzlich auf.

## Neu

### Mehr Übergänge

Iris, Vorhang, Würfel, Einschwingen, Lichtblitz und Aufskalieren erweitern die Animationsauswahl.

### Mehr als 120 Schriften

Zusätzliche Systemschriften für Fließtext, Überschriften, Handschrift und Monospace stehen im Editor bereit.

## Verbessert

### Konzentrierte Vorschau

Ausgangsauswahl und Bearbeitungswerkzeuge bleiben im Vorschaumodus verborgen; die Einzelansicht folgt der hellen oder dunklen Darstellung.

### Sofortige Bearbeitungsvorschau

Änderungen an der ausgewählten Folie werden ohne Verzögerung rechts angezeigt.

## Behoben

### Bereitschaftsanzeige entfernt

Symbol und Text „BEREIT“ belegen in der Vorschau keinen Platz mehr.

---

# GottesdienstRegie 0.25.0

Veröffentlicht: Mo., 07.09.2026

Eigene Ablaufvorlagen und zusätzliche Präsentationsinformationen unterstützen die Vorbereitung wiederkehrender Gottesdienste. Vorschau, Übergänge und Schriftoptionen werden erweitert. Ein eigener Fehlerpunkt betrifft Schwarzbilder nach einem Übergang und damit die Kontinuität der Folienanzeige.

## Neu

### Gesteuerte Einzelansicht

Große Pfeile, Links-/Rechts-Tastatursteuerung und ein anklickbarer Folientimer ermöglichen eine konzentrierte, sichere Vorschau.

### Eigene Ablaufvorlagen

Abläufe lassen sich als eigene Vorlage speichern, für neue Präsentationen auswählen und bei Bedarf wieder löschen.

### Präsentationsinformationen

Metadaten, Umfang, Dauer und bis zu 60 Bearbeitungen sind in einem übersichtlichen Informationsfenster zusammengefasst.

## Verbessert

### Mehr Übergänge und Schriften

Fünf zusätzliche Übergangseffekte und mehr als 65 Systemschriften erweitern die Gestaltungsmöglichkeiten.

## Behoben

### Kein Schwarzbild nach Übergängen

Die neue Folie bleibt nach dem Ende einer Animation vollständig sichtbar.

---

# GottesdienstRegie 0.24.0

Veröffentlicht: Mo., 07.09.2026

Die Vorschau erhält einen eigenständiger aufgebauten Arbeitsplatz mit anpassbarer Folienübersicht. Editor-Auswahl und live gezeigte Folie werden getrennt gehalten. Virtual Screens und Schnellanzeigen ergänzen diesen Ablauf, ohne Editor-Platzhalter in die Ergebnisvorschau zu übernehmen.

## Neu

### Professioneller Vorschau-Arbeitsplatz

Ablauf, vollständige gruppierte Folienübersicht und rechte Live-/Schnellanzeigenleiste sind jetzt gleichzeitig in einem dichten Drei-Bereich-Layout sichtbar.

### Getrennte Auswahl und Live-Folie

Eine Folie kann vorbereitet und navigiert werden, während die tatsächlich aktuelle ON-AIR-Folie separat und eindeutig markiert bleibt.

## Verbessert

### Responsive Folienübersicht

Acht gespeicherte Thumbnailstufen, kompakte leere Sections, echte Dauern und verzögertes Rendern nutzen kleine wie große Bildschirme effizienter.

### Virtual Screens und Schnellanzeigen

MAIN, LIVESTREAM, STAGE, NOTIZEN und SIGNALE sind verbunden; konfigurierte Schnellanzeigen erscheinen als echte bedienbare Vorschaukacheln.

## Behoben

### Keine Editor-Platzhalter in Preview

Reine Bearbeitungshinweise werden nicht mehr als Präsentationsinhalt gerendert, und eine Preview-Auswahl verändert MAIN nicht.

---

# GottesdienstRegie 0.23.0

Veröffentlicht: Mo., 07.09.2026

Folienübergänge bekommen eine gemeinsame Auflösung von Standard- und individuellen Einstellungen. Eine Vorschau im Editor hilft beim Prüfen des Effekts vor der Ausgabe. Bestehende Präsentationen sollen ihre nutzbare Übergangskonfiguration beim Wechsel auf diese Version behalten.

## Neu

### Professionelle Folienübergänge

Schnitt, Überblenden, Kreuzblende, Auflösen, Schieben und Wischen stehen für MAIN, LIVESTREAM und LOBBY bereit. Richtung, Dauer und Bewegung lassen sich präzise einstellen.

### Übergangs-Vorschau im Editor

Ein eigener Vorschau-Button spielt den Effekt im Editor ab, ohne MAIN oder die aktive Live-Folie zu verändern.

## Verbessert

### Klare Standard-Hierarchie

Präsentationsstandard, Ablauf-Element und einzelne Folie greifen nachvollziehbar ineinander. Überschreibungen können jederzeit auf den übergeordneten Standard zurückgesetzt werden.

### Sichere Live-Wiedergabe

Schnelles Weiterschalten ersetzt einen laufenden Effekt sofort. STAGE bleibt beim direkten Schnitt und Background Audio läuft unabhängig weiter.

## Behoben

### Kompatibilität bestehender Präsentationen

Bisherige Übergangsfelder werden beim Laden automatisch in das neue Modell übertragen.

---

# GottesdienstRegie 0.22.0

Veröffentlicht: Mo., 07.09.2026

Der Fokus liegt auf klaren Grenzen für Audiowiedergabe: Bearbeiten, Vorschau und ON AIR sollen nicht unbeabsichtigt denselben Wiedergabestatus teilen. Die Lautsprechersteuerung wird eindeutiger, und OFF AIR soll laufende Musik zuverlässig stoppen.

## Neu

### Audio nur in Vorschau und ON AIR

Background Audio wird nur im Vorschaumodus oder während einer aktiven Ausgabe wiedergegeben. Der Bearbeitungsmodus bleibt stumm.

## Verbessert

### Eindeutige Lautsprechersteuerung

Abschnitte, Ablauf-Elemente, Playlist und Live-Controller verwenden jetzt Lautsprecher- und Wiedergabesymbole. Musiknoten kennzeichnen ausschließlich echte Songs.

## Behoben

### OFF AIR stoppt Musik zuverlässig

Beim Beenden von ON AIR stoppt die aktive Audio-Session und startet nicht durch eine weiterhin geöffnete Vorschau erneut. Item-Audio mit der Regel „Ende der Section“ endet außerdem am tatsächlichen Abschnittswechsel.

---

# GottesdienstRegie 0.21.0

Veröffentlicht: Mo., 07.09.2026

Fehlerberichte werden strukturiert erfasst, damit Beschreibung und Diagnose besser zusammenpassen. Eine eigene Release-Notes-Seite macht den Versionsverlauf zugänglich. Zusätzlich werden gezielter Import sowie die Positionierung von Menüs und Hilfebereichen überarbeitet.

## Neu

### Strukturierte Fehlerberichte

Der Hilfe-Bereich erstellt jetzt einen vollständigen Bericht mit Beschreibung, Reproduktionsschritten, erwartetem Verhalten und optionalen bereinigten Diagnosedaten.

## Verbessert

### Neue Release-Notes-Webseite

Die öffentliche Dokumentation verwendet jetzt eine klare, an professionelle Entwicklerdokumentation angelehnte Navigation mit Versionsleiste, Suche, Direktlinks, Sprachwahl, Hell-/Dunkelmodus und responsiver Darstellung.

### Gezielter Präsentationsimport

PowerPoint, Keynote und OpenDocument, Text und Markdown sowie GottesdienstRegie-Dateien besitzen getrennte Importaktionen und passende Dateifilter.

## Behoben

### Menüposition und Hilfe-Layout

Das Import-Untermenü öffnet auf Höhe der gewählten Zeile. Das Hilfe-Menü ist breiter, zeigt eindeutige Symbole und bricht kurze Bezeichnungen nicht mehr unschön um.

---

# GottesdienstRegie 0.20.0

Veröffentlicht: Mo., 07.09.2026

Hintergrundaudio kann an Abschnitte und einzelne Ablauf-Elemente gebunden werden. Ein eigener Browser und ein Live-Audiocontroller ergänzen die Auswahl und Wiedergabe. Preflight berücksichtigt Audio, und Folienloops sollen laufende Musik nicht unnötig neu starten.

## Neu

### Background Audio für Abschnitte

VORPROGRAMM, WARM-UP, GOTTESDIENST und NACHPROGRAMM können eigene Cloud-Playlists besitzen. Visuelle Schleifen laufen unabhängig und starten die Musik nicht erneut.

### Audio für Ablauf-Elemente

Ein Ablauf-Element kann die Abschnittsmusik vorübergehend ersetzen. Audio-Stop-Cues beenden die Wiedergabe gezielt und sind über Rückgängig wiederherstellbar.

### Eigener Audio Browser

Das neue Systemfenster zeigt ausschließlich echte Audiodateien aus dem Team-Cloudspeicher, unterstützt Mehrfachauswahl, Hörprobe und eine sortierbare Auswahlleiste.

### Live-Audiocontroller

Während der Wiedergabe stehen Titelanzeige, Zeit, Pause, Fortsetzen, nächster Titel, Stop, Stummschaltung und Lautstärke direkt in der Operator-Oberfläche bereit.

## Verbessert

### Professionelle Wiedergaberegeln

Playlists unterstützen Wiederholung, Zufallswiedergabe, Ein- und Ausblenden, Übergänge, Fortsetzungsregeln und automatische Absenkung bei Videos mit Ton.

### Audio-Preflight

Vor ON AIR werden nicht vorbereitete oder fehlende Background-Audio-Dateien verständlich gemeldet. Dauerhafte lokale Dateipfade werden nicht als Cloudquelle ausgegeben.

## Behoben

### Musik bleibt bei Folienloops stabil

Der Neustart eines PRE- oder POST-Folienloops setzt den laufenden Audiotitel nicht mehr auf den Anfang zurück.

---

# GottesdienstRegie 0.19.0

Veröffentlicht: Mo., 07.09.2026

Tastenkürzel werden anpassbar und erhalten eine abgesicherte Bearbeitung. Die Hilfe ergänzt echte Bildschirmabbildungen zur Orientierung im Programm. Ein konfigurierbarer Vollbildmodus erweitert die Arbeitsplatzdarstellung, unabhängig von der Gestaltung der ausgegebenen Folien.

## Neu

### Anpassbare Tastenkürzel

Unter Einstellungen → Tastenkürzel können Speichern, Rückgängig, Wiederholen, Live-Navigation, Moduswechsel, Vollbild und ON AIR neu belegt werden. Änderungen werden lokal gespeichert und sofort angewendet.

### Echte Screenshots in der Hilfe

Die integrierte Hilfe zeigt jetzt echte Aufnahmen von Arbeitsbereich, Einstellungsfenster und Medienbibliothek mit passenden Beschreibungen.

## Verbessert

### Ausführlichere Hilfe

Zusätzliche Hilfekapitel erklären Einstellungen, Songs, Bibel, STAGE, Schnellanzeigen, Timer, Fernsteuerung und Tastenkürzel ausführlich und praxisnah.

### Sichere Kürzelbearbeitung

Doppelte Tastenkombinationen werden erkannt und abgewiesen. Eine laufende Eingabe kann mit Escape abgebrochen und die gesamte Belegung auf Standard zurückgesetzt werden.

## Behoben

### Konfigurierbares Vollbild

F11 ist nicht mehr fest im Desktop-Prozess verdrahtet. Das Bedienfenster reagiert nun ausschließlich auf das in den Einstellungen festgelegte Vollbild-Kürzel.

---

# GottesdienstRegie 0.18.0

Veröffentlicht: So., 06.09.2026

Präsentationen können umbenannt und aus zusätzlichen Formaten importiert werden. PowerPoint, OpenDocument, Keynote sowie Text und Markdown besitzen unterschiedliche Importwege; deren Ergebnis sollte vor ON AIR geprüft werden. Daneben werden Modusumschalter und Versionshinweise überarbeitet.

## Neu

### Präsentationen umbenennen

Die aktuell geöffnete Präsentation kann jetzt im Datei-Menü umbenannt werden. Der neue Name wird dauerhaft gespeichert und erscheint auch in der Präsentationsbibliothek.

### PowerPoint- und OpenDocument-Import

PPTX- und ODP-Dateien werden folienweise eingelesen. Erkannte Texte werden als bearbeitbare GottesdienstRegie-Folien angelegt.

### Keynote-Import

Keynote-Dateien können über ihre eingebettete Vorschau importiert werden. Für vollständig bearbeitbare Inhalte empfiehlt die Anwendung den vorherigen Export als PowerPoint-Datei.

### Text und Markdown importieren

Absätze aus TXT- und Markdown-Dateien können automatisch in einzelne Präsentationsfolien umgewandelt werden.

## Verbessert

### Abgerundeter Modus-Umschalter

Der Umschalter zwischen Bearbeiten und Vorschau ist jetzt abgerundet und befindet sich unmittelbar links neben ON AIR.

### Neue Release-Notes-Webseite

Die öffentliche Versionsübersicht besitzt ein modernes responsives Design, Suche, Sprachwahl sowie Schaltflächen zum gemeinsamen Auf- und Zuklappen aller Versionen.

---

# GottesdienstRegie 0.17.2

Veröffentlicht: So., 06.09.2026

Dieser kleine Aktualisierungsstand ergänzt eine Kurzbeschreibung zu einem angebotenen Update. Benutzer erhalten damit bereits im Updateablauf eine Einordnung der neuen Version. Ausführliche Änderungen bleiben im vollständigen Versionsverlauf nachlesbar.

## Neu

### Kurzinfo zum verfügbaren Update

Bei einem gefundenen Update zeigt die Statusbox jetzt eine kurze Übersicht der wichtigsten Neuerungen, Verbesserungen und Fehlerbehebungen. Die vollständigen Details bleiben in den Versionshinweisen.

---

# GottesdienstRegie 0.17.1

Veröffentlicht: So., 06.09.2026

Die Korrektur betrifft das Popup zur Servicezeit. Seine Inhalte sollen vollständig sichtbar bleiben, statt am Rand der Oberfläche abgeschnitten zu werden. Die zugrunde liegende Servicezeit erhält durch diesen reinen Darstellungsfix keine neue fachliche Bedeutung.

## Behoben

### Servicezeit-Popup vollständig sichtbar

Das Popup zum Festlegen der Startzeit bleibt vollständig innerhalb der Ablaufspalte. Überschrift, Zeitfeld und Schaltflächen werden links nicht mehr abgeschnitten. Bei schmalen App-Fenstern passt sich die Popupbreite an, ohne den Inhalt zu überdecken.

---

# GottesdienstRegie 0.17.0

Veröffentlicht: So., 06.09.2026

LiveQuiz erhält weitere Folien- und Vorschauoptionen, darunter eine Antwortfolie und QR-Vorschau. Fragenreihenfolge, Moderation und sichtbare Menüs werden überarbeitet. Schriftwahl, Thumbnail-Größen und Oberflächenanimationen ergänzen die Bedienung außerhalb des Quiz.

## Neu

### Antwortfolie für LiveQuiz

Jedes Quiz besitzt jetzt eine echte, frei gestaltbare Antwortfolie. Während einer Sitzung zeigt sie die Auswertung der aktiven Auswahlfrage oder freigegebene Freitextantworten.

### QR-Code-Vorschau

Die Teilnahmefolie zeigt bereits vor dem Start einen Vorschau-QR-Code. Beim automatischen Start wird dieser ohne Designverlust durch den echten Link und Code ersetzt.

### Erweiterte Schriftarten

Der Texteditor bietet eine deutlich größere Auswahl verbreiteter Präsentations- und Systemschriftarten mit direkter Vorschau.

## Verbessert

### Acht Thumbnail-Stufen

Die Folienübersicht besitzt jetzt acht feste Größenstufen und erlaubt deutlich größere Vorschaubilder, ohne die eigentliche Folie zu skalieren.

### Fragen neu anordnen

Quizfragen können direkt an ihren Reitern gezogen und neu angeordnet werden. Die zugehörigen Folien und Antwortauswertung folgen derselben Reihenfolge.

### Ruhigere Vorschau

Logo, Schwarz, Ohne Text, Amen und weitere Schnellanzeigen erscheinen ausschließlich im Vorschau-Modus. Die Bearbeitungsansicht bleibt auf die Inhaltserstellung konzentriert.

### Hilfe zur Oberfläche und zum Quiz

Die integrierte Hilfe erklärt Menüs, Bearbeitung, Vorschau sowie den Ablauf von Teilnahme über Fragen bis zur Auswertung mit zusätzlichen schematischen Darstellungen.

### Sanfte Oberflächenanimationen

Ansichten, Live-Status und Folien-Thumbnails verwenden dezente Animationen unter Beachtung der Systemeinstellung für reduzierte Bewegung.

### Mindestens drei Sekunden Updatesuche

Die animierte Updatesuche bleibt mindestens drei Sekunden sichtbar, damit der Prüfstatus klar wahrgenommen werden kann.

## Behoben

### Quizbeschreibung sichtbar

Die im Editor eingegebene Quizbeschreibung wird jetzt zuverlässig auf der Teilnahmefolie dargestellt und live aktualisiert.

### Menüs im Vordergrund

Die Dropdown-Menüs der Hauptnavigation werden nicht mehr durch Editor, Canvas, Popover oder andere Arbeitsbereiche verdeckt.

### Freitext-Moderation angewendet

Zurückgehaltene Freitextantworten werden auf MAIN nicht offengelegt. Der Bediener sieht stattdessen die Anzahl der geschützten Antworten.

---

# GottesdienstRegie 0.16.0

Veröffentlicht: So., 06.09.2026

Die Quiz-Teilnahmefolie wird bearbeitbar und der Quizstart enger mit dem Ablauf verbunden. Freitext kann zunächst zurückgehalten werden, bevor er auf der Ausgabe erscheint. QR-Darstellung, Vorschauwerkzeuge und Versionsverlauf werden ebenfalls erweitert.

## Neu

### Bearbeitbare Quiz-Teilnahmefolie

Jedes Quiz besitzt jetzt als erste Folie eine echte Teilnahmefolie mit Link, Teilnahmecode und QR-Code. Texte, Farben, Hintergrund und Positionen lassen sich mit denselben Werkzeugen wie bei anderen Folien gestalten.

### Automatischer LiveQuiz-Start

Wird während ON AIR zu einem Quiz gewechselt, startet die Sitzung automatisch und die Teilnahmefolie wird zuerst live geschaltet.

### Freitext zurückhalten

Für jede Freitextfrage kann festgelegt werden, ob eingehende Antworten bis zur Freigabe ausschließlich beim Bediener bleiben.

## Verbessert

### QR-Code im gemeinsamen Renderer

Der echte QR-Code wird in Editor, Vorschau und MAIN durch dieselbe Folien-Engine dargestellt; das gewählte Foliendesign bleibt dabei erhalten.

### Versionsverlauf

Version 0.13 mit den Builds 0.13.0 und 0.13.1 ist wieder vollständig in den Versionshinweisen enthalten.

## Behoben

### Fotomotiv-Beschreibung

Login-Fotomotive werden nicht mehr anhand ihrer zufälligen Listenposition mit einem möglicherweise falschen Aufnahmeort beschriftet.

### Werkzeuge in der Vorschau

Die Bearbeitungs- und Formatwerkzeuge werden im Vorschau-Modus vollständig ausgeblendet.

---

# GottesdienstRegie 0.15.4

Veröffentlicht: So., 06.09.2026

Die Updatesuche erhält eine animierte Rückmeldung und der Download eine Abbruchaktion. Der dokumentierte Abbruch betrifft auch die Netzwerkübertragung, nicht nur das Ausblenden des Dialogs. Dadurch werden sichtbarer Fortschritt und tatsächlicher Downloadzustand besser aufeinander abgestimmt.

## Neu

### Animierte Updatesuche

Die Punkte hinter der Updatesuche werden während der Prüfung fortlaufend animiert.

### Download abbrechen

Ein X rechts im Fortschrittsbalken beendet den laufenden Update-Download.

## Verbessert

### Echter Netzwerkabbruch

Der Download wird technisch über einen CancellationToken gestoppt und kann anschließend erneut gestartet werden.

---

# GottesdienstRegie 0.15.3

Veröffentlicht: So., 06.09.2026

Quizteilnahme und Teilnahmelink werden im Live-Arbeitsablauf leichter zugänglich. MAIN kann die Teilnahmeinformation zeigen, und mehrere Ausgänge werden berücksichtigt. LAST SHOWN ergänzt die Orientierung an zuvor gezeigten Inhalten.

## Neu

### Quizteilnahme auf MAIN

Quizname, QR-Code, Webadresse und sechsstelliger Teilnahmecode können direkt auf MAIN angezeigt werden.

### Mehrere Ausgänge

Die Teilnahmeansicht kann optional gleichzeitig an MAIN, STAGE, LIVESTREAM und LOBBY gesendet werden.

### Teilnahmelink kopieren

Der vollständige Teilnahmelink lässt sich direkt aus der Quizsteuerung kopieren.

## Verbessert

### LAST SHOWN

Die Teilnahmeansicht verändert die Livefolie nicht; LAST SHOWN stellt den vorherigen Zustand exakt wieder her.

---

# GottesdienstRegie 0.15.2

Veröffentlicht: So., 06.09.2026

Das Beenden der Anwendung wird über einen zentralen Ablauf geführt. Besonders Alt+F4 während ON AIR soll dieselben Schutzschritte durchlaufen wie andere Schließaktionen. Ziel dieses Stands ist ein kontrollierter Shutdown, nicht eine zusätzliche Präsentationsfunktion.

## Verbessert

### Zentraler Shutdown

Normales Schließen, Alt+F4 und Programmbeendigungen verwenden jetzt denselben sicheren Output-Shutdown.

## Behoben

### ON AIR bei Alt+F4

MAIN, STAGE und weitere Ausgabefenster werden geschlossen, bevor die Bedienoberfläche beendet wird.

---

# GottesdienstRegie 0.15.1

Veröffentlicht: So., 06.09.2026

Die Quizteilnahme erhält eine eigene Adresse. Damit wird der Zugang für Teilnehmer vom restlichen Bedienbereich getrennt und leichter kommunizierbar. Dieser kleine Stand ergänzt den zuvor eingeführten Quizablauf.

## Verbessert

### Eigene Quizadresse

Teilnahmelinks und lokal erzeugte QR-Codes verwenden dauerhaft https://pgbielefeld.neocities.org/quiz. Die Einrichtungsanleitung nennt die Neocities-Domain, die für die anonyme Firebase-Anmeldung freigegeben werden muss.

---

# GottesdienstRegie 0.15.0

Veröffentlicht: So., 06.09.2026

LiveQuiz wird um Teilnahmecode, QR-Code und mobile Teilnahme erweitert. Die Live-Steuerung berücksichtigt tatsächliche Teilnehmer- und Antwortzahlen. Die Behandlung von Antworten ist von der vorbereiteten Quizfolie zu unterscheiden und benötigt den jeweiligen aktiven Quizlauf.

## Neu

### Teilnahmecode und QR-Code

Ein bewusster LiveQuiz-Start erzeugt einen echten sechsstelligen Teilnahmecode und einen lokal gerenderten QR-Code.

### Mobile Teilnahme

Eine responsive HTML-, CSS- und JavaScript-Seite ermöglicht die anonyme oder namentliche Teilnahme per Smartphone.

### Live-Steuerung

Der Bediener kann Fragen einzeln öffnen, Antworten schließen und die Sitzung kontrolliert beenden.

## Verbessert

### Echte Zähler

Teilnehmer und Antworten auf die aktive Frage werden aus Firebase in Echtzeit gezählt.

---

# GottesdienstRegie 0.14.0

Veröffentlicht: So., 06.09.2026

LiveQuiz wird als Element des Gottesdienstablaufs eingeführt. Quizeditor, Fragetypen und gemeinsamer Renderer bilden die vorbereitende Grundlage; Speicherung und Historie werden angebunden. Der angezeigte Live-Status soll zwischen vorbereiteten Inhalten und einem tatsächlich laufenden Quiz unterscheiden.

## Neu

### LiveQuiz im Ablauf

LiveQuiz kann über Element hinzufügen und das Plus im Ablauf als eigener ServiceItem-Typ erstellt werden.

### Quizeditor

Der spezialisierte Editor verwaltet mehrere Fragen, Antwortoptionen, richtige Lösungen, Zeitlimits, Punkte und die Teilnahmeart.

### Fragetypen

Single Choice, Multiple Choice, Richtig/Falsch, Ja/Nein, Freitext, Skala und Umfrage stehen im Editor bereit.

## Verbessert

### Gemeinsamer Renderer

Quizfragen werden als echte Folien in Editor, Vorschau, Raster und MAIN identisch dargestellt.

### Speicherung und Historie

Quizdefinitionen bleiben in der Präsentation erhalten und sind in Autosave sowie Undo/Redo eingebunden.

---

# GottesdienstRegie 0.13.1

Veröffentlicht: So., 06.09.2026

Dieser Wartungsstand behandelt die Übernahme von Cloud-Mediendaten sowie unterbrochene Übertragungen. Medienfenster und Präsentationsmenü erhalten begleitende Korrekturen. Eine abgebrochene Übertragung ist nicht mit einer vollständig verfügbaren Mediendatei gleichzusetzen.

## Verbessert

### Cloud-Migration

Lokale Medien lassen sich kontrolliert in die private GitHub-Medienbibliothek übertragen, während die Quelldateien erhalten bleiben.

### Medienfenster

Status, Upload und Verwaltung der Medienbibliothek reagieren auch bei unterbrochenen Übertragungen verständlich.

## Behoben

### Unterbrochene Übertragung

Bereits übertragene Medien bleiben erhalten und übrige Dateien können später erneut hochgeladen werden.

### Präsentationsmenü

Die Befehle im Präsentationsmenü öffnen wieder zuverlässig die vorgesehenen Ansichten.

---

# GottesdienstRegie 0.13.0

Veröffentlicht: So., 06.09.2026

Eine private Medienbibliothek mit eigenem Fenster ergänzt die lokale Präsentationsarbeit. Medienraster und Speicherstatus erleichtern Auswahl und Verwaltung. Die Cloudanzeige wird überarbeitet, damit sie den Zustand der Medienanbindung verständlicher vermittelt.

## Neu

### Private Cloud-Medienbibliothek

Bilder, Videos und Audiodateien können zusätzlich zur lokalen Bibliothek sicher in einer privaten GitHub-Ablage verwaltet werden.

### Eigenständiges Medienfenster

Die Medienbibliothek steht als eigenes Desktop-Fenster mit Suche, Filtern und Medienaktionen bereit.

## Verbessert

### Medienraster

Vorschaubilder, Metadaten und Aktionen sind in einem übersichtlichen Raster zusammengeführt.

### Speicherstatus

Die Oberfläche unterscheidet lokale Dateien und Cloud-Medien eindeutig und zeigt den tatsächlichen Übertragungszustand.

## Behoben

### Irreführende Cloud-Anzeige

Medien werden nicht mehr als online verfügbar dargestellt, bevor ihre Übertragung erfolgreich abgeschlossen wurde.

---

# GottesdienstRegie 0.12.0

Veröffentlicht: So., 06.09.2026

Das Datei-Menü bündelt Präsentationsdialoge und unterschiedliche Duplizieraktionen. Kopien sollen eindeutig voneinander unterscheidbar bleiben. Tastaturbedienung, Menüfokus und Live-Sicherheit werden bei diesen Aktionen ebenfalls berücksichtigt.

## Neu

### Datei-Menü

Ein mehrstufiges Datei-Menü bündelt Neu, Öffnen, zuletzt verwendete Präsentationen, Duplizieren, Import, Sicherung, Wiederherstellung, Drucken, Teilen und Beenden.

### Präsentationsdialoge

Neue Präsentationen erfassen Titel, Datum, Servicezeit, Team und Vorlage; Öffnen und Duplizieren bieten Suche, Sortierung, Metadaten und echte Folienminiaturen.

### Duplizieroptionen

Beim Duplizieren können Servicezeit, Medienreferenzen und Zielzeiten gezielt übernommen werden.

## Verbessert

### Eindeutige Kopien

Kopien erhalten neue IDs für Präsentation, Bereiche, Ablauf-Elemente, Folien und Canvas-Elemente.

### Tastaturbedienung

Pfeiltasten navigieren im Datei-Menü; Escape schließt Untermenü, Hauptmenü und Dialoge in der richtigen Reihenfolge.

### Live-Sicherheit

Beim Beenden während ON AIR warnt die Anwendung und beendet aktive Ausgaben erst nach ausdrücklicher Bestätigung.

## Behoben

### Zuletzt duplizieren

Der ausgewählte Eintrag wird nun im Duplizieren-Dialog korrekt vorausgewählt.

### Menüfokus

Nach dem Schließen eines Datei-Dialogs kehrt der Tastaturfokus zuverlässig zum Datei-Menü zurück.

---

# GottesdienstRegie 0.11.1

Veröffentlicht: Mi., 02.09.2026

Diese Wartungsausgabe behandelt hellen und dunklen Darstellungsmodus sowie die zugehörigen Einstellungen. Im Mittelpunkt steht die Lesbarkeit der Bedienoberfläche. Die gewählte Oberflächenfarbe ist von Farben und Hintergründen der eigentlichen Folien zu unterscheiden.

## Behoben

### Heller Modus

Menü, Ablauf, Editor, Timeline und Werkzeugbereiche übernehmen nun vollständig das helle Farbschema und bleiben kontrastreich lesbar.

### Einstellungen

Titel, Bereichsüberschriften und die Schließen-Schaltfläche erben keine helle Produktionsschrift mehr und sind auf dem weißen Dialoghintergrund wieder deutlich sichtbar.

### Dunkler Modus

Die Korrektur ist auf das helle Farbschema begrenzt; die bewährten dunklen Produktionsfarben bleiben unverändert.

---

# GottesdienstRegie 0.11.0

Veröffentlicht: Mi., 02.09.2026

Hintergrundauswahl, Bildanpassung, Hilfslinien und Ebenenanordnung werden in die Bearbeitung integriert. Der gemeinsame Renderer verbindet Editor und Ausgabe. Weitere Verbesserungen betreffen Medienauswahl, Folienübersicht, kleinere Fenster und Textformatierung.

## Neu

### Hintergrund-Menü

Ein kompaktes Produktionsmenü ermöglicht Medienauswahl, direkten Bildimport, zuletzt verwendete Bilder und eine sofort anwendbare Farbpalette.

### Bildanpassung

Hintergrundbilder lassen sich weichzeichnen, drehen, an Höhe oder Breite anpassen, ausfüllen, einpassen und exakt ausrichten.

### Hilfslinien

Canvas Smart Guides, Randhilfen und die Drittelregel können unabhängig aktiviert werden und erscheinen ausschließlich im Editor.

### Anordnen

Elemente können nach vorn oder hinten gelegt, an allen sechs Kanten und Mittellinien ausgerichtet, gedreht, gespiegelt und gesperrt werden.

## Verbessert

### Zentraler Renderer

Hintergrundfarbe, Bild, Position, Unschärfe, Rotation sowie gespiegelte und kursive Elemente werden in Editor, Vorschau, Miniaturen und Live-Ausgabe identisch gerendert.

### Medienauswahl

Wird die Medienbibliothek über das Hintergrund-Menü geöffnet, setzt die Auswahl den Folienhintergrund und erzeugt kein zusätzliches Ablauf-Element.

### Folienübersicht

Der gespeicherte Regler für die Miniaturgröße verändert nun sichtbar die Rastergröße, ohne Inhalte oder Canvas-Auflösung zu beeinflussen.

## Behoben

### Kleine Fenster

Eine ältere Responsive-Regel blendet Ausrichtungs- und Drehbefehle in kompakten Fenstergrößen nicht mehr versehentlich aus.

### Textformatierung

Die Kursiv-Schaltfläche wirkt jetzt sichtbar im gemeinsamen Folienrenderer.

---

# GottesdienstRegie 0.10.0

Veröffentlicht: Mi., 02.09.2026

Der Produktionsarbeitsbereich führt Songeditor, Ablauf und Timeline deutlicher zusammen. Startbildschirm, Updatebedienung und Tastaturwege werden überarbeitet. Servicezeiten lassen sich in diesem Arbeitsablauf festlegen und bleiben Teil der Präsentationsvorbereitung.

## Neu

### Produktionsarbeitsbereich

Ablauf, spezialisierter Kontexteditor und große Ausgabenvorschau bilden jetzt eine dichte professionelle Arbeitsfläche mit dauerhaft sichtbaren Output-Tabs und Formatierungsleiste.

### Songeditor

Songs zeigen Arrangement, Tonart, direkt bearbeitbare Abschnitte, Metadaten, CCLI-Optionen und mehrere echte Folienvorschauen gleichzeitig.

### Timeline

Eine aufklappbare und in der Höhe anpassbare Timeline visualisiert alle aktiven Elemente mit Dauer und Liveposition.

### Startbildschirm

Der Startvorgang verwendet das konfigurierte Loginmotiv als Vollbildhintergrund und zeigt in einer eigenen dunklen Karte ausschließlich echte Ladephasen mit ruhigem Spinner.

## Verbessert

### Ablauf

Abschnitte, echte Miniaturansichten, Dauern, Wiederholung, Auswahl und Livezustand sind kompakter und bei 1920 × 1080 gleichzeitig mit Editor und Vorschau sichtbar.

### Updates

Beim Herunterladen wird die Restzeit aus übertragenen Bytes und einer geglätteten realen Downloadgeschwindigkeit berechnet.

### Tastaturbedienung

Escape schließt im Haupteditor das jeweils oberste Menü oder Dialogfenster; Sicherheitsdialoge werden dabei immer abgebrochen.

## Behoben

### Zeit festlegen

Der kompakte Zeitdialog verändert den Aufklappzustand des Gottesdienstbereichs nicht und verwirft Änderungen mit Escape.

---

# GottesdienstRegie 0.9.2

Veröffentlicht: Mi., 02.09.2026

Der professionelle Arbeitsbereich wird als Standard stärker hervorgehoben. Kompakte Ablaufzeiten und überarbeitete Dialogebenen unterstützen die Desktop-Bedienung. Einstellungen und Zeitbearbeitung erhalten Korrekturen, damit wichtige Aktionen nicht hinter anderen Flächen verschwinden.

## Verbessert

### Professioneller Standardmodus

Bei neuen Installationen verwendet die Produktionsoberfläche standardmäßig das dunkle Design; bereits gespeicherte persönliche Einstellungen bleiben unverändert.

### Kompakte Ablaufzeiten

Dauern unter einer Minute werden als 7s, 10s oder 45s angezeigt; ab einer Minute verwendet GottesdienstRegie weiterhin das Format 1:00 oder 3:06.

### Tastaturbedienung

Das Einstellungsfenster kann jetzt mit Escape geschlossen werden; ein geöffneter Beta-Hinweis wird dabei zuerst geschlossen.

## Behoben

### Einstellungsfenster

Der Auswahlrahmen eines Textfelds oder anderen Canvas-Elements kann nicht mehr vor dem Einstellungsfenster dargestellt werden.

### Dialogebenen

Einstellungen, Hilfe, Medien- und Präsentationsbibliothek sowie Bestätigungsdialoge verwenden eine gemeinsame geschützte oberste Ebene.

### Zeitbearbeitung

Kurze Zeitwerte mit Sekundenkürzel lassen sich weiterhin direkt bearbeiten und werden korrekt gespeichert.

---

# GottesdienstRegie 0.9.1

Veröffentlicht: Di., 01.09.2026

Ein Beta-Kanal ergänzt die stabile Updateversorgung. Hinweise zum gewählten Kanal und zur Rückkehr auf eine stabile Ausgabe werden sichtbar gemacht. Mehrere Servicezeiten sowie Kopf- und Einklappaktionen erhalten begleitende Verbesserungen.

## Neu

### Beta-Update-Kanal

Unter Einstellungen → Updates können Vorabversionen jetzt gezielt aktiviert werden. Ohne Aktivierung berücksichtigt GottesdienstRegie weiterhin ausschließlich stabile Veröffentlichungen.

### Mehrere Servicezeiten

Für den Gottesdienst lassen sich mehrere Startzeiten hinzufügen, einzeln bearbeiten, entfernen und dauerhaft mit der Präsentation speichern.

## Verbessert

### Beta-Hinweis

Beim ersten Aktivieren erklärt ein einmaliger, verständlicher Dialog die möglichen Einschränkungen von Beta-Versionen. Der aktuelle Kanal und Beta-Versionen werden klar, aber nicht alarmierend gekennzeichnet.

### Versionshinweise

Vorabversionen werden als „Version … Beta“ beziehungsweise RC dargestellt und können zusätzlich die Kategorie „Bekannte Probleme“ enthalten.

### Rückkehr zu Stabil

Bei installierter Beta-Version wird die Rückkehr zur stabilen Ausgabe eindeutig angeboten; Präsentationskompatibilität und Backup-Möglichkeit bleiben Teil der Sicherheitsprüfung.

## Behoben

### Zeit festlegen

Ein Klick auf „ZEIT FESTLEGEN“ oder eine vorhandene Startzeit öffnet jetzt ausschließlich die Zeitbearbeitung und klappt den Bereich GOTTESDIENST nicht mehr unbeabsichtigt ein oder aus.

### Header-Aktionen

Pfeil, Abschnittstitel, Zeitfeld und Hinzufügen-Schaltfläche besitzen getrennte Klickbereiche und lösen durch Event Bubbling keine zweite Aktion mehr aus.

### Collapse-Zustand

Der Ein-/Ausklappzustand der Ablaufbereiche wird unabhängig von den Servicezeiten lokal gespeichert und bleibt bei Zeitänderungen exakt erhalten.

---

# GottesdienstRegie 0.9.0

Veröffentlicht: Di., 01.09.2026

Diese umfangreichere Ausgabe verbindet Ablaufzeiten, WARM-UP und zeitgesteuerte Wechsel mit erweiterten Medienquellen. Audioelemente und Live-Timer ergänzen den Ablauf. Korrekturen betreffen unter anderem lokale Videos, Medienende und Schleifenwechsel.

## Neu

### Ablaufzeiten

Elemente und einzelne Folien besitzen jetzt echte Wiedergabezeiten; Abschnittssummen werden automatisch berechnet und Zeiten lassen sich direkt im Ablauf oder im Eigenschaftenbereich bearbeiten.

### WARM-UP

Der Ablauf verwendet jetzt die vier klar getrennten Bereiche VORPROGRAMM, WARM-UP, GOTTESDIENST und NACHPROGRAMM; ältere ANKOMMEN-Inhalte werden automatisch übernommen.

### Zeitgesteuerter Übergang

Wenn ON AIR bereits aktiv ist, wechselt das Vorprogramm passend zur berechneten WARM-UP-Dauer und der hinterlegten Servicezeit in WARM-UP und anschließend in den Gottesdienst.

### GitHub-Medienbibliothek

Lokale Medien können prüfsummenbasiert in das öffentliche Repository GottesdienstRegie-Media synchronisiert werden; der Online- und Uploadstatus ist direkt in der Medienbibliothek sichtbar.

### Medien-Provider

Eine erweiterbare StorageProvider-Schnittstelle trennt lokalen Cache und GitHub-Speicher und bereitet weitere kostenlose oder selbst gehostete Speicherziele vor.

### Echte Audioelemente

Importierte Audiodateien werden als echte Player-Elemente gerendert, starten im Live-Ausgang automatisch und können nach dem Ende zur nächsten Folie wechseln.

### Live-Timer

Timer und Countdowns zählen in der tatsächlichen MAIN-Ausgabe sekundengenau und zeigen nach Ablauf den konfigurierten Endtext.

## Verbessert

### Bearbeiten/Vorschau

Die Umschaltung entspricht jetzt dem kompakten Referenzdesign mit zwei Beschriftungen, zentralem Schiebeschalter und gelber Markierung des aktiven Modus.

### Startbildschirm

Der echte mindestens zehnsekündige Startvorgang verwendet jetzt einen ruhigen Spinner ohne Fortschrittsbalken und ohne Prozentanzeige.

### Ablaufdarstellung

Kompakte echte Folienvorschaubilder, Typ-Symbole, Schleifenstatus, einklappbare Bereiche und bearbeitbare Dauern verbessern die Übersicht bei langen Gottesdiensten.

### Elemente hinzufügen

Bild, Video, Audio, PDF, Slideshow, Timer, Countdown, Ankündigung, Stage-Nachricht und Schnellanzeige erzeugen jetzt typgerechte Daten und Wiedergabeelemente statt leerer Platzhalter.

### Medienende

Das Ende eines Videos oder einer Audiodatei wird sicher vom Output-Fenster an die Bedienoberfläche gemeldet und führt bei entsprechender Einstellung zur nächsten aktiven Folie.

## Behoben

### Lokale Videodatei

Die Auswahl „Datei“ öffnet jetzt tatsächlich den Medien-Dateidialog und erzeugt ein vollflächiges Videoelement.

### Schleifenwechsel

Vor- und Nachprogramm springen nach ihrer letzten aktiven Folie zuverlässig an den Anfang des jeweiligen Bereichs zurück, ohne deaktivierte Inhalte einzubeziehen.

### Zugangsdaten

GitHub-Zugangsdaten bleiben vollständig im Electron-Hauptprozess und werden weder an den Renderer noch an Präsentations- oder Mediendaten weitergegeben.

---

# GottesdienstRegie 0.8.0

Veröffentlicht: Di., 01.09.2026

Fensterstart, Videoeingänge und Live-Kamera erweitern den Einsatz der Anwendung am Regieplatz. Schnellanzeigen und LAST SHOWN helfen bei spontanen Inhalten. Die Versionshinweise dokumentieren außerdem Korrekturen für Videoaudio, Gerätausfälle, Einstellungen und Update-Sicherheit.

## Neu

### Fensterstart

Die Bedienoberfläche startet standardmäßig im Vollbildmodus und kann alternativ maximiert, als Fenster oder im zuletzt verwendeten Zustand geöffnet werden.

### Videoeingänge

Echte Kameras, Webcams und Capture Cards werden über die Betriebssystem-Mediengeräte erkannt, ausgewählt und mit einer Live-Vorschau dargestellt.

### Live-Kamera

Ein konfigurierter Videoeingang kann als normales Ablauf-Element eingefügt werden und verwendet in Vorschau und MAIN dieselbe Wiedergabekomponente.

### Schnellanzeigen

Logo, Schwarz, Leer, Ohne Text, Amen, Countdown und eigene Schnellanzeigen lassen sich aktivieren, sortieren, konfigurieren und gezielt Ausgängen zuweisen.

### LAST SHOWN

Schnellanzeigen werden als temporärer Live-Zustand über die aktive Folie gelegt; LAST SHOWN entfernt ihn, ohne die Live-Folien-ID oder den Ablauf zu verändern.

## Verbessert

### Einstellungen

Header, Navigation und Inhalt besitzen jetzt getrennte Höhen- und Scrollbereiche, damit lange Seiten vollständig innerhalb des Fensters bleiben.

### Updates

Aktuelle und vorherige Version zeigen Produkt, Datum, Build, Downloadgröße, Architektur, Kanal und Wiederherstellungsstatus in verständlicher Form.

### Downgrade-Sicherheit

Vor der Installation einer älteren Version werden neuere Inhaltsarten erkannt und bei möglichen Einschränkungen wird zuerst ein Präsentationsbackup angeboten.

### Videoformat

Auflösung, Bildrate, Seitenanpassung, Helligkeit, Kontrast, Sättigung, Farbton und Beschnitt wirken unmittelbar auf das echte Eingangssignal.

### Videoaudio

Capture-Audio kann mit Quelle, Lautstärke und sicherem Monitoring konfiguriert werden; ein Rückkopplungshinweis erscheint beim Operator-Monitoring.

## Behoben

### Settings-Scrollbereich

Lange Versionshinweise laufen nicht mehr in einen dunklen Bereich unterhalb des Einstellungsfensters und die Schließen-Schaltfläche bleibt sichtbar.

### Startflackern

Das Bedienfenster bleibt bis ready-to-show verborgen und wird erst nach dem Setzen von Displayposition und Fensterzustand angezeigt.

### Geräteverlust

Wird eine Videoquelle entfernt, wechselt die Vorschau zu einer verständlichen Nicht-verfügbar-Meldung statt eines unerklärten schwarzen Bildes.

---

# GottesdienstRegie 0.7.0

Veröffentlicht: Di., 01.09.2026

Präsentationsverwaltung, Pre- und Post-Service sowie Inhaltsbearbeitung werden gemeinsam weiterentwickelt. Sprache, Hilfe und Anzeige ergänzen die Bedienung. Anmeldung, Live-Ausgabe und Diagnose gehören ebenfalls zum dokumentierten Umfang dieses frühen Entwicklungsstands.

## Neu

### Präsentationen

Eine neue lokale Präsentationsbibliothek verwaltet jetzt mehrere Gottesdienste dauerhaft und unterstützt Erstellen, Öffnen, Duplizieren, Umbenennen, Archivieren, Importieren, Exportieren und Backups.

### Pre- und Post-Service

Vor- und Nachprogramm verwenden jetzt dieselbe Abschnitts-, Element- und Folienstruktur wie der Hauptgottesdienst und können beliebig viele Inhalte enthalten.

### Inhalte

Das Hinzufügen-Menü umfasst jetzt Inhalte, Bilder, Videos, Audio, Songs, Bibelstellen, Webseiten, PDF, Timer, Countdowns, Ankündigungen, Slideshows, Stage-Nachrichten und Schnellanzeigen.

### Sprache

Português (Brasil), Svenska, Suomi, Français und Italiano wurden ergänzt; alle Sprachen werden in der Auswahl immer mit ihrem Eigennamen und einer Flagge dargestellt.

## Verbessert

### Hilfe

Die integrierte Hilfe wurde zu einer durchsuchbaren Dokumentation mit ausführlichen Artikeln, verwandten Themen und Fehlerbehebung erweitert.

### Anzeige

Physische Anzeigen werden jetzt mit verständlichen Nummern beschrieben und lassen sich über „Anzeigen identifizieren“ zuverlässig ihren Ausgaberollen zuordnen.

## Behoben

### Anmeldung

Technische Fehlerkennungen und interne Antwortdetails werden nicht mehr in verständlichen Anmeldefehlern angezeigt.

### Live-Ausgabe

Editor-, Vorschau- und Live-Auswahl bleiben vollständig getrennt, sodass das Bearbeiten anderer Inhalte die laufende MAIN-Ausgabe nicht verändert.

---

# GottesdienstRegie 0.6.0

Veröffentlicht: Mo., 31.08.2026

Diese Ausgabe verbessert den Weg vom Start und Login zur Folienauswahl. Ablauf, Folienübersicht und mehrere Ausgänge werden zusammen betrachtet. Der Schwerpunkt liegt damit auf Orientierung und Ausgabeorganisation während der Vorbereitung.

## Neu

### Start

Ein echter Startvorgang prüft Konto, Anzeigen, Präsentation, Updates und Verbindung vor dem Öffnen der Bedienoberfläche.

### Folienübersicht

Vollständige Gottesdienste können nach Abschnitten gruppiert als performantes Raster echter Folienvorschaubilder angezeigt werden.

### Mehrere Ausgänge

Physische Monitore können erstmals getrennten virtuellen Rollen wie MAIN, STAGE, NOTES und LIVESTREAM zugeordnet werden.

## Verbessert

### Login

Dreißig lokale Motive aus deutschen Städten und Landschaften wechseln passend zum Farbschema.

### Ablauf

Ablauf-Elemente und Folien zeigen Auswahl, Live-Status und deaktivierte Zustände klarer und kompakter.

## Behoben

### Folienauswahl

Die Vorschauauswahl bleibt nach dem Verschieben eines Ablauf-Elements erhalten und verändert die Live-Ausgabe nicht.

---

# GottesdienstRegie 0.5.0

Veröffentlicht: Mo., 31.08.2026

Live-Ausgabe und Präsentationsverwaltung werden mit mehreren Folien und einem weiterentwickelten Editor verbunden. Die Speicherung gehört zu den dokumentierten Verbesserungen. Diese frühe Ausgabe bildet einen Zwischenschritt zur späteren Trennung von Editor, Vorschau und Livebetrieb.

## Neu

### Live-Ausgabe

MAIN- und STAGE-Fenster verwenden erstmals dieselbe zentrale Folienwiedergabe wie Editor und Vorschau.

### Präsentationen

Präsentationen können lokal erstellt, geöffnet und automatisch gespeichert werden.

### Mehrere Folien

Jedes Ablauf-Element unterstützt mehrere einzeln aktivierbare, sortierbare und duplizierbare Folien.

## Verbessert

### Editor

Eigenschaften für Texte, Hintergründe, Positionen und Ebenen wurden erweitert.

## Behoben

### Speicherung

Änderungen werden vor einem schnellen Schließen zuverlässiger in die lokale Wiederherstellungskopie geschrieben.

---

# GottesdienstRegie 0.4.0

Veröffentlicht: So., 30.08.2026

Der frühe Arbeitsbereich wird in Ablauf, Vorschau und allgemeiner Benutzeroberfläche ausgebaut. Im Mittelpunkt steht das Zusammenführen der vorbereiteten Inhalte mit ihrer sichtbaren Reihenfolge. Spätere professionelle Song- und Cloudfunktionen gehören nicht zu diesem ursprünglichen Umfang.

## Neu

### Ablauf

Der Gottesdienst kann in Vorprogramm, Ankommen, Gottesdienst und Nachprogramm gegliedert werden.

### Vorschau

Eine getrennte Vorschau wurde eingeführt, damit Inhalte vor dem Live-Schalten kontrolliert werden können.

## Verbessert

### Benutzeroberfläche

Ablauf, Arbeitsbereich, Eigenschaften und Filmstrip bilden eine kompakte, übersichtliche Bedienoberfläche mit mehr Platz für die Folie.

---

# GottesdienstRegie 0.3.1

Veröffentlicht: So., 30.08.2026

Benutzerkonto, Anmeldung und Berechtigungen stehen im Mittelpunkt dieses Wartungsstands. Die Updatefunktion wird im selben Zusammenhang weiterentwickelt. Kontozugang und fachliche Rollen sind getrennt von später eingeführten kosmetischen Profil- oder Belohnungsfunktionen zu betrachten.

## Neu

### Benutzerkonto

Die Desktop-Anwendung wurde mit dem vorhandenen Gemeindekonto und dessen sicherer Zwei-Faktor-Anmeldung verbunden.

### Berechtigungen

Der Zugriff auf GottesdienstRegie kann für einzelne Benutzer unabhängig von der allgemeinen Rolle freigegeben werden.

## Verbessert

### Updates

Updatefortschritt, Dateigröße, Installationszeit und die Rückkehr zur vorherigen Version sind direkt in den Einstellungen verfügbar.

### Anmeldung

Die vorhandene Web-Anmeldung wurde für die sichere Verwendung in der installierten Desktop-Anwendung optimiert.

---

# GottesdienstRegie 0.2.0

Veröffentlicht: Sa., 29.08.2026

Editor und Ablauf werden nach dem ersten Grundstand weiter ausgebaut. Die Aktualisierung der Anwendung ist ein weiterer dokumentierter Schwerpunkt. Dieser Versionsstand beschreibt eine frühe Basis und nicht den vollständigen Funktionsumfang der heutigen Anwendung.

## Neu

### Editor

Ein erster Folieneditor mit Titel, Text, Hintergrund und elementaren Layoutoptionen wurde eingeführt.

### Ablauf

Einzelne Präsentationselemente können innerhalb eines Gottesdienstablaufs ausgewählt und sortiert werden.

### Aktualisierung

GottesdienstRegie kann neue öffentliche GitHub-Versionen suchen, herunterladen und installieren.

---

# GottesdienstRegie 0.1.0

Veröffentlicht: Sa., 29.08.2026

Der erste hier archivierte Stand umfasst Grundsystem, Benutzeroberfläche und Gemeindekonto. Er bildet den Ausgangspunkt der weiteren Entwicklung. Die Versionsnummer lautet 0.1.0; eine veröffentlichte Version 1.0 ist in diesem Archiv bislang nicht enthalten.

## Neu

### Grundsystem

Die erste funktionsfähige installierbare Desktop-Version von GottesdienstRegie wurde erstellt.

### Benutzeroberfläche

Menüleiste, Ablauf, Arbeitsbereich, Eigenschaften und Statusleiste wurden als grundlegende Bedienstruktur eingeführt.

### Gemeindekonto

Die Anwendung verbindet die PGB-Anmeldung mit einer lokalen Gottesdienst-Präsentationsoberfläche.

---

<!-- Einheitlich aus public/releases.json aufbereitet. -->

[Ursprüngliche archivierte Detailnotizen vor v82](public/releases-archive-before-v82.md)
