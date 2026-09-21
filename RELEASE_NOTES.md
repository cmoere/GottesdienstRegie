# GottesdienstRegie 0.44.0

Version 0.44.0 macht die Bedienoberfläche standardmäßig etwas größer und besser lesbar. Die vorhandene fünfstufige Anzeigegröße beginnt nun auf der Stufe „Groß“ mit dem Faktor 1,1. Dadurch wachsen Navigation, Menüs, Schaltflächen, Symbole und allgemeine Beschriftungen behutsam um zehn Prozent, ohne die kompakte Desktop-Aufteilung grundlegend zu verändern.

Eingabefelder, Textfelder, Auswahlfelder und andere Formularelemente behalten ihre bereits festgelegten Abmessungen. Damit bleibt in Editoren und Einstellungsseiten ausreichend Platz für Inhalte. Die Vergrößerung betrifft ausschließlich die Bedienoberfläche: Folienvorschau, MAIN, STAGE, Livestream, Lobby, Recording und weitere Ausgabefenster werden weder skaliert noch in ihrer Gestaltung verändert.

Beim ersten Start nach dem Update erhalten auch bestehende Installationen einmalig die neue größere Ausgangsstufe. Danach kann die Anzeigegröße unter Einstellungen weiterhin frei zwischen Sehr klein, Klein, Standard, Groß und Sehr groß gewechselt werden. Automatische Prüfungen sichern die neue Ausgangsstufe, die unveränderte Ausgabeskalierung und die bestehende Skalenauswahl ab.

---

# GottesdienstRegie 0.43.1

Version 0.43.1 behebt die überlappende Darstellung in der Sprachauswahl des Song-Übersetzers. Das kompakte SVG-Sprachsymbol hatte denselben globalen CSS-Klassennamen wie der große Sprachschalter auf dem Anmeldebildschirm. Da die Login-Regel später geladen wird, wurde die Flagge von den vorgesehenen 24 × 16 Pixeln auf 46 × 38 Pixel vergrößert, während die erste Rasterspalte weiterhin nur 28 Pixel breit war. Dadurch lagen Flagge, Sprachname und Eigenbezeichnung übereinander.

Die Übersetzungsflaggen verwenden nun einen eigenen, ausschließlich für diese Komponente bestimmten Klassennamen. Größe, Schatten, Mauszeiger und Rasterbreite sind damit unabhängig von der Anmeldeseite. Sprachname, Eigenbezeichnung sowie Download- oder Bereitschaftsstatus bleiben wieder vollständig lesbar. Eine automatische Layoutprüfung verhindert, dass der kollidierende Klassenname später erneut eingesetzt wird.

---

# GottesdienstRegie 0.43.0

Version 0.43.0 macht mehrere vorbereitete Funktionen belastbar für den täglichen Einsatz. Die Nutzungsbedingungen wurden zu einer deutlich ausführlicheren gemeinsamen Fassung erweitert. Anwendung, Windows-Installer und die eigenständige öffentliche Seite `https://cmoere.github.io/GottesdienstRegie/terms/` werden aus derselben strukturierten Quelle erzeugt. Die Online-Bedingungen liegen bewusst nicht auf derselben Seite wie die Versionshinweise. Themen wie Konten, Live-Verantwortung, Medienrechte, Cloud-Synchronisierung, lokale Speicherung, Übersetzungsmodelle, Updates, Verfügbarkeit, Haftung, Beendigung und Kontakt sind nun nachvollziehbar gegliedert.

Unter Einstellungen → Allgemein steht eine neue Speicherübersicht bereit. Sie berechnet ausschließlich die Größe freigegebener, neu erzeugbarer Arbeitsdaten: lokale Übersetzungsmodelle, Modellcache, Mediencache, Vorschaubilder, unvollständige Downloads und Web-Cache. Kategorien können einzeln gewählt werden; vor dem unwiderruflichen Löschen nennt ein Bestätigungsdialog Auswahl und Größe. Präsentationen, Konten, Einstellungen, Originalmedien und bereits gespeicherte Songübersetzungen gehören ausdrücklich nicht zu diesen Bereichen. Während ON AIR oder eines laufenden Sprachdownloads wird die Bereinigung verweigert. Symbolische Verknüpfungen beziehungsweise Pfade außerhalb der genehmigten Ordner werden nicht verfolgt.

Der Download lokaler Übersetzungsmodelle wurde technisch neu aufgebaut. Große Dateien werden blockweise auf die Festplatte gestreamt und nicht mehr vollständig im Arbeitsspeicher gesammelt. Bei bekannter Gesamtgröße erscheinen Bytes und Prozent; ohne Content-Length bleibt ein Aktivitätsstatus mit den bereits übertragenen Bytes sichtbar. Abbruch und Fehler entfernen den unvollständigen temporären Ordner, und „Bereit“ wird erst gesetzt, wenn alle vorgesehenen Dateien existieren und Inhalt besitzen. Beim Programmstart werden keine großen Modelle mehr ungefragt heruntergeladen. Nicht unterstützte Sprachrichtungen bleiben für manuell gespeicherte Texte auswählbar und sind klar als ohne lokales Modell gekennzeichnet.

Die Sprachauswahl verwendet jetzt gebündelte SVG-Dateien statt Emoji-Flaggen. Häufige Sprachen besitzen ein lokales Flaggensymbol; bei Sprachen ohne eindeutige Länderzuordnung sowie bei einem Ladefehler erscheint ein neutrales Globus-SVG. Dadurch hängt die Darstellung weder von der Emoji-Unterstützung des Betriebssystems noch von einer externen Bildquelle ab.

Die Veranstaltungsverknüpfung zeigt als vollständige Statuszeile, ob noch keine Veranstaltung gewählt wurde, eine Verbindung besteht, der Termin abgesagt wurde oder der Online-Datensatz aktuell nicht erreichbar ist. Titel, Datum und planmäßige Uhrzeit werden beim Speichern als Snapshot gesichert und nicht still durch spätere Änderungen ersetzt. Der Auswahlbereich behält Suche und die Gruppen HEUTE, MORGEN und KOMMEND, übernimmt eine Wahl erst über „Änderung speichern“ und gibt nach dem Schließen den Tastaturfokus an den Auslöser zurück.

Das Hinzufügen spezieller Vor- und Nachprogramm-Elemente wurde gegen schnelle Doppelklicks abgesichert. Ein Klick erzeugt genau ein ServiceItem. Standardwerte für Wetter, Uhr, Quiz und weitere Typen stammen aus einer zentralen Factory; QR-Code und Bibelvers prüfen ihre Kerndaten vor der Anlage. Das Auswahlmenü ist ein responsives, scrollbar bleibendes Raster und bleibt auch in schmalen Fenstern lesbar. Die bestehende Abschnittsregel verhindert weiterhin, dass Loop-Inhalte in normale Gottesdienstbereiche gelangen.

Die Hilfe erklärt Speicherbereinigung, lokale Sprachpakete, Loop-Elemente und die getrennte Online-Fassung der Bedingungen ausführlich. MAIN, STAGE, Livestream, Lobby und Recording werden durch diese Bedienoberflächenänderungen nicht gestaltet oder umgefärbt.

---

# GottesdienstRegie 0.41.0

Version 0.41.0 ordnet die neuen Pre- und Post-Loop-Inhalte mit einer zentralen Abschnittsregel. Meldungen, Geburtstage, Veranstaltungen, Wetter, Quiz, Loop-Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte und Terminanzeigen werden nur noch dort angeboten, wo sie fachlich erlaubt sind. Dieselbe Prüfung schützt Hinzufügen, Verschieben und Einfügen; vorhandene ältere Daten werden dabei nicht ungefragt gelöscht.

Der Song-Editor erhält eine umfangreiche durchsuchbare Sprachauswahl. Spracheinträge zeigen Flagge, deutschen Namen und Eigenbezeichnung. Fünfzehn häufig verwendete Sprachen werden nach dem Programmstart mit niedriger Priorität vorbereitet. Weitere Sprachen bleiben vollständig sichtbar und kennzeichnen ein noch fehlendes lokales Modell mit einem Wolkensymbol. Beim Laden und Übersetzen erscheinen Spinner, Status und Prozentwert. Der übersetzte Text wird mit der Präsentation gespeichert, das große Modell selbst bleibt gerätelokal; auf einem zweiten Rechner ist der vorhandene Text deshalb lesbar und nur für eine erneute Übersetzung muss das passende Paket dort nachgeladen werden.

Präsentationsnotizen sind jetzt direkt unter dem Präsentationstitel erreichbar. Das Popup unterstützt Fett, Kursiv, Unterstreichen, Listen, Ausrichtung, Rückgängig und Wiederholen sowie sicheres Einfügen als Klartext. Persönliche Foliennotizen bleiben kompakt am Editor. Beide Notizarten werden lokal und kontogetrennt gespeichert und gelangen nicht in MAIN, STAGE oder andere Ausgaben.

Die bisherige einfache 2D-Auswahl wurde durch eine durchsuchbare Galerie mit Symbolen, Namen und Kategorien ersetzt. Mehr als dreißig Grundformen, Pfeile, Symbole und kirchliche Motive lassen sich dadurch schneller finden. Zahlenfelder, Popovers und schmale Einstellungsseiten besitzen stabilere Abstände und stärkere Kontraste.

Der Schwarz-Weiß-Modus ist nun strikt auf die Bedienoberfläche beschränkt. MAIN, STAGE, Livestream, Lobby und weitere Ausgabefenster behalten immer die vorgesehenen Folienfarben. Die Hilfe beschreibt dieses Verhalten eindeutig und der veraltete Hinweis auf einen nicht benötigten API-Schlüssel wurde entfernt.

---

# GottesdienstRegie 0.40.0

Version 0.40.0 erweitert den Song-Editor um eine lokale automatische Übersetzung zwischen Englisch und Deutsch. Beim ersten Einsatz wird das benötigte Modell geladen; danach läuft die Übersetzung auf dem Gerät ohne API-Schlüssel. Akkorde und Leerzeilen bleiben erhalten, der Entwurf kann vor dem Speichern korrigiert werden und ein Fehler verändert weder Originaltext noch MAIN.

Persönliche Notizen können jetzt sowohl zur gesamten Präsentation als auch zu einer einzelnen Folie geführt werden. Sie sind gerätelokal, kontogetrennt und ausdrücklich nicht Teil der Cloud-Präsentation oder einer Ausgabe. Das Musikmenü unterstützt zusätzlich eine Online-Suche nach HTTPS-Radiosendern mit direkter Vorschau und Übernahme in das Hintergrundaudio.

Die neue, standardmäßig ausgeschaltete Einstellung für Gemeinwohl-Hinweise bereitet trackingfreie Inhalte offizieller Stellen für Vor- und Nachprogramm vor. Nutzer steuern nur Einsatzbereich, Abstand, Dauer und QR-Code; die Inhalte selbst sind nicht editierbar.

Für den Livebetrieb wurden Loop-Kerninhalte geschützt und vom Ebenenpanel getrennt. MAIN erhält beim Schalten einen unveränderlichen Snapshot, sodass Editoränderungen nicht versehentlich sofort live erscheinen. Zusätzlich wurden Überlagerungen in der Windows-Kopfzeile, die Beschriftung des Equalizers sowie responsive Abstände und Zahlenfelder korrigiert.

---

# GottesdienstRegie 0.39.0

## Songübersetzungen mit sechs Anzeigearten

Im Song-Editor steht unter INHALT bei jeder Lyrics-Folie der neue Button „Übersetzung hinzufügen“ bereit. Die Übersetzung besitzt ein eigenes Sprachfeld und einen eigenen Textbereich, sodass beispielsweise ein englischer Originaltext zusammen mit einer deutschen Übersetzung vorbereitet werden kann, ohne die Grundlyrics zu ersetzen. Wiederholte Abschnitte im Songablauf übernehmen dieselbe Übersetzung; Änderungen laufen über die vorhandene Präsentationsspeicherung und können mit Rückgängig und Wiederholen bearbeitet werden.

Unter Einstellungen → Präsentation → Song stehen sechs Anzeigearten zur Verfügung: Aus, unter der Strophe in Klammern, unter der Strophe ohne Klammern, zeilenweise im Wechsel, nebeneinander in zwei Spalten und nur Übersetzung. Standardmäßig wird die Übersetzung in Klammern ergänzt. Falls für eine Folie keine Übersetzung eingetragen wurde, bleibt der Originaltext sichtbar. Die Eingabe erfolgt manuell; es wird kein Text an einen Übersetzungsdienst gesendet.

