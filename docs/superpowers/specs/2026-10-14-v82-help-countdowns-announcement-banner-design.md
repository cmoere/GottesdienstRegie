# GottesdienstRegie v82 – Design

Stand: 14.10.2026. Status: schriftlicher Entwurf zur Freigabe; noch keine Implementierung.

## Ziel und Grenzen

v82 verbessert Hilfe und Versionshinweise, ergänzt eine lokale Countdown-Bibliothek und führt einen unabhängigen Meldungsbanner ein. Die bestehende Firebase-, Live-, Output- und Audioarchitektur bleibt erhalten. Bestehende Präsentationen, geschützte Nachprogrammfolien und Ausgabezuordnungen müssen kompatibel bleiben. Keine zweite Datenbank, keine zusätzliche Firebase-Initialisierung, keine kostenpflichtige API und keine Änderungen am Audioverhalten durch den Banner.

Die Oberfläche und Beispiele bleiben auf den evangelisch-christlichen Gemeindeeinsatz ausgerichtet. Ruhige, gut lesbare Gestaltung mit den vorhandenen Gemeindefarben hat Vorrang vor dekorativen Effekten.

## 1. Fehler aus dem Screenshot

Der gezeigte EBUSY-Fehler stammt aus einem lokalen Login-Smoke-Test: Ein Exit-Handler wollte dessen temporäres Chromium-Profil löschen, obwohl eine Datei noch gesperrt war. Die aktuelle Fassung von `tests/smoke/native-v81-login.cjs` enthält diese Löschung bereits nicht mehr. Der Test gehört nicht zum Installer.

v82 sichert diesen Befund durch einen Regressionstest ab. Temporäre Profile dürfen nicht im Exit-Handler des noch laufenden Electron-Prozesses rekursiv entfernt werden. Eine spätere Bereinigung darf ausschließlich explizit identifizierte Testprofile nach Beendigung des Kindprozesses betreffen; gesperrte Dateien führen dort zu einer kontrollierten Diagnose statt zu einer ungefangenen Ausnahme. Aktive Profile und Benutzerprofile bleiben unberührt. Andere Main-Prozess-Fehler werden nicht pauschal unterdrückt. Ein erneuter Fehler in der installierten Anwendung wird anhand seines eigenen Logs untersucht.

## 2. Hilfe

Die bestehenden Artikel-IDs, Suche und Navigation bleiben erhalten. Alle vorhandenen Artikel werden fachlich überprüft und deutlich hilfreicher ausgearbeitet: Zweck, Voraussetzungen, verständliche Schritte, erwartetes Ergebnis, typische Fehler und passende Querverweise. Gemeindenahe Beispiele behandeln unter anderem Gottesdienst, Bibeltexte, Lieder, Gemeindemeldungen, Vor- und Nachprogramm sowie Proben im Testbetrieb.

Bestehende Legacy-Ergänzungen werden mit den aktuellen Texten zusammengeführt, damit keine widersprüchlichen oder wiederholten Anweisungen entstehen. Artikel werden nicht durch allgemeine Fülltexte verlängert. Funktionsbeschreibungen müssen der tatsächlich verfügbaren Software entsprechen.

Das Hilfefenster erhält eine gut lesbare Inhaltsstruktur, eine klare Artikelüberschrift, Schrittfolgen, dezente Hinweis-/Warnbereiche und bei längeren Artikeln eine lokale Inhaltsnavigation. Suche, Tastaturbedienung, schmale Fenster, Hell-/Dunkeldarstellung und RTL-Sprachen werden berücksichtigt. Strukturierte Inhalte dürfen eingeführt werden, bestehende textbasierte Artikel bleiben über einen kompatiblen Adapter nutzbar.

Alle 17 vorhandenen Sprachvarianten werden berücksichtigt: Deutsch, Schweizer Standarddeutsch, Englisch, Dänisch, Schwedisch, Norwegisch, Finnisch, Niederländisch, Französisch, Spanisch, Italienisch, Polnisch, Portugiesisch (Brasilien), Ukrainisch, Russisch, Türkisch und Arabisch. Schweizer Standarddeutsch wird nicht als Dialekt ausgegeben. Fachbegriffe und Bedienbezeichnungen bleiben konsistent; fehlende Übersetzungen dürfen keine leeren Artikel erzeugen.

### Bilder

