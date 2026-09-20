# GottesdienstRegie – Editor-, Sprachpaket-, Notiz- und Loop-Redesign

**Datum:** 20. September 2026  
**Status:** Zur schriftlichen Freigabe

## 1. Ziel

Die nächste Version korrigiert die gemeldeten Layoutfehler in Präsentationseinstellungen und Einfügefenstern, trennt Pre-/Post-Loop-Elemente zuverlässig von normalen Serviceelementen, gestaltet persönliche Notizen als brauchbaren Editor, erweitert 2D-Objekte zu einer durchsuchbaren Galerie und entwickelt die automatische Übersetzung zu einem mehrsprachigen, gerätelokalen Sprachpaketsystem weiter. Der Schwarz-Weiß-Modus gilt danach ausschließlich für die Bedienoberfläche und niemals für Ausgabefenster.

## 2. Abschnittsgebundene Loop-Elemente

Eine zentrale pure Regel `canInsertItemType(type, section)` entscheidet für alle Bedienwege, ob ein Element in einem Abschnitt zulässig ist. Loop-Elemente wie Meldungen, Geburtstage, Veranstaltungen, Wetter, Quiz, Countdown, Uhrzeit, Bibelvers, QR-Code, Infokarte, Heute bei uns und Nächste Termine sind ausschließlich in Vorprogramm und Nachprogramm zulässig.

Die Regel wird gleichermaßen für folgende Wege verwendet:

- Element-hinzufügen-Menü,
- Abschnittsbezogenes Plus-Menü,
- Drag-and-drop,
- Verschieben über Kontextmenü,
- Duplizieren und Einfügen,
- Laden älterer Präsentationen.

Bei normalen Abschnitten werden Loop-Elemente gar nicht angezeigt. Im Vor-/Nachprogramm zeigt das Fenster zuerst die kompakte Kategorie `LOOP-ELEMENTE`, darunter getrennt die normalen Inhalte. Ein unzulässiger programmatischer Einfügeversuch wird abgelehnt und verändert die Präsentation nicht. Alte unzulässige Einträge werden beim Laden nicht gelöscht, sondern als fehlerhaft markiert und müssen in Vor-/Nachprogramm verschoben werden.

## 3. Notizen

### 3.1 Präsentationsnotiz

Direkt unter dem Präsentationstitel erscheint ein kompakter Button `Meine Präsentationsnotiz`. Er zeigt bei vorhandenem Inhalt einen diskreten Statuspunkt. Ein Klick öffnet einen Dialog mit Rich-Text-Editor.

Der Editor unterstützt:

- Fett, Kursiv und Unterstrichen,
- Aufzählung und nummerierte Liste,
- Textausrichtung,
- Rückgängig und Wiederholen,
- Tastenkürzel für Fett, Kursiv und Unterstrichen,
- Klartext-Einfügen ohne fremde Skripte oder unsichere Formatierung.

### 3.2 Foliennotiz

`Meine Notiz zu dieser Folie` bleibt im Folieneditor, erhält aber ein kontrastreiches, kompaktes Design. Der Satz `Privat · nicht synchronisiert · nicht in Ausgaben sichtbar` wird vollständig entfernt. Nur Speichern, Gespeichert und lokale Fehler werden angezeigt.

### 3.3 Speicherung

Notizen werden nach Benutzer-, Präsentations- und optionaler Folien-ID getrennt gespeichert. Rich Text wird als bereinigte strukturierte Blöcke gespeichert, nicht als beliebiges HTML. Notizen gehören niemals zum synchronisierten Präsentationsdokument und werden nicht von MAIN, STAGE, LIVESTREAM, LOBBY, NOTES oder Export gelesen.

## 4. Mehrsprachige lokale Übersetzung

### 4.1 Sprachauswahl

Ausgangs- und Zielsprache verwenden dasselbe durchsuchbare Dropdown. Jeder Eintrag zeigt Flagge, deutschen Sprachnamen, optional den Namen in der Sprache selbst und den lokalen Paketstatus.