Die gemeinsame Folienanzeige unterstützt die Übersetzungen in Vorschau, Thumbnails und MAIN. Beim Senden einer Live-Folie wird die Anzeigeart mitgespeichert, damit eine Änderung in den Einstellungen nicht plötzlich die gerade ausgespielte Folie verändert. Lyric Scrolling bewegt beide Sprachen zusammen. Die gesonderte STAGE-Akkordansicht bleibt bei den Originallyrics. Preflight prüft den zusätzlichen Platzbedarf und warnt vor zu großen Textmengen. Bereits übersetzte Abschnitte werden nicht automatisch neu aufgeteilt; verwende hier den manuellen Folienumbruch und prüfe die Zuordnung beider Sprachen.

## Bildschirm während der Vorbereitung und Präsentation aktiv halten

GottesdienstRegie fordert beim Betriebssystem standardmäßig an, Bildschirmschoner und automatisches Ausschalten des Displays während der geöffneten Anwendung zu verhindern. Der Schalter unter Einstellungen → Allgemein → Fenster & Start kann jederzeit deaktiviert werden und wird für diesen Rechner gespeichert. Wiederholtes Aktivieren erzeugt keine zusätzlichen dauerhaften Anforderungen; beim Abschalten oder normalen Beenden wird der Schutz freigegeben, ohne die persönlichen Energieeinstellungen zu überschreiben.

Der Schutz ist keine Umgehung von Sicherheitsrichtlinien: Manuelles Sperren, das Zuklappen eines Notebooks sowie eigene Energiesparfunktionen von Monitoren oder Projektoren müssen weiterhin berücksichtigt werden. Prüfe die tatsächlich verwendete Geräteumgebung vor dem Gottesdienst.

## Unsplash-Hinweis und verlinkte Bedingungen

Der Unsplash-Bereich im Medienbrowser zeigt den gewünschten Hinweis zu den Nutzungs- und Datenschutzbedingungen jetzt dauerhaft an, auch während die Ergebnisse geladen werden. Die beiden Begriffe sind direkt mit den entsprechenden Unsplash-Seiten verknüpft. Zusätzlich steht der gewünschte Link zur Unsplash+-Lizenz bereit; dieser ist ausdrücklich separat gekennzeichnet und wird nicht als Lizenz sämtlicher Suchergebnisse ausgegeben. Die Desktop-Anwendung erlaubt für diese neuen Verweise nur die konkret hinterlegten HTTPS-Adressen.

## Zustimmung im Windows-Installationsassistenten

Der interaktive Windows-Installer enthält nun eine Seite mit den bereits vorhandenen Nutzungsbedingungen der Gemeinde. Das Zustimmungsfeld muss ausgewählt werden, bevor die Installation fortgesetzt werden kann. Die installierte Anwendung und der Update-Hinweis behalten den Zugang zum vollständigen Text. Stille beziehungsweise automatisierte Installationen haben keine interaktive Lizenzseite; die neue Checkbox gilt für den normalen Windows-Assistenten.

## Ausführlichere, bebilderte Hilfe

Die Hilfe enthält neue Artikel zu Songübersetzungen, Bildschirmschutz und Installation. Die Texte beschreiben die konkreten Menüwege, erklären die Auswirkungen der Einstellungen und nennen typische Fehlerquellen wie ungleiche Zeilenzahlen, zu kleine Textflächen oder abweichende Projektor-Energiesparregeln. Die Themen Erste Schritte und Unsplash wurden ebenfalls überarbeitet und um zusammenhängende Anleitungen ergänzt.

Drei neue, als schematisch gekennzeichnete Abbildungen veranschaulichen den Übersetzungsablauf, den zeitlich begrenzten Bildschirmschutz und den Weg von der Vorbereitung über Preflight zur Live-Ausgabe. Bei einer erfolglosen Hilfesuche wird jetzt erklärt, wie sich die Suche mit kürzeren Begriffen eingrenzen lässt.

## Hinweise vor der Nutzung

Prüfe zweisprachige Songs vor ON AIR in der tatsächlichen Schrift und Ausgabegröße. Übersetzungen können deutlich mehr Platz benötigen als der Originaltext; sie werden nicht ungefragt verkleinert. Die Anzeigeeinstellung gilt für das jeweilige Gerät, während die eingegebenen Übersetzungen zum Song innerhalb der Präsentation gehören. Diese Version führt keinen automatischen Übersetzungsdienst und keine eigenständige neue Cloud-Songbibliothek ein.

---

# GottesdienstRegie 0.38.0

## Songs importieren

Über Songbibliothek → Songs importieren … lassen sich mehrere lokale Songdateien auf einmal auswählen. TXT-, Markdown-, SONG-, CSV- und JSON-Dateien werden offline eingelesen. Titel, Interpret und Abschnittsüberschriften werden soweit vorhanden übernommen; jeder importierte Song wird als eigenes ServiceItem mit seinen Abschnitten angelegt.

## Equalizer als Audio-Unterpunkt

Die Audioeinstellungen sind übersichtlicher gegliedert. Der neue Unterpunkt Equalizer bietet einen neutralen Standardmodus und eine eigene 10-Band-Kurve mit gespeicherten dB-Werten. Der Bereich ist bewusst separat erreichbar, damit die normalen Audioausgänge schnell und übersichtlich bleiben.

## Upload-Fortschritt

Beim Hochladen von Bildern, Videos, Audio und weiteren Medien zeigt der Dialog jetzt einen kleinen Fortschrittsbalken mit Prozentwert. Laufende Live-Ausgaben werden davon nicht angehalten.

---

# GottesdienstRegie 0.37.1

## Zustimmung beim Update-Download

Beim Herunterladen einer verfügbaren Aktualisierung zeigt die Update-Ansicht jetzt den Hinweis „Mit der Aktualisierung stimmst du den Nutzungsbedingungen zu.“ direkt beim Download an. Der Begriff „Nutzungsbedingungen“ ist als Link gestaltet und öffnet die vollständige Fassung ohne Umweg.

Damit ist vor dem Start des Downloads klar erkennbar, welcher Zustimmung die Aktualisierung unterliegt. Der Hinweis ist rein informativ und verändert weder den Downloadablauf noch den Livebetrieb.

---

# GottesdienstRegie 0.37.0

## Testbetrieb ohne Veranstaltung

Für Proben und technische Checks gibt es neben ON AIR jetzt TESTBETRIEB STARTEN. Der Testbetrieb verlangt weiterhin die Live-Berechtigung, eine geöffnete Präsentation, aktive Folien, eine gültige MAIN-Zuordnung und den vollständigen Preflight. Eine Veranstaltung ist nur für den normalen ON-AIR-Start erforderlich.

Vor dem Start zeigt GottesdienstRegie die tatsächlich verwendeten Bildschirme. Nach Bestätigung werden ausschließlich MAIN und STAGE geöffnet. LIVESTREAM, NOTES, LOBBY und Recording bleiben aus. Der Testbetrieb wird sichtbar gekennzeichnet, nicht in der Präsentation gespeichert und erzeugt keine XP- oder Belohnungsereignisse. Änderungen an Präsentation oder Zuordnung während der Prüfung verwerfen den Start sicher.

## Nutzungsbedingungen

Die Anmeldung enthält jetzt eine ausdrückliche Bestätigung der Nutzungsbedingungen. Sie erklären Zuständigkeit für Inhalte und Rechte, Vorrang des Livebetriebs, Umgang mit lokalen und synchronisierten Daten, persönliche Zugangsdaten sowie das Melden von Fehlern und Sicherheitsproblemen. Die vollständige Fassung kann jederzeit über Hilfe → Nutzungsbedingungen erneut geöffnet werden.

## Versionslinie

Der Funktionsstand wechselt mit diesem Paket auf die neue Hauptlinie 0.37.0. Die bisherige 0.36-Linie bleibt als Archiv erhalten.

---

# GottesdienstRegie 0.36.16

## Loop-Elemente direkt in Vor- und Nachprogramm einfügen

Leere VORPROGRAMM- und NACHPROGRAMM-Abschnitte haben jetzt eigene Hinzufügen-Schaltflächen. Loop-Inhalte können dadurch direkt im gewünschten Bereich angelegt werden, ohne zuerst ein vorhandenes ServiceItem auswählen zu müssen. Beim Öffnen des Bereichsmenüs stehen die Loop-Elemente kompakt und sichtbar an erster Stelle: Meldungen, Geburtstage, Veranstaltungen, Wetter, Quiz, Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte sowie Terminanzeigen.

Wird ein Loop-Element erstmals aus dem VORPROGRAMM hinzugefügt, wird der Bereich fachlich als Loop-Bereich freigeschaltet. Die zentrale Placement-Prüfung bleibt aktiv; normale ServiceItems und Liveausgaben werden nicht verändert. Die Loop-Erstellung bleibt optional und blockiert weder Synchronisierung noch MAIN, STAGE, Audio oder Recording.

## Abschnitts-Header ohne Überlagerung

Die Bereichsaktionen sind jetzt als zusammenhängende Gruppe aufgebaut. LOOP-Schalter, Hinzufügen, Background-Audio und Zeit-/Daueranzeige teilen sich nicht mehr zufällig Grid-Spalten. Dadurch bleibt das Lautsprechersymbol auch in der schmalen Seitenleiste vollständig sichtbar und die Bedienung bleibt bei kleinen Fensterbreiten stabil.

---

# GottesdienstRegie 0.36.15

## Menüleiste bleibt vollständig sichtbar

Beim Auswählen einer weit unten liegenden Folie konnte die gesamte App-Oberfläche nach oben scrollen. Die Menüleiste wurde dadurch am oberen Fensterrand abgeschnitten, während Profil, Synchronisierung und Fensterbuttons an ihrer festen Position blieben.

Die äußere App-Hülle ist jetzt vom Scrollen ausgeschlossen. Folienübersicht und andere Inhaltsbereiche bleiben scrollbar. Auch bei niedrigen Fenstern erzwingt die Hülle keine übergroße Mindesthöhe mehr. Der Fix wurde in Electron bei 1920×1080, 1366×768 und 1280×600 mit Auswahl und Fokus auf entfernte Folien geprüft. Die bestehenden Layoutprüfungen für Einzelvorschau, Folienübersicht, Timeline und Bearbeiten bestehen ebenfalls.

---

# GottesdienstRegie 0.36.14

## Song- und Element-Editor: schneller vorbereiten, sicherer ausrichten

Der Song-Editor und die Folienbearbeitung erhalten einen zusammenhängenden Bedienfluss für die Vorbereitung. Lange Lyrics können direkt aus dem Song-Item auf mehrere Folien aufgeteilt werden; überlaufende Folien werden bereits im Editor sichtbar markiert, bevor sie in den Livebetrieb gelangen. Der STAGE-Ausgang zeigt aktuelle Zeilen, optionale Akkordzeilen und den nächsten Inhalt getrennt von MAIN. Songtitel, Ablauf und Vorschau bleiben dabei im bestehenden Editorfluss erhalten.

Für Elemente stehen jetzt ein konfigurierbares Raster, magnetisches Einrasten an Raster, Folienmitte und Rändern, Tastatur-Nudging sowie ein Ebenen-Panel zur Verfügung. Mehrfach ausgewählte Elemente lassen sich links, mittig, oben oder vertikal ausrichten und gleichmäßig verteilen. Mausbewegungen werden lokal pro Frame dargestellt und erst beim Loslassen als eine Änderung gespeichert; dadurch entstehen keine Zwischenstände in der Änderungshistorie und der Livebetrieb bleibt unberührt.

- Lange Lyrics automatisch auf Folien aufteilen; Überlaufwarnung mit direktem Sprung zur betroffenen Folie.
- STAGE-Songansicht mit „Jetzt“, strukturierten Akkordzeilen und „Als Nächstes“; MAIN bleibt unverändert.
- Rastergröße und Snap-Verhalten unter Hilfslinien einstellbar.
- Ausrichten, Verteilen, Ebenen sortieren, Sichtbarkeit/Sperre und präzises Verschieben per Pfeiltasten (Shift = größere Schritte).
- Bestehende Rollen, Berechtigungen, Cloud-Sync und Liveausgaben werden durch die optionalen Editorhilfen nicht verändert.

## Spezielle PRE-/POST-LOOP-Elemente und Screenmeldung-Integration