Veraltete Screenshots werden durch echte Aufnahmen der aktuellen Anwendung mit fiktiven Gemeinde- und Benutzerdaten ersetzt. Jede Abbildung erhält eine passende Beschreibung und einen Alternativtext. Die fest verdrahtete Beschriftung „v77“ entfällt. Bilder illustrieren relevante Bedienhandlungen, statt nur Fläche zu füllen. Vertrauliche Daten, private Konten und technische IDs werden nicht veröffentlicht. Keine erfundenen UI-Mockups als echte Screenshots. Zusätzliche Bilder werden nur mit geklärter Nutzungserlaubnis eingebunden.

## 3. Professionelle Versionshinweise

`public/releases.json` und `RELEASE_NOTES.md` werden für alle vorhandenen Versionen redaktionell überarbeitet. Die aktuelle Bestandsaufnahme umfasst 81 Versionslinien und 118 Builds. Versionsnummern, Veröffentlichungsdaten, Reihenfolge, Updatezuordnung und historische Aussagen bleiben erhalten.

Hinweise beschreiben nachvollziehbar den Nutzen und gliedern sich, soweit inhaltlich vorhanden, in Neu, Verbessert, Behoben und Bekannte Einschränkungen. Interne Arbeitsnotizen, unbelegte Superlative und unverständliche Kurzformen werden ersetzt. Es werden keine historischen Funktionen oder Fehlerbehebungen erfunden; v82-Funktionen werden nicht rückwirkend älteren Versionen zugeschrieben. Historisch wichtige Einschränkungen bleiben sichtbar. Vorhandene Sprach- und Fallbackmechanismen werden erhalten.

Die Versionsnummer wird erst im tatsächlichen Release-Schritt nach erfolgreicher Implementierung und Prüfung erhöht. Dieser Designentwurf veröffentlicht keine neue Version.

## 4. Countdown-Bibliothek im Medienbrowser

Ein eigener Bereich „Countdowns“ bietet vollständig lokal verfügbare Vorlagen. Dauern: 20, 15, 10, 5, 3, 2 und 1 Minute sowie 30, 20 und 10 Sekunden. Für jede Dauer gibt es sechs Designs: Klar, Natur, Licht, Kreuz, Kerze und Geometrisch. Damit entstehen 60 Kombinationen mit ruhiger, gemeindetauglicher Darstellung. Ton ist standardmäßig ausgeschaltet.

Vorlagen werden als Vorschaukacheln angezeigt und nach Dauer und Design auswählbar. Die Übersicht verwendet statische Vorschauen; nur die gezielt geöffnete Vorschau animiert. Es laufen nicht 60 parallele Timer.

Eine Vorlage erzeugt ein natives Countdown-Element mit stabiler Vorlagen-ID, Dauer in Sekunden und Design-ID. Sie ist weder eine Videodatei noch ein fingierter Cloud-Medieneintrag. Bestehende Countdown-Bearbeitung und Präsentationsspeicherung werden weiterverwendet. Ohne ausdrücklich konfigurierte Weiterregel bleibt der Countdown bei 00:00 stehen.

Im Audio-Auswahldialog wird der Bereich ausgeblendet. Bei Hintergrund-/Vordergrundauswahl darf eine Vorlage nicht als Bilddatei zurückgegeben werden; stattdessen steht gegebenenfalls die eindeutige Aktion „Als Countdown zum Ablauf hinzufügen“ bereit. Einfügeposition und geschützte Systemfolien werden respektiert.

Die Auswahl wird über eine additive, typisierte Medienbrowser-/IPC-Schnittstelle transportiert und im Main-Prozess gegen den Vorlagenkatalog validiert. Bestehende Datei- und Audioauswahl bleibt unverändert.

Countdowns nutzen eine gemeinsame verankerte Startzeit aus der vorhandenen App-/TrustedClock-Logik. Ausgabe und Spiegelvorschau berechnen daraus denselben verbleibenden Wert. Keine unabhängigen, schrittweise herunterzählenden Fenster-Timer als Zeitquelle. Bestehende Quick-Screen-, OSB- und Weitersteuerungsregeln bleiben erhalten.

## 5. Meldungsbanner: Daten und Freigabe

Firebase bleibt die einzige Quelle unter `meldungen/`. Der vorhandene zentrale Gemeinde-Service liefert Rohdaten an den AnnouncementService. Dieser verantwortet gemeinsam genutzte Status-, Papierkorb- und Zeitprüfungen und erzeugt einen reduzierten öffentlichen Banner-Snapshot. Renderer lesen Firebase nicht direkt.