Die 15 Standardsprachen sind Deutsch, Englisch, Französisch, Spanisch, Italienisch, Niederländisch, Polnisch, Portugiesisch, Ukrainisch, Russisch, Türkisch, Arabisch, Dänisch, Schwedisch und Norwegisch. Weitere unterstützte Sprachen bleiben sichtbar und durchsuchbar.

### 4.2 Sprachpakete

Ein `LanguagePackManager` verwaltet Modell-ID, Sprachrichtung, Version, Größe, SHA-256-Prüfsumme, Downloadstatus, lokalen Pfad und letzten Einsatz. Die Übersetzungs-Engine und alle 15 Standardpakete werden nach dem Programmstart im Hintergrund vorbereitet. Die Bedienoberfläche und Liveausgabe werden dabei nicht blockiert.

Weitere Sprachen zeigen ein Wolkensymbol. Ein Klick lädt das zugehörige Paket. Währenddessen erscheinen Spinner, Prozentwert, übertragene Datenmenge und Abbrechen. Nach erfolgreicher Prüfung ersetzt `Lokal verfügbar` die Wolke. Zusatzpakete können in den Einstellungen entfernt werden, solange kein aktiver Download läuft.

Falls das tatsächliche Modellformat ein eigenes Modell je Sprachrichtung benötigt, zeigt die Oberfläche die Richtung ausdrücklich an und verwaltet beide Richtungen getrennt. Die Anwendung behauptet nicht, eine Sprache sei vollständig verfügbar, wenn nur eine Richtung installiert ist.

### 4.3 Präsentationen auf anderen PCs

Die Präsentation speichert Sprachcodes, Modellversion des erzeugenden Geräts, übersetzten Text und den Status `maschinell` beziehungsweise `bestätigt`. Sie speichert niemals das Modell.

Gespeicherte Übersetzungen werden auf jedem PC sofort angezeigt. Ein Sprachpaket ist nur nötig, wenn neue Übersetzungen erzeugt oder bestehende maschinell neu übersetzt werden. Fehlt das Paket, zeigt der Song-Editor Sprache, Richtung, Downloadgröße und einen Downloadbutton. Beim Öffnen werden fehlende verwendete Pakete gesammelt angezeigt, aber nicht ungefragt geladen.

### 4.4 Fortschritt und Sicherheit

Beim Übersetzen zeigt der betroffene Abschnitt Spinner und Prozentwert. Mehrere Folien werden nacheinander verarbeitet; fertige Entwürfe bleiben bei Abbruch erhalten, die aktive unvollständige Antwort wird verworfen. Akkordmaskierung und Zeilenstruktur bleiben erhalten. Download-, Modell- oder Übersetzungsfehler verändern weder Originaltext noch MAIN.

## 5. 2D-Objektbibliothek

Das bisherige Select-Menü wird durch eine Galerie ersetzt. Objekte erscheinen mit Symbolvorschau und Namen. Eine Suche berücksichtigt Name, Kategorie und Synonyme.

Kategorien:

- Grundformen,
- Pfeile und Richtungen,
- Banner und Beschriftungen,
- Rahmen und Flächen,
- Diagramm- und Ablaufobjekte,
- Symbole,
- Kirche und Gottesdienst.

Zusätzlich zu den vorhandenen Formen werden mindestens Doppel- und Kurvenpfeile, Sprech- und Gedankenblasen, Bänder, Wimpel, Klammern, Dokument, Prozess, Entscheidung, Datenbank, Person, Gruppe, Standort, Kalender, Uhr, Musik, Mikrofon, Kamera, Kreuz, Bibel, Taube, Kelch und Kerze angeboten. Alle erzeugten Objekte bleiben normale skalier-, dreh-, färb- und sortierbare Canvas-Elemente.

## 6. Design und Kontrast

### 6.1 Präsentationseinstellungen

Numerische Felder für Animationsdauer und Deckkraft erhalten mindestens 96 Pixel Breite, eine separate Einheit und einen vollständig sichtbaren Fokusrahmen. Beschriftung, Eingabe und Einheit überlappen bei 100, 125 und 150 Prozent Skalierung nicht.

### 6.2 Einfügefenster