Diese Erweiterung ergänzt die Vorbereitung um dynamische, optionale Loop-Elemente. Sie laufen getrennt vom normalen Gottesdienstablauf und werden nur in dafür freigegebenen PRE-/POST-LOOP-Abschnitten beziehungsweise in einem ausdrücklich automatischen Vorprogramm berücksichtigt. Normale ServiceItems bleiben unverändert; der Live-Controller, MAIN, STAGE, Audio und Recording behalten Vorrang.

- Neue Loop-Typen: Meldungen, Geburtstage, Veranstaltungen, Wetter, nicht-interaktives Quiz, Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte, Heute bei uns und Nächste Termine.
- Zentrale Placement-Prüfung verhindert, dass Loop-Only-Elemente versehentlich im normalen Gottesdienst landen. Verschieben, Duplizieren, Import und automatische Wiedergabe verwenden dieselbe Regel.
- Loop-Elemente rotieren über einen eigenen Controller mit sauberer Start-/Stopp- und Abbruchlogik; ein fehlendes oder leeres Datenobjekt wird übersprungen und blockiert niemals MAIN.
- Screenmeldung basiert auf den mitgelieferten `screenmeldung.html`, `screenmeldung.css` und `screenmeldung.js`. Bestehende IDs, Klassen, internes Scrollen, QR-Position und Safe-Switch-Verhalten bleiben erhalten. Für den Loop werden Meldungen normalisiert, zeitlich gefiltert und nur bei passender Veröffentlichung/Audience angezeigt.
- Wetter verwendet ausschließlich `https://weather.crbnm06.workers.dev`. 20 Sekunden sind die empfohlene Voreinstellung; die Anzeigedauer kann pro Element angepasst werden und wird vor der sichtbaren Ausgabe vorgeladen. Bei Offline-/Fehlerzustand wird der Eintrag übersprungen.
- Die Editorvorschau zeigt Uhrzeit, Wetter und Meldungen lokal an. QR-URLs, Dauer und Loop-Metadaten werden im Inspector bearbeitbar dargestellt; die Wetterquelle bleibt systemseitig fest, die Dauer ist änderbar.
- Preflight meldet fehlerhafte Loop-Platzierungen und ungültige Wettermetadaten als Warnungen. Optionale Loop-Daten dürfen den Start eines Gottesdienstes nicht blockieren.

Die Erweiterung schreibt keine API-Schlüssel in die Anwendung und führt keine neue Live- oder Firebase-Engine ein. Screenmeldung-Daten bleiben im bestehenden Datenmodell; öffentliche Ansichten erhalten nur die fachlich notwendigen, bereinigten Felder.

## Vorschau-Layout korrigiert

Diese Wartungsausgabe behebt die große Leerfläche unter Einzelvorschau und Folienübersicht sowie Statusangaben, die links über dem Gottesdienstablauf erschienen.

Ursache war eine später geladene Layoutregel: Sie reservierte sieben Zeilen, obwohl die Vorschau nur fünf Hauptbereiche besitzt. Dadurch erhielt der eigentliche Arbeitsbereich zu wenig Höhe und die Statuszeile landete im falschen Bereich.

- Einzelvorschau und Folienübersicht verwenden wieder die verfügbare Fensterhöhe.
- Die Timeline liegt direkt unter dem Arbeitsbereich; die Statuszeile bleibt am unteren Fensterrand.
- Das Aufklappen der Timeline reduziert die Vorschauhöhe geordnet, ohne Überlagerungen zu erzeugen.
- Der Wechsel zwischen Bearbeiten und Vorschau behält die jeweils passende Höhenaufteilung.

Die Korrektur wurde mit der tatsächlichen Stylesheet-Reihenfolge und den produktiven Vorschau-/Timeline-Komponenten getestet: 1920×1080, 1366×768, beide Vorschauansichten, ausgeklappte Timeline und Rückkehr zum Bearbeiten. Der Produktionsbuild und die bestehenden Editor-, Website-, Vollbild- und Lyric-Regressionstests wurden ebenfalls geprüft.

Präsentationsinhalte und Live-Steuerung werden nicht verändert. Die offenen Cloud-Songfunktionen aus 0.36.12 sind nicht Bestandteil dieses Layout-Hotfixes.

---

# GottesdienstRegie 0.36.12

Diese Ausgabe ergänzt optionales Lyric Scrolling für Songs und behebt konkrete Probleme im Desktop-Arbeitsbereich. Vorhandene Präsentationen behalten ohne Aktivierung die normale Folienanzeige. Die Änderungen betreffen die Vorbereitung und Bedienung; sie ersetzen keine Prüfung der tatsächlichen Ausgabe am Regie-PC.

## Neu: Lyric Scrolling für MAIN

Unter **Einstellungen → Präsentation → Songs** lässt sich Lyric Scrolling einschalten. Aktuelle Liedzeilen erscheinen hervorgehoben; bis zu zwei kommende Textblöcke werden mit reduzierter Deckkraft angezeigt. Dauer und Deckkraft sind einstellbar. Im DESIGN-Tab kann ein einzelner Song den Präsentationsstandard übernehmen oder ausdrücklich normale Slides verwenden.

WEITER und ZURÜCK folgen weiterhin dem tatsächlichen Songablauf einschließlich Wiederholungen. Direkte Sprünge wechseln zum gewählten Abschnitt, ohne eine Animationswarteschlange aufzubauen. Titel-, Leer- und deaktivierte Folien erscheinen nicht als kommende Lyrics. Die über dem Canvas angebotene Testvorschau bewegt nur die Editorvorschau, nicht den Live-Ausgang.

Die Einstellungen werden im lokalen Präsentationsdokument gespeichert und unterstützen Undo/Redo. MAIN verwendet einen kopierten Live-Datenstand. STAGE und LIVESTREAM behalten ihre getrennten Darstellungen. Hintergrundübergänge übernehmen die bereits aufgelösten Folien-, Item- und Präsentationseinstellungen.

## Präzisere Desktop-Bedienung

- **Verschieben und Skalieren:** Mausbewegungen aktualisieren zunächst eine lokale Canvas-Vorschau. Erst das Loslassen speichert die Änderung als einen Undo-Schritt. Abgebrochene Gesten und ein inzwischen gewechselter Bearbeitungskontext werden nicht nachträglich gespeichert.
- **Vollbild:** Im F11-Modus stehen eigene Schaltflächen zum Minimieren, Verlassen des Vollbilds und Schließen bereit. Profil und Sync erhalten Abstand zu den Fensterbuttons; lange Profilnamen werden gekürzt, statt den Sync-Button zu überdecken.
- **Rechtschreibung:** Editierbare Textfelder erhalten das native Kontextmenü mit verfügbaren Korrekturvorschlägen, Lernen einer Schreibweise sowie Ausschneiden, Kopieren, Einfügen und Alles auswählen. Eine Websuche wird nur durch den ausdrücklich gewählten Befehl geöffnet. Vorschläge hängen von den geladenen Wörterbüchern ab.
- **Ruhigeres Speichern:** Geänderte Dokumente werden weiterhin regelmäßig lokal gesichert, jetzt ohne das große manuelle Synchronisationsfenster. Die automatische Cloud-Erreichbarkeitsprüfung läuft im Abstand von fünf Minuten. Lokales Speichern und Cloud-Übertragung sind nicht dasselbe.

## Website-Elemente

Der Editor gliedert sich in Adresse und Darstellung, Wiedergabe und Bedienung sowie Verbindung und Sicherheit. Beim Öffnen springt der Eingabefokus nicht mehr automatisch in die URL. Neue Optionen steuern Formulare und die an fremde Websites übermittelte Referrer-Information. Änderungen an verknüpften Website-Vorkommen werden zusammen gespeichert, ohne deren eigene Folien- und Element-IDs zu überschreiben.

## Ausführlichere Versionshinweise

Alle 59 bisher archivierten Versionen erhalten eine zusätzliche Einordnung in der App und auf der Release-Notes-Seite. Die ursprünglichen Einzelpunkte bleiben erhalten. Historische Notizen beschreiben den damals dokumentierten Stand und sind keine erneute Abnahme jeder älteren Funktion. Im Archiv existiert 0.1.0, aber keine veröffentlichte Version 1.0; eine solche Version wird hier nicht nachträglich erfunden.

## Grenzen und Prüfung vor dem Gottesdienst

Sehr lange Lyrics werden nicht still in eine winzige Schrift umgerechnet. Preflight weist auf eine zu kleine Textfläche hin. Überstehender Text wird abgeschnitten; solche Abschnitte müssen vor ON AIR aufgeteilt oder die Textfläche vergrößert werden.

Eine eigenständige authentifizierte Cloud-Songbibliothek, verwaltete Library-Arrangements und die vollständige Design-Vererbung sind **noch nicht enthalten**. Die vorhandene Anmeldung stellt dafür derzeit keinen geeigneten Cloud-Schreibzugang bereit. Auch die fünfminütige Statusprüfung bestätigt keine serverseitige Präsentationssynchronisierung.

Geprüft wurden der Produktionsbuild, Songstruktur, Lyric-Datenregeln, schnelle Wechsel und Sprünge im Electron-Renderer, 4K-Layout, Erhalt der Schriftgröße, Undo/Redo, Dokument-Neuladen, atomare Ziehbewegungen, verknüpfte Website-IDs sowie die Abstände der Vollbildbuttons. Die isolierten Rendererchecks sind keine Framerate-Garantie für die konkrete GPU. Bitte MAIN, Quick Screens, Audio und Hintergrundvideo auf dem tatsächlichen Ausgabegerät vor dem nächsten Liveeinsatz prüfen.

---

# GottesdienstRegie 0.36.11

## Song-Editor

- Kompakte Ablauf-Chips und ein größerer Lyrics-Bereich ersetzen die übergroße Arrangement-Fläche.
- Inhalt, Ablauf, Design, Akkorde, STAGE, LIVESTREAM und Metadaten haben eigene Tabs.
- Wiederholte Songabschnitte verwenden denselben Grundtext und erzeugen die tatsächliche Folienreihenfolge.
- Die integrierte Suche findet Songs aus gespeicherten Präsentationen.
- Schriftgröße, Textfarbe und Texteffekte wirken auf die Songfolien.
- Akkorde in eckigen Klammern können beim Tonartwechsel transponiert werden.

Die eigenständige Cloud-Songbibliothek, Library-Arrangements und vollständige Design-Vererbung sind noch nicht enthalten.

---

# GottesdienstRegie 0.36.10

## Behoben

- Windows-Startfehler „Titlebar overlay is not enabled“ behoben. Nach dem kompakten Ladefenster öffnet sich der Arbeitsbereich wieder in der eingestellten Größe.
- Die Windows-Titelleiste wird bereits beim Erstellen des Fensters korrekt initialisiert.

---

# GottesdienstRegie 0.36.9

## Verbessert

- Der Startbildschirm erscheint als kompaktes Ladefenster ohne die große äußere Fläche. Anschließend öffnet sich der Arbeitsbereich in der eingestellten Fenstergröße.
- Beim Beenden erscheint eine Speicheranzeige ohne Abbrechen- oder Überspringen-Schaltfläche. Die aktuelle Präsentation wird vor dem Schließen lokal gespeichert.
- Die Größe des Ladefensters überschreibt nicht die gespeicherten Fenstereinstellungen.

Hinweis: Die Anzeige beim Beenden bestätigt die lokale Speicherung, keine Cloud-Synchronisierung.

---

# GottesdienstRegie 0.36.8

Veröffentlicht am 11. September 2026.

## Neu

- **Song-Overrides:** Songs besitzen jetzt getrennte Bereiche für Inhalt, Ablauf, Design, STAGE und LIVESTREAM.
- **Verse Order:** `V1 C V2 C B C C` kann pro Gottesdienst festgelegt werden.
- **Arrangement und Tonart:** Philippus Standard, Akustisch, Jugendgottesdienst und Kein Arrangement sowie erweiterte Tonarten stehen direkt im Songeditor bereit.

## Verbessert

- Präsentationsänderungen werden am Song als „Angepasst“ markiert und können gesammelt zurückgesetzt werden.
- Designvorlagen, Schriftgröße und Texteffekte lassen sich nur für das aktuelle Song-ServiceItem ändern.
- STAGE kann Akkorde und Current/Next anzeigen; LIVESTREAM unterstützt ein eigenes Lower-Third-Layout.

---

# GottesdienstRegie 0.36.7