Die vorhandene Freigabe `showMeldungBanner` steuert den Bannerkanal. Öffentlicher Status, kein Papierkorb und gültiges Zeitfenster sind zwingend. Die bestehende Saalscreen-Startlogik (`showFrom` bei aktivierter entsprechender Option, sonst `giltAb`) und „Bis auf Weiteres“ werden wiederverwendet. Ein explizites `gottesdienstRegie.enabled: false` sperrt die Meldung auch hier.

Bannerfreigabe und normale Meldungsfolie sind getrennte Kanäle: `messageScreen` und normale `loopTargets` steuern weiterhin die Meldungsfolien; eine reine Bannerfreigabe erzeugt keine zusätzliche Meldungsfolie und benötigt keine zweite Freigabe als Meldungsfolie.

Textpriorität: `textBanner`, danach `textLaufbanner`, `textMeldung`, `beschreibung`, zuletzt `titel`. Leere Texte werden ausgeschlossen. Der Banner zeigt bereinigten Klartext in einer Zeile, kein ausführbares HTML. Interne Kommentare, Benutzerdaten und Adminfelder gelangen nicht an Outputs. IDs dienen nur der internen Identität und werden niemals ausgegeben.

Mehrere Meldungen laufen nacheinander in stabiler Reihenfolge: absteigende bestehende Priorität, anschließend stabile ID als Gleichstandsregel. Änderungen werden vorbereitet und erst an der nächsten vollständigen Banner-Rundengrenze übernommen. Ein aktuell sichtbarer Text wird nicht mitten im Satz ersetzt. Gelöschte oder abgelaufene Meldungen beginnen keine weitere Runde.

## 6. Banner: Ausgabe und Bedienung

Der Banner läuft im Live-Vor-/Nachprogramm sowie bei einem aktiven Countdown unabhängig von der darüberstehenden Folie. Entscheidend ist der tatsächliche Live-Zustand, nicht die im Editor ausgewählte Folie. Im normalen Gottesdienst ohne Countdown wird kein Banner angezeigt. Andere Quick Screens, insbesondere Schwarz, Logo und OSB, haben Vorrang und unterdrücken den Banner; der Countdown ist die ausdrücklich erlaubte Ausnahme.

Die Position ist als technische Präsentationseinstellung oben oder unten wählbar, Standard unten. Richtwerte bei 1920×1080: 84 px hoher weißer Bereich, rote Schrift `#A65353`, Cera Pro in regulärem Gewicht mit Systemfont-Fallback, etwa 44 px. Die Schrift ist gut lesbar, ohne Blinken oder Toneffekt. Die rote Farbe ist eine bewusste Ausnahme zur normalen Gemeinde-Akzentpalette.

Text läuft ruhig mit ungefähr 60 Referenzpixeln pro Sekunde, mit kurzer Anfangs-/Endpause und vollständig lesbarem Ende. Die Dauer ergibt sich aus der tatsächlich gemessenen Textbreite. Bei reduzierter Bewegung werden statische, vollständig lesbare Textabschnitte mit ausreichender Lesezeit verwendet.

Die Output-Komposition besteht aus einem proportional eingepassten Inhalts-/Quick-Screen-/Übergangsbereich, einem unabhängigen Banner-Layer und darüber dem Testbetrieb-Wasserzeichen. Der Inhalt behält sein Seitenverhältnis und wird in die verbleibende Höhe eingepasst: kein Strecken, Abschneiden oder Überdecken. Freiflächen werden neutral gefüllt. Das Wasserzeichen bleibt unskaliert und bei Übergängen dauerhaft sichtbar.

Wenn keine gültigen Banner existieren, wird kein Platz reserviert. Eine Änderung der reservierten Fläche erfolgt am nächsten sicheren Take-/Loop-Wechsel; beim gezielten Start eines Countdown-Quick-Screens mit dessen Take. Textwechsel innerhalb einer bereits reservierten Fläche brauchen keinen Folienwechsel. Layoutwechsel werden nicht mitten in einem sichtbaren Frame erzwungen.