Das Abschnittsmenü verwendet ein begrenztes, scrollbareres Fenster mit Raster statt langer unstrukturierter Liste. Kategorieüberschriften bleiben beim Scrollen sichtbar. Icon, Name und Fokuszustand besitzen ausreichend Kontrast in hellem, dunklem und Schwarz-Weiß-Modus.

### 6.3 Notizen

Notizbutton, Popup, Toolbar, Editorfläche und Statusmeldungen verwenden die vorhandenen Designvariablen mit mindestens WCAG-AA-Kontrast für normalen Text. Dialoge bleiben in kleinen Fenstern erreichbar und besitzen eine eigene interne Scrollfläche.

## 7. Schwarz-Weiß-Isolation

Der Schwarz-Weiß-Modus wird nur am Wurzelelement des Operatorfensters angewandt. Output-BrowserWindows, gerenderte Slides, Vorschaudaten, Snapshots und exportierte Medien erhalten weder Filter noch Schwarz-Weiß-Datenattribute. Der Hilfetext wird in allen vorhandenen Übersetzungen so geändert, dass er ausdrücklich nur die Bedienoberfläche nennt.

## 8. Hilfe

Alle Aussagen, wonach kein API-Schlüssel verwendet wird, werden aus der Hilfe entfernt. Die technische Eigenschaft bleibt bestehen, wird aber nicht als Hilfetext hervorgehoben. Neue Hilfeartikel erklären Sprachpakete, Wolkensymbol, Standardpakete, Zusatzdownload, Nutzung auf anderen PCs, Speicherverwaltung, Loop-Beschränkungen und persönliche Notizen.

## 9. Startverhalten und Ressourcen

Das Vorbereiten der 15 Standardpakete beginnt nach Darstellung der normalen Bedienoberfläche. Downloads sind begrenzt parallel, pausierbar und haben geringere Priorität als MAIN, STAGE, LIVESTREAM, Audio und Recording. Unvollständige Dateien werden nicht als installiert markiert. Bei wenig Speicherplatz wird vor dem Download die benötigte und verfügbare Größe angezeigt.

Da 15 Sprachrichtungen erheblichen Speicher benötigen können, zeigt die Einstellungsseite Gesamtgröße und Einzelgrößen. Der Benutzer kann Standardpakete nicht versehentlich während einer laufenden Übersetzung löschen; Zusatzpakete bleiben entfernbar.

## 10. Tests und Abnahme

1. Loop-Elemente werden außerhalb von Vor-/Nachprogramm in keinem Einfüge- oder Verschiebeweg angeboten oder angenommen.
2. Screenshot 1 ist bei 100, 125 und 150 Prozent Skalierung ohne abgeschnittene Zahlenfelder reproduzierbar korrigiert.
3. Screenshot 2 zeigt ein kompaktes, kontrastreiches Raster und ausschließlich für den Zielabschnitt zulässige Typen.
4. Präsentationsnotizen öffnen direkt unter dem Titel einen Rich-Text-Dialog; Foliennotizen zeigen den unerwünschten Privatsatz nicht mehr.
5. Notizen erscheinen in keinem synchronisierten Dokument und keiner Ausgabe.
6. Ausgangs- und Zielsprache sind durchsuchbar und zeigen Flagge sowie Paketstatus.
7. Die 15 Standardsprachen werden im Hintergrund vorbereitet; Zusatzsprachen zeigen eine Wolke und können einzeln geladen werden.
8. Auf einem zweiten PC sind gespeicherte Übersetzungen ohne Modell sichtbar; erneute automatische Übersetzung fordert das fehlende Paket an.
9. Spinner und Prozentwert werden bei Paketdownload und Übersetzung angezeigt; Abbruch beschädigt keine gespeicherten Inhalte.
10. Die 2D-Galerie ist durchsuchbar, zeigt Symbol und Name und fügt alle neuen Formen als normale Canvas-Elemente ein.
11. Schwarz-Weiß verändert ausschließlich die Bedienoberfläche und niemals MAIN, STAGE, LIVESTREAM, LOBBY oder Exporte.
12. Hilfe enthält keine Hinweise auf einen nicht benötigten API-Schlüssel.
13. TypeScript-Prüfung, Domänentests, UI-Integrationstests, Produktionsbuild und Windows-Installer laufen fehlerfrei.