Veröffentlicht am 11. September 2026 um 00:48 Uhr.

## Neu

- **Direkte Folienbearbeitung:** Text, QR-Codes, Vordergrundmedien und weitere Folienelemente lassen sich auf der 16:9-Arbeitsfläche mit der Maus verschieben und am sichtbaren Griff skalieren.
- **Neue Präsentationsvorlagen:** Gottesdienst kompakt, Sonntagsgottesdienst klassisch, Jugendgottesdienst und Abendveranstaltung stehen beim Erstellen einer Präsentation bereit.
- **Unsplash-Favoriten:** Bilder aus der Unsplash-Suche können als Favorit gespeichert und später wiedererkannt werden.

## Verbessert

- Die Start-Synchronisierung kann übersprungen werden, ohne die gespeicherte Anmeldung zu verwerfen.
- Ausgewählte Bild-, Video- und QR-Elemente besitzen zusätzliche präzise Werte für Position, Größe, Drehung und Deckkraft.
- Die Werkzeugleiste im Inhaltseditor bricht auf schmaleren Flächen sauber um.

## Behoben

- Ein Fehler bei der lokalen KI-Videoerzeugung öffnet nicht mehr unvermittelt den Unsplash-Bereich.
- Nach erfolgreicher Medienerzeugung wird gezielt die Cloud-Medienansicht geöffnet.
- Beschriftung und Regler für die Deckkraft sind wieder korrekt ausgerichtet.

---

# GottesdienstRegie 0.36.6

Veröffentlicht am 11. September 2026 um 00:12 Uhr.

## Verbessert

- **Unsplash-Suche:** Suchbegriffe werden direkt an Unsplash übergeben; die gelieferten Bilder bleiben vollständig sichtbar und werden nicht noch einmal lokal nach ihrem Beschreibungstext gefiltert.
- **Stabiles Nachladen:** „Mehr laden“ ergänzt die nächste Ergebnisseite, ohne das vorhandene Medienraster auszublenden, neu aufzubauen oder umzusortieren.
- Beim seitenweisen Nachladen bleibt die aktuelle Auswahl erhalten und der Button zeigt den laufenden Vorgang deutlich an.

## Behoben

- Suchanfragen wie „natur“ melden nicht mehr fälschlich „Keine passenden Medien gefunden“, obwohl Unsplash Treffer geliefert hat.
- Bereits geladene Bilder verschwinden beim Abrufen der nächsten Seite nicht mehr kurzzeitig.

---

# GottesdienstRegie 0.36.5

Veröffentlicht am 10. September 2026 um 23:06 Uhr.

## Neu

- **Meine Präsentationen:** Das persönliche Profil enthält eine durchsuchbare und filterbare Präsentationsübersicht mit Titelbild, Datum, Umfang, Dateigröße und Änderungszeit. Ein Klick öffnet die Präsentation direkt.
- **QR-Code-Editor:** URL oder Text werden in einem eigenen Dialog eingegeben, live als QR-Code angezeigt und können später erneut bearbeitet werden.
- **Medien in Fehlerberichten:** Bis zu vier Screenshots, Bilder oder kurze Videos lassen sich einem Fehlerbericht beifügen.

## Verbessert

- KI-Motive werden als vollständiger Bereich der Medienbibliothek angezeigt und nicht mehr in einem Popup.
- Vordergrundbilder besitzen ein kompaktes Dropdown für die Medienbibliothek und den direkten Bildimport.
- Zusatztexte können sofort eingegeben und anschließend direkt in ihrer Ebenenbox bearbeitet werden.
- Unsplash lädt weitere Ergebnisse seitenweise und bietet „Mehr laden“ sowie „Weniger anzeigen“.
- Die Servicezeit steht rechts im Abschnittskopf, ist größer und kennzeichnet Vormittag oder Nachmittag.

## Behoben

- Die leere Box „Zusätzliche Ebenen“ wird nicht mehr angezeigt; vorhandene Ebenenfunktionen bleiben vollständig erhalten.
- QR-Codes speichern nun ein tatsächlich gerendertes QR-Bild statt eines bloßen Textplatzhalters.
- Die unerwünschten Erklärungssätze im Profil, KI-Videobereich und Fehlerdialog wurden entfernt.

---

# GottesdienstRegie 0.36.4

Veröffentlicht am 10. September 2026 um 21:00 Uhr.

## Neu

- **Zusätzliche Ebenen:** Texte, Vordergrundbilder, QR-Codes und 2D-Objekte erhalten im Bearbeiten-Bereich eine eigene übersichtliche Ebenenbox zum Auswählen, Bearbeiten, Ein- und Ausblenden sowie Entfernen.
- **Erweiterte Motivwelt:** Mehr Szenenkategorien, deutlich mehr Gestaltungsstile und ausführlichere wechselnde Motivbeschreibungen erweitern die lokale Hintergrunderzeugung.
- **Persönliches Profil:** „Mein Profil“ zeigt Profilbild, Name, Benutzername, E-Mail-Adresse, Rolle und Organisation getrennt vom Belohnungsbereich.

## Verbessert

- KI-Videohintergründe sind zwischen 30 und 60 Sekunden einstellbar und lassen sich anschließend als echte Videohintergründe einsetzen.
- Natur-, Wald-, Stadt- und Wetterszenen verwenden fotografische Ausgangsmotive mit ruhiger Kamerabewegung statt abstrakter Formen.
- Der Synchronisationsstatus sitzt mit minimalem Abstand unmittelbar links vom Profil.
- Fehler-, Änderungs- und Featureformulare erklären in jedem Eingabefeld kurz, welche Angaben benötigt werden.

## Behoben

- Unsplash funktioniert ohne manuelle Eingabe eines Access Keys in den Einstellungen.
- Erzeugte Videos werden in der Hintergrundauswahl nicht mehr ignoriert.
- Zusätzliche Folienelemente lassen sich nun gezielt einzeln entfernen, ohne andere ausgewählte Ebenen unbeabsichtigt zu löschen.

---

# GottesdienstRegie 0.36.3

Veröffentlicht am 10. September 2026 um 19:26 Uhr.

## Neu

- **Feedback direkt aus der Hilfe:** Fehler, konkrete Änderungswünsche und neue Featurewünsche lassen sich getrennt erfassen und über die eigene GottesdienstRegie-Meldeseite einreichen.
- **KI-Videohintergründe:** Neben Bildern entstehen nun sechs Sekunden lange animierte WebM-Hintergründe mit ruhiger Bewegung und echter Vorschau.
- **Szenenkategorien:** Natur, Wald, Berge, Stadt, Meer, Himmel, Kirchenraum und abstrakte Motive stehen gezielt zur Auswahl.

## Verbessert

- Bild- und Videohintergründe sind gemeinsam in der Hintergrundauswahl verfügbar.
- Die Videoerzeugung wählt automatisch einen unterstützten VP9-, VP8- oder WebM-Modus.

## Behoben

- Checkboxen und Beschriftungen im Webeditor werden nicht mehr über die gesamte Seitenbreite auseinandergezogen.

---

# GottesdienstRegie 0.36.2

Veröffentlicht am 10. September 2026 um 12:15 Uhr.

## Neu

- **Weboptionen je Element:** Zoom, 100-%-Reset, Interaktion, Audio, Pop-ups, automatisches Aktualisieren und ein optionaler Proxy werden direkt am jeweiligen Webelement eingestellt.
- **Mehr 2D-Objekte:** Parallelogramm, Trapez, Herz, Blitz, Schild, Wolke, Haus und Halbmond ergänzen die Formen und lassen sich nun direkt im Bearbeiten-Bereich einfügen.

## Verbessert

- KI-Motive bieten zwölf Stile, ausführliche wechselnde Motivbeschreibungen und bei jeder Erzeugung eine neue visuelle Variante.
- Die Schriftliste wurde erneut erweitert; Websteuerung und Uhr verwenden Cera Pro als bevorzugte Schrift und zeigen Sekunden an.
- Der Sync-Schalter sitzt unmittelbar rechts neben dem Profil.

## Behoben

- Favoriten funktionieren nun auch für reine Cloud-Medien ohne vorherigen lokalen Indexeintrag.
- Cloud-Medien lassen sich über ihre stabile Cloud-Referenz löschen; lokale Metadaten werden anschließend sauber entfernt.
- „Element hinzufügen → Video“ öffnet einen passenden Videodialog und erzeugt ein vollständig abspielbares Videoelement.

---

# GottesdienstRegie 0.36.1

Veröffentlicht am 10. September 2026 um 11:21 Uhr.

## Neu

- **Profil oben rechts:** Das neue Profilmenü öffnet Profil, XP, Level und Abzeichen und bietet direkten Zugriff auf Einstellungen und Abmelden.
- **Vollständiges Bearbeiten-Menü:** Undo, Redo, Ausschneiden, Kopieren, Einfügen, Duplizieren sowie Folienbefehle verwenden die bestehenden zentralen Editoraktionen.

## Verbessert

- Mehr als 200 Schriftfamilien, neun Schriftgewichte sowie zusätzliche Textvorlagen stehen im Folieneditor bereit.
- „Element hinzufügen“ zeigt alle 16 unterstützten ServiceItem-Typen übersichtlich und direkt erreichbar an.
- Der rechte Kopfbereich besitzt klare Profil-, Cloud- und Bedienaktionen ohne überlappende Symbole.

## Behoben

- Der Organisationsname ist unveränderlich auf „Philippus Gemeinde Bielefeld e. V.“ festgelegt – auch für bereits registrierte Geräte.
- Slideshow und bisher unvollständig erreichbare Elemente lassen sich über das Plus-Menü tatsächlich anlegen.

---

# GottesdienstRegie 0.36.0

Veröffentlicht am 10. September 2026 um 03:35 Uhr.

## Neu

- **Gemeinsam genutzte Gemeinde-PCs:** Geräte werden einmalig registriert, während sich Benutzer auf gemeinsamen Rechnern bei jedem Start persönlich anmelden.
- **Websteuerung im lokalen Netzwerk:** Zeitlich begrenzte, widerrufbare Sitzungen bedienen NEXT und ZURÜCK über dieselbe sichere Live-Logik wie der Operator-PC.
- **Persönliche Monitore:** Feste, nur lesende URLs zeigen den bestätigten Live-Stand auf Smartphones, Tablets und weiteren Rechnern und verbinden sich automatisch neu.
- **Zentrale KI-Steuerung:** KI-Funktionen lassen sich global ein- oder ausschalten; KI-Motive bleiben ohne eigenen API-Schlüssel verfügbar.

## Verbessert

- Die Änderungshistorie protokolliert Benutzer und verwendeten Gerätenamen getrennt und macht beides durchsuchbar.
- 2D-Objekte besitzen zusätzliche Formen sowie direkte Felder für Position, Größe, Drehung, Sichtbarkeit und Deckkraft.
- Text erhält getrennte Schalter für Schatten, Kontur, Leuchten und Deckkraft.
- Webseiten werden ohne Eingabe-Popup sofort angelegt; URL und Zoom werden anschließend im normalen Editor bearbeitet.
- Der Hilfebereich erklärt gemeinsam genutzte Geräte, persönliche Anmeldung, Websteuerung, persönliche Monitore und KI-Motive.

## Behoben

- Die schwebende Änderungsanzeige überlagert die Formatleiste nicht mehr.
- Die Hauptoberfläche kann nach dem Ladescreen nicht mehr zu einem schmalen Streifen kollabieren.
- Gespeicherte Geräteinformationen bleiben beim erneuten Laden älterer Historien erhalten.

---

# GottesdienstRegie 0.35.0

Veröffentlicht am 10. September 2026 um 02:25 Uhr.

## Neu

- **Dauerhafte Änderungshistorie:** Ein eigenes Systemfenster zeigt Revision, Benutzer, Bereich, Quelle, Synchronisierungsstatus sowie Vorher/Nachher und bietet sichere Wiederherstellungspunkte.
- **Optionales Belohnungssystem:** XP, Level, Abzeichen, Anti-Farming und ein eigener Verlauf motivieren ohne Funktionen, Rollen oder Rechte zu sperren.
- **Lokale KI-Motive:** Der Medienbrowser erzeugt ohne API-Schlüssel individuelle 16:9-Hintergründe direkt auf dem Gerät.
- **Weitere 2D-Objekte:** Fünfeck, Sechseck, Achteck, Strahlenform, Chevron, Sprechblase und Kreuz ergänzen die Formbibliothek.