MAIN und Vorschauen, die das tatsächliche MAIN-Bild spiegeln, verwenden dieselbe Komposition. Dasselbe gilt für Virtual Screens und Personal Monitors, soweit sie MAIN spiegeln. Eigenständig komponierte STAGE-, Notiz-, LIVESTREAM- und Lobby-Ausgaben werden nicht ungefragt um einen Besucherbanner erweitert. Spiegelt ein Stream oder Recording MAIN, ist der Banner Bestandteil dieses tatsächlichen Bildes.

### Zustandsübertragung und Live-Sicherheit

Der Output-State wird additiv um einen öffentlichen Bannerzustand samt eigenem Änderungsstand und Zeitanker ergänzt. Neue Fenster erhalten sofort den aktuellen Zustand. Ein Bannerupdate darf nicht erneut die aktuelle Folie übernehmen, deren Startzeit ändern, Übergänge auslösen, Medien neu starten oder Audio unterbrechen. Die bestehenden globalen Output-Revisionen allein dürfen nicht als Anlass zum erneuten Setzen aller Layer dienen.

Bannerfortschritt bleibt über Folienwechsel hinweg erhalten. Testbetrieb und ON AIR beeinflussen weder Banneruhr noch Audio; das globale Testwasserzeichen liegt darüber. Offline dürfen bestehende, fachlich gültige Cache-Snapshots verwendet werden. Technische Fehler erscheinen ausschließlich in Operator-UI/Preflight, niemals im Banner oder auf MAIN.

## 7. Verifikation und Abnahme

- Screenshotfehler: Login-Smoke-Test beendet sich ohne ungefangenen EBUSY-Fehler; Regression schützt vor Profil-Löschung im Kindprozess-Exit. Installer enthält keine Smoke-Testdateien.
- Hilfe: Alle vorhandenen Artikel und 17 Sprachvarianten sind erreichbar; Suche, Querverweise, Tastaturbedienung und RTL funktionieren. Aktuelle Screenshots und Beschreibungen stimmen mit der Anwendung überein; keine privaten Daten.
- Versionshinweise: Alle bisherigen Versionen/Builds bleiben erhalten; Fakten und Metadaten stimmen zwischen Quellen überein. Keine rückwirkend erfundenen Release-Aussagen.
- Countdowns: Alle 60 Kombinationen sind offline auswählbar, korrekt gespeichert und wiederherstellbar. Audioauswahl bleibt frei von Countdown-Vorlagen. MAIN und Spiegelvorschau zeigen dieselbe Restzeit; 00:00- und Weitersteuerungsregeln sind geprüft.
- Banner: Freigabe, Status, Start-/Endgrenzen, Textfallback, Priorität, Papierkorb und mehrere Meldungen werden mit festen Testzeiten geprüft. Reine Banner- und reine Folienmeldungen beeinflussen sich nicht versehentlich.
- Darstellung: Oben/unten, lange Texte, reduzierte Bewegung und unterschiedliche Ausgabegrößen ohne Überlappung oder Verzerrung. Vor-/Nachprogramm und Countdown verkleinern nur den Contentbereich; normaler Gottesdienst und priorisierte andere Quick Screens bleiben bannerfrei.
- Live-Sicherheit: Folienwechsel setzt Banner nicht zurück; Bannerupdate startet keine Folie, kein Video und kein Audio neu. Änderungen werden an den definierten sicheren Grenzen übernommen. MAIN und Spiegelvorschau verwenden dieselben Daten und Zeitanker.
- Testbetrieb: Wasserzeichen über Banner, Video und Schwarz, unabhängig von ON AIR; Normalbetrieb ohne Wasserzeichen. Aufnahmen/Streams echter MAIN-Spiegel enthalten die finale Komposition.
- Offline-/Regressionstests: Kein Rohobjekt, keine interne ID, kein Netzwerkfehler auf Besucherausgaben. Bestehende Radio-, OSB-, Nachprogramm-, Displayzuordnungs- und Updatefunktionen bleiben funktionsfähig.

## 8. Freigabe und Veröffentlichung

Nach Freigabe dieses schriftlichen Designs folgt ein konkreter Implementierungsplan. Erst danach werden Produktcode, Inhalte und Assets geändert. Die Veröffentlichung erfolgt erst nach automatisierten Tests, visueller Prüfung der realen Anwendung und Prüfung des erzeugten Installers sowie des Updatekanals. Nicht ausgeführte Hardware-/Streamingprüfungen werden transparent als offen genannt; sie werden nicht als bestanden ausgegeben.