## Verbessert

- Historieneinträge werden logisch zusammengefasst, sensible Werte redigiert und nach echter Speicherung als synchronisiert markiert.
- Gelöschte ServiceItems, Servicezeiten und geeignete Präsentationsstände lassen sich als neue Revision wiederherstellen; neuere Historie bleibt erhalten.
- Mehr als 170 Schriftfamilien sowie Gewichte von Dünn bis Schwarz und normaler/kursiver Standardstil stehen bereit.
- Der Ersteller einer Präsentation wird automatisch aus dem angemeldeten Konto übernommen.
- Belohnungsbenachrichtigungen erscheinen nie auf MAIN, STAGE oder LIVESTREAM und werden während ON AIR zurückgehalten.

## Behoben

- 2D-Objekte werden nun atomar erstellt und sofort ausgewählt; der bisherige wirkungslose zweistufige Einfügevorgang entfällt.
- Die redundante Erklärungszeile zum Drei-Jahres-Zeitraum wurde aus der Veranstaltungsauswahl entfernt.

---

# GottesdienstRegie 0.34.1

Veröffentlicht am 9. September 2026 um 23:14 Uhr.

## Verbessert

- Das Bedienfenster setzt die Oberflächenskalierung bei jedem Start zuverlässig auf 100 Prozent.
- Browser-Zoomtasten verändern die Produktionsoberfläche nicht mehr unbeabsichtigt.

## Behoben

- Menü-, Präsentations- und Formatleiste werden nicht mehr auf halbe Höhe zusammengedrückt.
- Die obere Bedienoberfläche überlagert sich nicht mehr direkt unter der Windows-Titelleiste.

---

# GottesdienstRegie 0.34.0

Veröffentlicht am 9. September 2026 um 22:39 Uhr.

## Neu

- **Bearbeitbare 2D-Objekte:** Rechtecke, abgerundete Rechtecke, Ellipsen, Dreiecke, Rauten, Sterne und Pfeile lassen sich frei gestalten und anordnen.
- **Medien sicher löschen:** Team-Medien können über einen eindeutigen Bestätigungsdialog entfernt werden. Verwendete und live aktive Dateien bleiben geschützt.
- **LiveQuiz-Belohnungen:** Preise für die ersten drei Plätze und eine automatisch berechnete Rangliste ergänzen den Quizbetrieb.
- **Schnelle Änderungsanzeige:** Die letzte Bearbeitung und die vollständige Änderungshistorie sind direkt am Arbeitsbereich erreichbar.

## Verbessert

- Der Medienbrowser zeigt Ergebnisanzahl, veränderbare Kachelgrößen, Favoriten sowie „Mehr laden“ und „Weniger anzeigen“.
- `Strg+F`, `Entf` und `Esc` unterstützen die schnelle Tastaturbedienung im Medienbrowser.
- Die Veranstaltungsauswahl zeigt chronologisch sortiert nur heutige und kommende Termine der nächsten drei Jahre.
- Textstile, Textfarbe, Textschatten und die Live-Animation „Fade in Text“ funktionieren direkt im Editor.

## Behoben

- „Arrangement duplizieren“ führt nun eine echte Editoraktion mit Undo-Unterstützung aus.
- Jede Medien-Löschaktion verwendet denselben sicheren App-Dialog.

---

# GottesdienstRegie 0.30.0

Veröffentlicht am 8. September 2026.

## Neu

- **Professionelles Audio-Routing:** Videos, Background Audio, Systembenachrichtigungen, Vorhören und LiveQuiz-Soundeffekte besitzen getrennte, gerätebezogene Ausgänge.
- **Ausgangskontrolle:** Jede Route bietet eigene Lautstärke, Stummschaltung, echten Gerätenamen und einen isolierten Testton.
- **Vollständiges Hilfezentrum:** Schnellstart, Livebetrieb, Audio, Präsentation und System enthalten ausführliche Bedien-, Preflight- und Problemlösungshilfen.
- **Timeline-Vorschaubilder:** Die aufgeklappte Timeline kann echte kleine Folienvorschaubilder anzeigen; die Funktion lässt sich in den Präsentationseinstellungen ein- oder ausschalten.

## Verbessert

- Audiogeräte werden dynamisch vom Betriebssystem erkannt und anhand ihrer stabilen Device-ID lokal gespeichert.
- Fehlende Ausgänge bleiben gespeichert, werden sichtbar als nicht verfügbar markiert und verwenden vorübergehend den Systemstandard.
- Änderungen an Audioausgängen während ON AIR starten laufende Videos oder Playlists nicht neu.
- Preflight prüft benötigte Video- und Background-Audio-Ausgänge sowie die nicht blockierenden Preview- und Benachrichtigungswege.
- Abgesagte Firebase-Veranstaltungen bleiben chronologisch sichtbar, tragen den roten Hinweis „Fällt aus!“ und sind für neue Verknüpfungen gesperrt.
- Wird eine bereits verknüpfte Veranstaltung später abgesagt, bleibt die Verbindung erhalten und der Präsentationskopf zeigt eine Warnung.
- Kontextbezogene Hilfe ist direkt an Preflight, Audioausgängen, Servicezeit und Veranstaltungsverknüpfung erreichbar.

## Behoben

- Die alte globale Audioauswahl überschreibt die neue Background-Audio-Route nicht mehr.
- Eine erreichbare Medien-Cloud wird bei einer leeren oder vorübergehend nicht lesbaren Medienliste nicht mehr fälschlich als offline angezeigt.
- Präsentationstitel sind beim Erstellen, Laden, Umbenennen und Speichern zuverlässig auf maximal 500 Zeichen begrenzt.

---

# GottesdienstRegie 0.27.0

Veröffentlicht am 7. September 2026.

## Neu

- **Cera Pro als Standard:** Neue Texte und Folien verwenden Cera Pro. Ist die proprietäre Schrift auf einem Gerät nicht installiert, greift eine passende Kette aus Aptos, Inter und Segoe UI.
- **Schriftarten-Einstellungen:** Standardschrift, Schriftgröße und Gewicht lassen sich zentral einstellen, direkt ansehen und auf alle Texte der aktuellen Folie anwenden.
- **MAIN-Liveansicht:** Die Einzelansicht bildet die tatsächliche MAIN-Ausgabe ab. Im ON-AIR-Betrieb schalten große Pfeile sowie Links/Rechts direkt live weiter.
- **Animiertes Amen:** Die Amen-Schnellanzeige nutzt Ringe, Lichtstrahlen und eine dynamische Typo-Animation, bleibt sechs Sekunden sichtbar und stellt danach automatisch die MAIN-Folie wieder her.

## Verbessert

- Die Vorschau konzentriert sich auf MAIN; weitere Ausgangsreiter und die bisherige „Ausgewählt“-Karte wurden entfernt.
- Unter Einstellungen → Präsentation zeigt STANDARDÜBERGANG eine kleine Folienvorschau mit eigenem Abspielknopf.
- Die Übergangsdauer hat ein deutlich breiteres, gut lesbares Eingabefeld.
- Untermenüs für „Zuletzt öffnen“, „Zuletzt duplizieren“ und den Präsentationsimport öffnen auf Höhe ihres jeweiligen Menüeintrags.
- Alle geänderten Inhalte werden spätestens alle 15 Sekunden gespeichert. Das Wolkensymbol neben Abmelden löst den Vorgang manuell aus und zeigt vier Fortschrittsstufen.

## Behoben

- Nach dem Erstellen eines Elements schließt sich das Menü „Element hinzufügen“ automatisch.
- Tastaturbefehle in der MAIN-Einzelansicht lösen keinen doppelten Folienwechsel mehr aus.

---

# GottesdienstRegie 0.26.0

Veröffentlicht am 7. September 2026.

## Neu

- **Noch mehr Übergänge:** Iris öffnen, Vorhang öffnen, Würfel drehen, Einschwingen, Lichtblitz und Aufskalieren ergänzen die vorhandenen Animationen.
- **Große Schriftauswahl:** Der Editor bietet jetzt mehr als 120 verbreitete Systemschriften, darunter zusätzliche serifenlose, Serif-, Schreib-, Display- und Monospace-Schriften.

## Verbessert

- Der Vorschaumodus konzentriert sich vollständig auf die Präsentationssteuerung. Ausgangsauswahl und Textformatierungswerkzeuge aus dem Bearbeitungsmodus werden dort nicht mehr angezeigt.
- Die Einzelansicht übernimmt einen hellen oder dunklen Arbeitsflächenhintergrund passend zur gewählten Darstellung – einschließlich der Systemeinstellung.
- Änderungen an Titel, Inhalt und Gestaltung der ausgewählten Folie erscheinen während der Bearbeitung sofort in der rechten Vorschau.

## Behoben

- Bereitschaftssymbol und Text „BEREIT“ wurden aus der Vorschau entfernt und belegen dort keinen unnötigen Platz mehr.

---

# GottesdienstRegie 0.25.0

Veröffentlicht am 7. September 2026.

## Neu

- **Erweiterte Übergänge:** Zusätzlich zu den bisherigen Effekten stehen Zoomen, Unschärfe, Kreis-Aufdecken, Drehen und Schieben mit Verdrängen bereit.
- **Gesteuerte Einzelansicht:** Große Pfeile und die Tastaturtasten Links/Rechts navigieren durch alle aktiven Folien. Zeitgesteuerte Folien zeigen einen Countdown, der per Klick für eine dauerhafte Anzeige gestoppt werden kann.
- **Eigene Ablaufvorlagen:** Der aktuelle Ablauf kann als Vorlage gespeichert und beim Erstellen einer Präsentation wiederverwendet werden. Nur eigene Vorlagen lassen sich löschen.
- **Präsentationsinformationen:** Ein neues Fenster bündelt Ersteller, Erstellungs- und Änderungszeit, Inhaltsumfang, Dauer, Kennungen und bis zu 60 Einträge Bearbeitungshistorie.

## Verbessert

- Die Einzelansicht konzentriert sich vollständig auf die Folie; der Thumbnailgrößen-Regler wird nur noch in der Folienübersicht angezeigt.
- Mehr als 65 verbreitete Systemschriftarten stehen im Editor zur Auswahl.
- Die Folienübersicht reagiert ebenfalls auf die Pfeiltasten und verwendet weiterhin acht klar definierte Thumbnailgrößen.

## Behoben

- Nach einem Übergang wird die neue Folie nicht mehr schwarz. Der abgeschlossene Animationszustand bleibt ausdrücklich vollständig sichtbar.

---

# GottesdienstRegie 0.24.0

Veröffentlicht am 7. September 2026.

## Neu

- **Professioneller Vorschau-Arbeitsplatz:** Ablauf, vollständige gruppierte Folienübersicht und eine rechte Leiste für Auswahl, Live-Folie und Schnellanzeigen sind gleichzeitig sichtbar.
- **Echte Virtual-Screen-Ansichten:** MAIN, LIVESTREAM, STAGE, NOTIZEN und SIGNALE wechseln ohne Neuladen und behalten den gewählten Arbeitsbereich bei.
- **Live-Kontrolle rechts:** Die ausgewählte Folie bleibt navigierbar, während die tatsächlich live gezeigte Folie separat als AKTUELL gekennzeichnet wird.

## Verbessert

- Das responsive Raster verteilt je nach Fensterbreite und einer von acht Thumbnailstufen automatisch mehr oder weniger Folien pro Reihe.
- Sections und Ablauf-Elemente zeigen kompakte Gruppen, Folienanzahl, echte Dauern, Wiederholung und vorhandene Übergangsmarkierungen.
- Leere Sections belegen nur noch eine schmale Zeile. Die rechte Seitenleiste kann eingeklappt werden und gibt der Folienübersicht dann den Platz frei.
- Auswahl per Ablauf, Thumbnail und Pfeiltaste verwendet denselben Zustand. Beim Wechsel zwischen Bearbeiten und Vorschau bleibt die aktuelle Auswahl erhalten.
- Nicht sichtbare Gruppen werden browserseitig verzögert gerendert, damit auch große Präsentationen flüssiger scrollen.

## Behoben

- Das Auswählen einer Folie im Vorschaumodus verändert die Live-Ausgabe nicht mehr. Auswahl und ON-AIR-Zustand können sichtbar voneinander abweichen.
- Reine Editor-Hinweise wie „Inhalt bearbeiten“ erscheinen nicht länger als echter Inhalt in den Preview-Thumbnails.
- Die bisher große ungenutzte Fläche im Vorschau-Modus wird durch das responsive Raster und die Live-Seitenleiste sinnvoll genutzt.

---

# GottesdienstRegie 0.23.0

Veröffentlicht am 7. September 2026.

## Neu

- **Übergangseffekte:** Folien unterstützen jetzt Schnitt, Überblenden, Kreuzblende, Auflösen, Schieben und Wischen. Schieben und Wischen lassen sich nach links, rechts, oben oder unten ausrichten.
- **Hierarchische Standards:** Ein Präsentationsstandard kann pro Ablauf-Element und anschließend pro einzelner Folie überschrieben werden. „Auf Standard zurücksetzen“ entfernt nur die Folienüberschreibung.
- **Editor-Vorschau:** Der neue Vorschau-Button spielt den gewählten Übergang ausschließlich im Editor ab und verändert weder MAIN noch die aktuelle Live-Folie.

## Verbessert

- Dauer, Bewegungskurve und die Umkehrung der Richtung beim Zurückschalten sind direkt am Übergang einstellbar.
- MAIN, LIVESTREAM und LOBBY verwenden die gestalteten Übergänge. STAGE schaltet bewusst ohne Animation, damit Hinweise jederzeit sofort lesbar bleiben.
- Die Ausgabe verwendet GPU-freundliche Deckkraft-, Transformations- und Maskenanimationen. Bei schnellem Weiterschalten wird der laufende Übergang sauber ersetzt und nicht aufgestaut.

## Behoben

- Alte Präsentationen mit den bisherigen Feldern `transition` und `transitionDuration` werden beim Öffnen automatisch in das neue Modell übernommen.
- Hintergrund-Audio wird von visuellen Folienübergängen nicht neu gestartet oder verändert.
- Schnellanzeigen bleiben von der Übergangsauswahl getrennt und Schwarz erscheint weiterhin unmittelbar.

---

# GottesdienstRegie 0.22.0

Veröffentlicht am 7. September 2026.

## Neu

- **Vorschau-Audio:** Background Audio kann jetzt im Vorschaumodus anhand des dort ausgewählten Elements beziehungsweise Abschnitts kontrolliert werden. Im Bearbeitungsmodus bleibt es stumm.
- **Kompaktes Lautsprechermenü:** Ein inaktives Lautsprecher-Icon öffnet direkt an der Ablaufzeile die Aktionen „Audio durchsuchen“, „Importieren“ und – bei Ablauf-Elementen – „Background Audio stoppen“.
- **Autoplay:** Jede Playlist kann vorbereitet werden, ohne automatisch zu starten. Für normale PRE-/POST-Loop-Playlists ist Autoplay weiterhin standardmäßig aktiviert.

## Verbessert

- Background Audio verwendet im Ablauf, Playlist-Panel und Live-Controller ausschließlich Lautsprecher- und Wiedergabesymbole. Das Musiknoten-Symbol bleibt echten Songs vorbehalten.
- Das kompakte Playlist-Panel bietet Track-Hörprobe, Dauer, Drag-and-drop-Sortierung, Lautstärke, Fade In, Fade Out, Crossfade, Ducking sowie verständliche Regeln für Playlist-, Element-, Abschnitts- und OFF-AIR-Ende.
- Abschnittsmusik läuft unabhängig von visuellen PRE-/POST-Loops weiter. Item-Audio besitzt Vorrang und kann Abschnittsmusik entsprechend der gespeicherten Zielregel ersetzen oder fortführen.

## Behoben

- **OFF AIR:** Das Beenden der Ausgabe stoppt laufende Background-Musik zuverlässig und verhindert einen unmittelbaren Neustart durch den weiterhin sichtbaren Vorschaumodus.
- Beim Wechsel in den Bearbeitungsmodus wird eine laufende Vorschau-Wiedergabe beendet.
- Die Regel „Ende der Section“ berücksichtigt nun auch bei Item-Audio den tatsächlichen Abschnittswechsel.

---

# GottesdienstRegie 0.21.0

Veröffentlicht am 7. September 2026.

## Neu

- **Fehler melden:** Der Hilfe-Bereich besitzt einen strukturierten, in allen vorhandenen Oberflächensprachen vorbereiteten Fehlerdialog. Kurztitel, beobachtetes Verhalten, Reproduktionsschritte und erwartetes Verhalten werden als vollständiger GitHub-Bericht vorbereitet.
- **Bereinigte Diagnose:** Versionsnummer, Plattform und Sprache können optional ergänzt werden. Passwörter, Zwei-Faktor-Codes und vertrauliche Inhalte werden ausdrücklich ausgeschlossen.

## Verbessert

- Die öffentliche Release-Notes-Seite orientiert sich jetzt an einer professionellen Entwicklerdokumentation: feste Dokumentationsnavigation, Versionsleiste, Suche, Direktlinks, aktuelle Version, Downloadzugang und responsive Darstellung.
- Alle Bedientexte der Release-Notes-Webseite sind für Deutsch, Schweizerdeutsch, Englisch, Dänisch, Schwedisch, Norwegisch, Finnisch, Niederländisch, Französisch, Spanisch, Italienisch, Polnisch, Portugiesisch (Brasilien), Ukrainisch, Russisch, Türkisch und Arabisch vorbereitet.
- PowerPoint/Keynote/OpenDocument, Text/Markdown und GottesdienstRegie-Dateien öffnen nun jeweils einen passenden Dateifilter.

## Behoben

- Das Import-Untermenü erscheint nun auf Höhe von „Präsentation importieren“ statt am oberen Rand des Datei-Menüs.
- Das Hilfe-Dropdown ist breiter, besitzt klare Material-Symbole und zerlegt kurze Bezeichnungen nicht mehr in unleserliche Einzelzeilen.

---

# GottesdienstRegie 0.20.0

Veröffentlicht am 7. September 2026.

## Neu

- **Abschnittsmusik:** VORPROGRAMM, WARM-UP, GOTTESDIENST und NACHPROGRAMM erhalten eigene Background-Audio-Playlists. Folienwechsel und visuelle Schleifen bleiben von der Audio-Wiedergabe getrennt.
- **Element-Audio und Stop-Cues:** Einzelne Ablauf-Elemente können Abschnittsmusik ersetzen oder die Wiedergabe gezielt beenden. Änderungen sind in Rückgängig/Wiederholen enthalten.
- **Audio Browser:** Ein separates Desktopfenster zeigt die echten Audiodateien des Team-Cloudspeichers. Mehrere Titel können gewählt, angehört und vor dem Einfügen sortiert werden.
- **Live-Controller:** Der Operator kann den aktuellen Titel pausieren, fortsetzen, überspringen, stoppen, stummschalten und dessen Lautstärke verändern.

## Verbessert

- Playlists bieten Zufallswiedergabe, Wiederholung, Ein- und Ausblendzeiten, Titelübergänge sowie unterschiedliche Regeln für das Wiedergabeende.
- Videos mit hörbarem Ton können die Hintergrundmusik automatisch absenken und anschließend wieder anheben.
- Der Preflight prüft Background-Audio-Abhängigkeiten und nennt fehlende oder noch nicht vorbereitete Titel verständlich.
- Der konfigurierte Audioausgang aus den Einstellungen wird auch für Background Audio verwendet.

## Behoben

- Ein Neustart der Folienfolge in VORPROGRAMM oder NACHPROGRAMM beginnt einen bereits laufenden Audiotitel nicht erneut.

---

# GottesdienstRegie 0.19.0

Veröffentlicht am 7. September 2026.

## Neu

- **Tastenkürzel anpassen:** Unter Einstellungen → Tastenkürzel lassen sich Speichern, Rückgängig, Wiederholen, nächste und vorherige Live-Folie, Bearbeiten/Vorschau, Vollbild sowie ON AIR/OFF AIR neu belegen.
- **Echte Softwareaufnahmen:** Die Hilfe enthält echte Screenshots des Arbeitsbereichs, des Einstellungsfensters und der Medienbibliothek mit erklärenden Bildunterschriften.

## Verbessert

- Neue und erweiterte Hilfekapitel erklären Einstellungen, Songs, Bibel, STAGE, Schnellanzeigen, Timer, Fernsteuerung und Tastaturbedienung.
- Geänderte Kürzel werden auf dem Gerät gespeichert und sofort angewendet.
- Doppelte Belegungen werden verhindert; Escape bricht eine Aufnahme ab und die Standardbelegung kann vollständig wiederhergestellt werden.

## Behoben

- F11 wird nicht mehr unabhängig von den Einstellungen im Electron-Hauptprozess abgefangen. Die Vollbildfunktion folgt jetzt zuverlässig der gewählten Belegung.

---

# GottesdienstRegie 0.18.0

Veröffentlicht am 6. September 2026.

## Neu

- **Präsentationen umbenennen:** Im Datei-Menü kann die aktuell geöffnete Präsentation umbenannt werden. Der Name bleibt gespeichert und wird in der Bibliothek sowie beim erneuten Öffnen verwendet.
- **PowerPoint und OpenDocument:** `.pptx`- und `.odp`-Dateien werden folienweise importiert. Erkannte Textinhalte entstehen als bearbeitbare Folien in GottesdienstRegie.
- **Keynote:** `.key`-Dateien werden über eine enthaltene Vorschaugrafik übernommen. Für vollständig editierbare Inhalte weist die App auf den Export als `.pptx` hin.
- **Text und Markdown:** Absätze aus `.txt` und `.md` werden automatisch als einzelne Folien angelegt.

## Verbessert

- Der Bearbeiten-/Vorschau-Umschalter ist abgerundet und steht direkt links neben ON AIR.
- Die öffentliche Release-Notes-Seite besitzt ein neues responsives Design, eine Suchfunktion, Sprachwahl und eine gemeinsame Auf-/Zuklappfunktion.

---

# GottesdienstRegie 0.17.2

Veröffentlicht am 6. September 2026.

## Neu

- **Update-Kurzinfo:** Sobald eine neue Version gefunden wurde, steht direkt unter der Verfügbarkeitsmeldung eine kurze Zusammenfassung der wichtigsten Änderungen.

## Verbessert

- Die Kurzinfo nennt kompakt Kategorien wie „Neu“, „Verbessert“ und „Fehlerbehebungen“.
- Pro Kategorie erscheinen höchstens zwei kurze Punkte; ausführliche Beschreibungen bleiben in den Versionshinweisen.
- Die Kategorien werden passend zur gewählten Sprache angezeigt. Bei noch nicht lokal bekannten zukünftigen Versionen dient die GitHub-Zusammenfassung als Fallback.

---

# GottesdienstRegie 0.17.1

Veröffentlicht am 6. September 2026.

## Behoben

- **Servicezeit:** Das Popup zum Festlegen der Startzeit bleibt vollständig innerhalb der Ablaufspalte. Überschrift, Zeitfeld und Schaltflächen werden am linken Fensterrand nicht mehr abgeschnitten.
- **Kleine Fenster:** Die Popupbreite passt sich bei schmalen App-Fenstern an, ohne den Inhalt zu überdecken.

---

# GottesdienstRegie 0.17.0

Veröffentlicht am 6. September 2026.

## Neu

- **Live-Antwortfolie:** Jedes Quiz besitzt eine echte Abschlussfolie. Sie zeigt Stimmen je Auswahlmöglichkeit oder – sofern freigegeben – eingehende Freitextantworten und kann wie jede andere Folie gestaltet werden.
- **QR-Code vor dem Start:** Die Teilnahmefolie ist schon beim Erstellen vollständig sichtbar. Ein Vorschaucode wird beim automatischen Quizstart durch den gültigen Teilnahmecode ersetzt.
- **Mehr Schriftarten:** Der Texteditor enthält zahlreiche zusätzliche Präsentations- und Systemschriftarten samt Vorschau.

## Verbessert

- Quizfragen können per Drag-and-drop neu angeordnet werden; Fragenfolien und Auswertung bleiben synchron.
- Die Folienübersicht bietet acht feste Thumbnail-Stufen von 160 bis 440 Pixeln.
- Schnellanzeigen wie Logo, Schwarz, Ohne Text und Amen sind auf den Vorschau-Modus begrenzt.
- Die Hilfe erklärt die Benutzeroberfläche und den gesamten LiveQuiz-Ablauf ausführlicher mit schematischen Darstellungen.
- Dezente Einblend-, Hover- und Live-Animationen respektieren die Systemeinstellung für reduzierte Bewegung.
- Die animierte Updatesuche bleibt mindestens drei Sekunden sichtbar.

## Behoben

- Die Quizbeschreibung erscheint zuverlässig auf der Teilnahmefolie.
- Hauptmenüs liegen stets über Canvas, Editor, Popovern und weiteren Arbeitsbereichen.
- Zurückgehaltene Freitextantworten werden nicht auf MAIN ausgegeben; sichtbar bleibt nur ihre Anzahl.

---

# GottesdienstRegie 0.16.0

Veröffentlicht am 6. September 2026.

## Neu

- **Quiz-Teilnahmefolie:** Jedes Quiz beginnt mit einer echten Folie für QR-Code, Link und Teilnahmecode. Hintergrund, Texte, Farben und Positionen bleiben vollständig bearbeitbar.
- **Automatischer Start:** Beim Wechsel zu einem Quiz während ON AIR startet die Live-Sitzung und zeigt zuerst die Teilnahmefolie.
- **Freitext-Moderation:** Eine Checkbox pro Freitextfrage legt fest, ob Antworten bis zur Freigabe zurückgehalten werden.

## Verbessert und behoben

- QR-Codes werden durch die zentrale SlideRenderer-Engine in Editor, Vorschau und MAIN identisch dargestellt.
- Im Vorschau-Modus bleiben Format- und Bearbeitungswerkzeuge ausgeblendet.
- Login-Fotos erhalten keine falschen Ortsangaben mehr durch eine zufällige Dateireihenfolge.
- Version 0.13.0 und 0.13.1 erscheinen wieder vollständig im Versionsverlauf.

# GottesdienstRegie 0.15.4

Veröffentlicht am 6. September 2026.

## Neu

- **Animierte Updatesuche:** Während der Prüfung wechselt die Anzeige fortlaufend zwischen „Suche nach Updates“, „Suche nach Updates .“, „Suche nach Updates ..“ und „Suche nach Updates ...“.
- **Download abbrechen:** Rechts im grünen Download-Fortschrittsbalken befindet sich jetzt eine gut erreichbare X-Schaltfläche.

## Verbessert

- **Echter Abbruch:** Das X beendet die laufende Netzwerkübertragung über einen CancellationToken. Anschließend kann der Update-Download erneut gestartet werden.
- **Verständlicher Status:** Nach dem Abbruch zeigt die Anwendung eine klare Meldung, ohne einen technischen Fehlercode auszugeben.

---

# GottesdienstRegie 0.15.3

Veröffentlicht am 6. September 2026.

## Neu

- **Quizteilnahme auf MAIN:** Der Bediener kann eine fertige Teilnahmeansicht mit Quizname, QR-Code, Webadresse und sechsstelligen Code direkt auf MAIN anzeigen.
- **Weitere Ausgänge:** Auf Wunsch erscheint dieselbe Teilnahmeansicht gleichzeitig auf MAIN, STAGE, LIVESTREAM und LOBBY.
- **Link kopieren:** Der vollständige Teilnahmelink lässt sich direkt aus der laufenden Quizsitzung in die Zwischenablage kopieren.

## Verbessert

- **Live-Zustand bleibt erhalten:** Die Teilnahmeansicht arbeitet als temporäre Schnellanzeige. LAST SHOWN entfernt sie und stellt die zuvor laufende Livefolie unverändert wieder her.
- **Sichere Bedienung:** Die Ausgabeschaltflächen sind erst aktiv, wenn ON AIR läuft und der QR-Code vollständig erzeugt wurde.

---

# GottesdienstRegie 0.15.2

Veröffentlicht am 6. September 2026.

## Behoben

- **Alt+F4 während ON AIR:** Wird die Bedienoberfläche mit Alt+F4 oder dem Windows-X geschlossen, beendet der Main Process zuerst MAIN, STAGE, NOTES, LIVESTREAM und LOBBY.
- **Verwaiste Ausgabefenster:** Präsentationsfenster bleiben nicht mehr sichtbar, nachdem das Bedienfenster geschlossen wurde.

## Verbessert

- **Zentraler Shutdown:** Auch eine Programmbeendigung durch Update oder Betriebssystem verwendet denselben Output-Shutdown und markiert die Präsentationsbibliothek anschließend als sauber beendet.

---

# GottesdienstRegie 0.15.1

Veröffentlicht am 6. September 2026.

## Verbessert

- **Eigene Quizadresse:** Teilnahmelinks und lokal erzeugte QR-Codes verwenden jetzt dauerhaft `https://pgbielefeld.neocities.org/quiz`.
- **Firebase-Domain:** Die Einrichtungsanleitung nennt die Neocities-Domain, die für die anonyme Firebase-Anmeldung freigegeben werden muss.

---

# GottesdienstRegie 0.15.0

Veröffentlicht am 6. September 2026.

## Neu

- **Teilnahmecode:** Beim bewussten Start eines LiveQuiz erzeugt GottesdienstRegie eine echte, zufällige sechsstellige Sitzungskennung.
- **QR-Code:** Die Desktop-App erstellt den QR-Code lokal. Es werden keine Quizdaten an einen externen QR-Bilddienst gesendet.
- **Mobile Join-Seite:** Eine responsive Teilnahmeoberfläche aus HTML, CSS und JavaScript steht auf der öffentlichen GottesdienstRegie-Seite bereit.
- **Echtzeitteilnahme:** Besucher können anonym oder mit Anzeigenamen beitreten und auf die jeweils vom Bediener geöffnete Frage antworten.
- **Live-Steuerung:** Fragen werden gezielt gestartet, Antworten geschlossen und die gesamte Sitzung kontrolliert beendet.

## Verbessert

- **Live-Status:** Der Editor zeigt die tatsächliche Teilnehmerzahl und die Zahl der Antworten auf die aktuell geöffnete Frage.
- **Sitzungsschutz:** Die Quizdefinition wird während einer laufenden Sitzung gesperrt, damit Desktop und Teilnehmer dieselben Inhalte verwenden.
- **Ablauf:** Ein beendeter Teilnahmecode wird sofort aus der Codezuordnung entfernt und kann nicht erneut betreten werden.

## Sicherheit

- **Getrennte Datenbereiche:** Quizsitzungen, Codezuordnungen und Antworten besitzen getrennte Firebase-Regeln. Teilnehmer schreiben ausschließlich ihre eigene Antwort zur aktiven Frage.
- **Keine Lösungen im Browser:** Korrekte Antwortkennungen bleiben in der Desktop-Präsentation und werden nicht an die mobile Teilnahme-Seite ausgeliefert.
- **Keine geheimen Schlüssel:** Die Join-Seite enthält nur die vorgesehene öffentliche Firebase-Webkonfiguration, keine Administrator- oder Secret-Schlüssel.

---

# GottesdienstRegie 0.14.0

Veröffentlicht am 6. September 2026.

## Neu

- **LiveQuiz im Ablauf:** LiveQuiz ist jetzt über das Hauptmenü „Element hinzufügen“ und über das Plus im Order of Service erreichbar. Beide Wege erzeugen einen eigenen LiveQuiz-ServiceItem-Typ mit passendem Material Symbol.
- **Sicherer Erstellungsdialog:** Vor dem Anlegen werden Titel, Quiz oder Umfrage sowie anonyme oder namentliche Teilnahme ausgewählt. Abbrechen erzeugt weder ein Ablauf-Element noch eine Quizdefinition.
- **Spezialisierter Quizeditor:** Fragen, Antwortoptionen, korrekte Antworten, Zeitlimit, Punkte und nachträgliche Antwortänderung lassen sich unmittelbar bearbeiten.
- **Fragetypen:** Der Editor unterstützt Single Choice, Multiple Choice, Richtig/Falsch, Ja/Nein, Freitext, Skala und reine Umfragen.
- **Mehrere Fragen:** Ein LiveQuiz bleibt genau ein Ablauf-Element und kann darin beliebig viele interne Fragen verwalten. Die Fragenleiste ermöglicht das gezielte Auswählen, Hinzufügen und Löschen.

## Verbessert

- **Gemeinsame Darstellung:** Jede Quizfrage erzeugt eine echte Folie und verwendet denselben SlideRenderer wie Editor, Vorschau, Folienübersicht und MAIN.
- **Ablaufanzeige:** Statt einer generischen Folienzahl zeigt das LiveQuiz-Element seine tatsächliche Fragenanzahl.
- **Speicherung:** Quizdefinition, Teilnahmeart, Fragen, Antworten und Einstellungen werden gemeinsam mit der Präsentation gespeichert und durch Autosave erfasst.
- **Undo/Redo:** Erstellen und redaktionelle Änderungen laufen durch den zentralen History-Mechanismus. Eine neue Änderung verwirft den nicht mehr passenden Redo-Zweig.

## Sicherheit

- **Keine erfundene Teilnahme:** Ohne eingerichteten Audience-Dienst werden weder fingierte Besucher noch scheinbare Live-Ergebnisse oder Teilnahmecodes angezeigt. Freitextantworten dürfen später nur nach Moderation auf MAIN erscheinen.

---

# GottesdienstRegie 0.13.1

Veröffentlicht am 6. September 2026.

## Behoben

- **Cloud-Migration:** Statt der bisherigen allgemeinen Abbruchmeldung wird jetzt verständlich angezeigt, ob das Medien-Repository nicht privat ist, die GitHub-Berechtigung fehlt, die Verbindung unterbrochen wurde oder eine Datei nicht akzeptiert werden konnte.
- **Private Team-Medien:** Auflisten, Vorschau, Upload und Löschen verwenden einen authentifizierten Zugriff. Private Medien-URLs werden nicht als ungeschützte öffentliche Roh-Links an den Renderer weitergegeben.
- **Fortsetzen nach Fehlern:** Bereits erfolgreich migrierte Medien bleiben synchronisiert; nur die noch offenen Quelldateien werden bei einem weiteren Versuch erneut verarbeitet.
- **Präsentationsmenü:** Präsentationsinformationen, Servicezeit und ON AIR befinden sich wieder in genau einem zusammenhängenden Dropdown. ON AIR erscheint nicht mehr in einem abgesetzten zweiten Kasten.

## Verbessert

- **Medienfenster:** Das native Arbeitsfenster heißt nun eindeutig „GottesdienstRegie – Medienbibliothek“ und bleibt normal minimierbar, maximierbar sowie über den Windows-Fensterwechsel erreichbar.
- **Rückgängig/Wiederholen:** Beide Befehle bleiben an ihrer festen Position sichtbar. Ohne passenden History-Eintrag sind sie technisch und visuell deaktiviert und werden für Hilfstechnologien als nicht verfügbar bezeichnet.
- **Upload-Stabilität:** Vorübergehende Netzwerk- und Serverfehler werden begrenzt wiederholt, ohne eine Endlosschleife zu erzeugen.

---

# GottesdienstRegie 0.13.0

Veröffentlicht am 6. September 2026.

## Cloud-Medienbibliothek

Die Medienbibliothek ist jetzt ein eigener Desktop-Arbeitsbereich mit drei klar getrennten Quellen, einer professionellen Rasteransicht und einem Detailbereich. Die bisherige Anzeige lokaler Bestände sowie der dauerhafte technische GitHub-Status entfallen.

Lokale Dateien werden ausschließlich zum Hochladen ausgewählt. Erst nach erfolgreicher Übertragung steht das Cloud-Medium zur Verwendung in Präsentationen bereit. Vorhandene Altmedien können über einen sicheren Migrationshinweis übertragen werden.

## Sicheres Verwalten

Der Verwaltungsmodus zeigt keine irreführenden „Verwenden“-Schaltflächen. Im Auswahlmodus kann ein Medium gezielt als Inhalt oder Hintergrund übernommen werden. Medien, die gerade live oder in gespeicherten Präsentationen verwendet werden, sind vor versehentlichem Löschen geschützt.

## Darstellung

Suche, Filter und Sortierung bleiben kompakt. Das Raster reagiert auf die Fenstergröße, der Detailbereich bleibt erreichbar und echte Leer-, Lade- und Offline-Zustände ersetzen Platzhalter oder erfundene Inhalte.

---

# GottesdienstRegie 0.12.0

Veröffentlicht am 6. September 2026.

## Neu

- **Professionelles Datei-Menü:** Neu, Öffnen, zuletzt verwendete Präsentationen, Duplizieren, Import, Sicherung, Wiederherstellung, Drucken, Teilen und Beenden sind in einer klar gegliederten Menühierarchie verfügbar.
- **Neue Präsentation:** Titel, Datum, Servicezeit, Team und Vorlage werden in einem kompakten Dialog erfasst; die vier Standardbereiche werden automatisch angelegt.
- **Präsentationsauswahl:** Die Öffnen- und Duplizieren-Dialoge bieten Suche, Sortierung, echte Folienminiaturen, Metadaten und Doppelklick.
- **Duplizieroptionen:** Servicezeit, Medienreferenzen und Zielzeiten können gezielt übernommen werden.

## Verbessert

- **Tastaturbedienung:** Pfeiltasten navigieren im Datei-Menü; Escape schließt zuerst das Untermenü, danach das Hauptmenü und schließlich geöffnete Datei-Dialoge.
- **Eindeutige Kopien:** Duplizierte Präsentationen erhalten neue IDs für Präsentation, Bereiche, Ablauf-Elemente, Folien und Canvas-Elemente.
- **Live-Sicherheit:** Beim Beenden während ON AIR erscheint eine klare Warnung; nach Bestätigung werden Ausgaben kontrolliert beendet und der Stand gespeichert.

## Behoben

- **Zuletzt duplizieren:** Die im Untermenü gewählte Präsentation wird im Duplizieren-Dialog korrekt vorausgewählt.
- **Menüfokus:** Nach dem Schließen eines Dialogs kehrt der Tastaturfokus zum Datei-Menü zurück.

---

# GottesdienstRegie 0.11.1

Veröffentlicht am 2. September 2026.

## Behoben

- **Heller Modus:** Die vollständige Produktionsoberfläche übernimmt nun das helle Farbschema. Menü-, Ablauf-, Editor-, Timeline- und Werkzeugbereiche bleiben dadurch kontrastreich lesbar.
- **Einstellungen:** Titel, Bereichsüberschriften und Schließen-Schaltfläche erben keine helle Produktionsschrift mehr und sind auf dem weißen Dialoghintergrund wieder deutlich sichtbar.
- **Dunkler Modus:** Die bisherigen dunklen Produktionsfarben bleiben unverändert erhalten.

---

# GottesdienstRegie 0.11.0

Veröffentlicht am 2. September 2026.

## Neu

- **Hintergrund-Menü:** Medien durchsuchen, Bilder direkt importieren, zuletzt verwendete Motive auswählen und Füllfarben sofort anwenden.
- **Bildanpassung:** Hintergrundbilder weichzeichnen, drehen, an Höhe oder Breite anpassen, ausfüllen, einpassen und positionieren.
- **Hilfslinien:** Canvas Smart Guides, Randhilfen und Drittelregel lassen sich unabhängig ein- und ausschalten und bleiben auf den Editor beschränkt.
- **Anordnen:** Elemente nach vorn oder hinten legen, an sechs Positionen ausrichten, drehen, spiegeln sowie sperren und entsperren.

## Verbessert

- **Zentraler Renderer:** Hintergrundbilder, Bildposition, Unschärfe, Rotation, Spiegelung und Kursivschrift erscheinen in Editor, Vorschau, Thumbnails und MAIN identisch.
- **Medienbibliothek:** Aus dem Hintergrund-Menü ausgewählte Bilder ändern ausschließlich die aktuelle Folie und erzeugen kein neues Ablauf-Element.
- **Folienübersicht:** Der gespeicherte Thumbnail-Regler verändert nun sichtbar die Rastergröße, ohne Folieninhalt oder Canvas-Auflösung anzupassen.

## Behoben

- **Kleine Fenster:** Alle sechs Ausrichtungen sowie Drehen, Spiegeln und Sperren bleiben auch in einer kompakten Bedienoberfläche sichtbar.
- **Textformatierung:** Kursiv wird vom gemeinsamen Renderer tatsächlich dargestellt.

---

# GottesdienstRegie 0.10.0

Veröffentlicht am 2. September 2026.

## Neu

- **Produktionsarbeitsbereich:** Ablauf, spezialisierter Kontexteditor und große Ausgabenvorschau bilden eine dichte professionelle Arbeitsfläche. Output-Tabs und Formatierungsleiste bleiben sichtbar.
- **Songeditor:** Arrangement, Tonart, Lyrics-Abschnitte, Metadaten, CCLI-Optionen und mehrere echte Folienvorschauen sind gleichzeitig bearbeitbar.
- **Timeline:** Die Timeline zeigt aktive Elemente samt Dauer und Liveposition. Sie lässt sich aufklappen und in der Höhe anpassen.
- **Startbildschirm:** Das konfigurierte Loginmotiv füllt den Hintergrund; eine eigene dunkle Startkarte zeigt echte Ladephasen mit ruhigem Spinner.

## Verbessert

- **Ablauf:** Echte Miniaturansichten, kompakte Dauern, Wiederholung, Auswahl und Livezustand benötigen deutlich weniger Platz.
- **Updates:** Die voraussichtliche Restdauer basiert auf übertragenen Bytes und einer geglätteten realen Downloadgeschwindigkeit.
- **Tastatur:** Escape schließt im Haupteditor stets das oberste Menü oder Dialogfenster und bricht Sicherheitsdialoge ab.

## Geändert

- **Servicezeit:** Jede Präsentation besitzt exakt eine Servicezeit. Sie erscheint als `10:30 (VORM.)` beziehungsweise `15:30 (NACHM.)`.

## Behoben

- **Zeit festlegen:** Der Zeitdialog verändert den Aufklappzustand des Gottesdienstbereichs nicht; Escape verwirft die Änderung.

---

# GottesdienstRegie 0.9.2

Veröffentlicht am 2. September 2026.

## Verbessert

- **Professioneller Standardmodus:** Bei einer neuen Installation startet die Produktionsoberfläche standardmäßig im dunklen Design. Bereits gespeicherte Benutzereinstellungen bleiben unverändert.
- **Kompakte Ablaufzeiten:** Zeitangaben unter einer Minute erscheinen jetzt als `7s`, `10s` oder `45s`; längere Zeiten bleiben im Format `1:00` oder `3:06`.
- **Tastaturbedienung:** Das Einstellungsfenster lässt sich zuverlässig mit Escape schließen. Ein geöffneter Beta-Hinweis wird dabei zuerst geschlossen.

## Behoben

- **Einstellungsfenster:** Auswahlrahmen und Größenanfasser von Text-, Bild- oder Videoelementen können nicht mehr vor dem Einstellungsfenster erscheinen.
- **Dialogebenen:** Einstellungen, Hilfe, Medienbibliothek, Präsentationsbibliothek und Bestätigungsdialoge verwenden jetzt eine gemeinsame, geschützte oberste Anwendungsebene.
- **Zeitbearbeitung:** Kurze Zeitwerte mit `s` können nach der kompakten Darstellung weiterhin direkt bearbeitet und korrekt gespeichert werden.

---

# GottesdienstRegie 0.9.1

Veröffentlicht am 1. September 2026.

## Neu

- **Beta-Updates:** Unter Einstellungen → Updates lassen sich Vorabversionen optional aktivieren. Standardmäßig werden weiterhin nur stabile Versionen berücksichtigt.
- **Mehrere Servicezeiten:** Startzeiten können hinzugefügt, einzeln bearbeitet, entfernt und mit der Präsentation gespeichert werden.

## Verbessert

- **Einmaliger Warnhinweis:** Beim ersten Aktivieren des Beta-Kanals erklärt ein kompakter Dialog verständlich die möglichen Einschränkungen.
- **Versionsdarstellung:** Beta- und RC-Versionen werden verständlich benannt, mit einem dezenten BETA-Badge gekennzeichnet und unterstützen „Bekannte Probleme“.
- **Rückkehr zur stabilen Version:** Ist eine Beta installiert, wird die stabile Version mit Kompatibilitätsprüfung und Backup-Möglichkeit angeboten.

## Behoben

- **Zeit festlegen:** Ein Klick auf die Servicezeit öffnet nur noch den Zeitdialog und klappt GOTTESDIENST nicht mehr ein oder aus.
- **Getrennte Header-Aktionen:** Pfeil, Titel, Zeit, Plus und weitere interaktive Controls lösen keine unbeabsichtigten Mehrfachaktionen durch Event Bubbling mehr aus.
- **Unabhängiger Zustand:** Servicezeiten und Collapse-Zustand werden getrennt gespeichert; Zeitänderungen lassen den Abschnitt exakt im bisherigen Zustand.

---

# GottesdienstRegie 0.9.0

Veröffentlicht am 1. September 2026.

## Neu

- **Ablaufzeiten:** Elemente und einzelne Folien besitzen echte Wiedergabezeiten. Abschnittssummen werden automatisch berechnet und direkt im Ablauf oder Eigenschaftenbereich bearbeitet.
- **WARM-UP:** VORPROGRAMM, WARM-UP, GOTTESDIENST und NACHPROGRAMM sind getrennte Bereiche. Alte ANKOMMEN-Inhalte werden automatisch übernommen.
- **Zeitgesteuerter Übergang:** Wenn ON AIR bereits aktiv ist, startet WARM-UP anhand seiner berechneten Dauer und wechselt zur hinterlegten Servicezeit in den Gottesdienst.
- **GitHub-Medienbibliothek:** Lokale Medien lassen sich prüfsummenbasiert mit dem öffentlichen Repository `cmoere/GottesdienstRegie-Media` synchronisieren.
- **StorageProvider:** Lokaler Cache und GitHub-Speicher sind sauber getrennt; weitere Speicherziele können später ergänzt werden.
- **Audio:** Importierte Audiodateien werden als echte Player-Elemente in Vorschau und Live-Ausgabe wiedergegeben.
- **Timer und Countdown:** Zeiten laufen in der tatsächlichen MAIN-Ausgabe sekundengenau und können einen Endtext anzeigen.

## Verbessert

- **Bearbeiten/Vorschau:** Der kompakte Schiebeschalter entspricht dem Referenzdesign und markiert den aktiven Modus gelb.
- **Startbildschirm:** Der echte mindestens zehnsekündige Startvorgang verwendet einen Spinner ohne Balken und Prozentanzeige.
- **Ablaufdarstellung:** Echte Miniaturansichten, Typ-Symbole, Schleifenstatus, einklappbare Bereiche und direkt bearbeitbare Dauern verbessern lange Abläufe.
- **Elemente hinzufügen:** Bild, Video, Audio, PDF, Slideshow, Timer, Countdown, Ankündigung, Stage-Nachricht und Schnellanzeige erzeugen typgerechte Inhalte statt leerer Platzhalter.
- **Medienende:** Das Ende von Video und Audio kann sicher die nächste aktive Folie aufrufen.

## Behoben

- **Lokale Videos:** Die Auswahl „Datei“ öffnet tatsächlich den Medien-Dateidialog und erzeugt ein vollflächiges Videoelement.
- **Schleifen:** Vor- und Nachprogramm springen nach der letzten aktiven Folie verlässlich an den Bereichsanfang zurück.
- **Migration:** Vorhandene Präsentationen werden um Timing-Daten ergänzt, ohne ihre Folien zu verlieren.

## Sicherheit

- **GitHub-Zugang:** Zugangsdaten bleiben im Electron-Hauptprozess und werden weder an den Renderer noch in Präsentations- oder Mediendaten geschrieben.
- **Große Videos:** Dateien oberhalb der sicheren GitHub-Grenze bleiben lokal und verursachen keinen unvollständigen Upload.
# 0.42.0 – Zuverlässigere Medien, Formen und Bedienoberfläche

Version 0.42.0 trennt die Spezialelemente des Vor- und Nachprogramms eindeutig von normalen Gottesdienst-Inhalten. Die 2D-Objektgalerie verwendet echte SVG-Vektoren, persönliche Notizen zeigen einen verständlichen und zeitlich begrenzten Speicherstatus, und die Einzelvorschau kommt ohne störenden Folienschatten aus.

Neu sind außerdem die getestete Grundlage für fünf feste Anzeigegrößen, kollisionssichere Popovers, eine typisierte Videoauswahl und eine Plattform-Erkennung für Liquid-Glass-Materialien unter macOS 26. Alle Bedienhilfen bleiben auf das Operatorfenster beschränkt; MAIN, STAGE und Livestream behalten ihr festgelegtes Layout und ihre Farben.

Sprachmodelle und Radiosuche benötigen für neue Downloads weiterhin eine Internetverbindung. Netzwerkfehler verändern weder bereits gespeicherte Übersetzungstexte noch eine laufende Ausgabe.
