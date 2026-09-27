# V60 – Lokaler KI-Helfer

## Ziel

GottesdienstRegie erhält einen kostenlosen KI-Helfer, der vollständig lokal und ohne API-Schlüssel arbeitet. Er beantwortet Fragen, erstellt und überarbeitet Präsentationsinhalte, plant Abläufe, bereitet Übersetzungen vor, schlägt vorhandene Medien vor und prüft Präsentationen auf erkennbare Probleme. Präsentationsdaten und Eingaben verlassen den Rechner nicht.

## Leitlinien

- Der Helfer funktioniert nach dem ersten Modelldownload offline.
- Die Anwendung wählt das geeignete Modell automatisch; technische Modellnamen stehen nicht im normalen Arbeitsablauf.
- Der sichere Standard ist eine Änderungsvorschau mit Bestätigung.
- Nutzer können in den Einstellungen direkte Ausführung aktivieren.
- Jede KI-Änderung ist ein einzelner, vollständig rückgängig machbarer Vorgang.
- Der Helfer darf weder ON AIR schalten noch Präsentationen veröffentlichen, Konten ändern, Dateien löschen oder Nachrichten versenden.
- Bibelverse werden niemals vom Sprachmodell erfunden, sondern ausschließlich über die vorhandene Bibelquelle geladen.

## Benutzeroberfläche

### Seitenleiste

Eine einklappbare rechte Seitenleiste steht im Editor und in der Weboberfläche zur Verfügung. Sie enthält:

- Chatverlauf;
- mehrzeiliges Eingabefeld;
- Senden- und Abbrechen-Schaltfläche;
- Statusanzeige für Vorbereitung und Generierung;
- Schnellaktionen für häufige Aufgaben;
- Aktionskarten für vorgeschlagene Änderungen;
- Wiederholen-Schaltfläche bei Fehlern.

Die Seitenleiste darf die Arbeitsfläche nicht dauerhaft unbenutzbar verkleinern. In schmalen Ansichten erscheint sie als modales Panel über der Oberfläche.

### Schnellaktionen

V60 bietet mindestens diese Einstiege:

- vollständigen Gottesdienstablauf entwerfen;
- ausgewählte Folie kürzen oder verständlicher formulieren;
- mehrere Ankündigungsfolien erstellen;
- passende Bibelstellen und vorhandene Lieder vorschlagen;
- Ablauf, Lesbarkeit und Zeitplanung prüfen;
- ausgewählte Inhalte übersetzen;
- passende vorhandene Medien suchen;
- Überschriften, Moderationstexte und Gebete formulieren;
- vorhandene Folien sprachlich vereinheitlichen.

Freie Eingaben dürfen dieselben Fähigkeiten kombinieren.

## Lokale Modelllaufzeit

### Automatische Auswahl

Beim ersten KI-Auftrag ermittelt ein Modellmanager:

- verfügbaren Arbeitsspeicher;
- logische Prozessorkerne;
- verfügbare Browser- oder Desktop-Hardwarebeschleunigung;
- freien lokalen Speicherplatz;
- Zielplattform Desktop oder Web.

Aus diesen Signalen wird intern eines der Profile `eco`, `balanced` oder `quality` gewählt. `balanced` ist der bevorzugte Modus, sofern die Geräteprüfung nichts anderes empfiehlt. Die Auswahl wird lokal gespeichert und kann später neu ermittelt werden.

### Einstellungen

Unter Einstellungen → KI-Funktionen stehen folgende Optionen bereit:

- Modellwahl: Automatisch, Ressourcenschonend, Ausgewogen, Höhere Qualität;
- Änderungsmodus: Vorher bestätigen oder Direkt anwenden;
- Medienvorschläge zulassen;
- Übersetzungen vorbereiten;
- Präsentationsinhalte als Kontext verwenden;
- Chatverlauf beim Schließen löschen;
- installierte Modellversion und Speicherbedarf anzeigen;
- Modell aktualisieren;
- lokales Modell entfernen;
- lokalen KI-Verlauf löschen.

Die automatische Auswahl bleibt Standard. Eine manuelle Auswahl wird vor dem Download auf Speicher- und Arbeitsspeicheranforderungen geprüft.

### Download und Offlinebetrieb

Ein fehlendes Modell wird beim ersten KI-Auftrag automatisch vorbereitet. Die Oberfläche zeigt einen kompakten Status mit Phase, Prozentangabe, geladener und gesamter Größe sowie Abbrechen. Teilweise Downloads werden sicher fortgesetzt oder verworfen. Nach erfolgreicher Installation benötigen normale Aufgaben keine Netzwerkverbindung.

Kann das gewählte Profil nicht geladen werden, empfiehlt die Anwendung ein kleineres Profil. Präsentationen und Chatentwürfe bleiben dabei erhalten. Modellpakete besitzen Versions- und Integritätsinformationen; beschädigte Pakete werden nicht gestartet.

## Systemarchitektur

### `AiModelManager`

Verantwortlich für Geräteprofil, automatische Profilwahl, Download, Integritätsprüfung, Installation, Aktualisierung, Entfernung und Laufzeitstatus. Er kennt keine Präsentationslogik.

### `AiInferenceService`

Ein einheitliches Interface für lokale Textgenerierung. Desktop und Web stellen plattformspezifische Adapter bereit. Die Eingabe besteht aus Systemregeln, bereinigtem Kontext und Nutzerauftrag. Die Ausgabe ist entweder Text oder ein strukturierter Aktionsentwurf.

### `AiContextBuilder`

Erzeugt den kleinstmöglichen Kontext für den Auftrag. Standardmäßig zulässig sind:

- Präsentationstitel und Ablaufstruktur;
- ausgewählte Elemente und Folien;
- sichtbare Folientexte;
- Zeitangaben;
- verfügbare Medienmetadaten;
- Sprach- und Präsentationseinstellungen, soweit für den Auftrag erforderlich.

Ausgeschlossen sind Passwörter, Tokens, API-Schlüssel, Authentifizierungsdaten, persönliche Notizen und nicht benötigte lokale Dateipfade. Wird „Präsentationsinhalte als Kontext verwenden“ deaktiviert, erhält das Modell nur die explizit eingegebene Nachricht und bewusst ausgewählte Inhalte.

### `AiActionPlanner`

Wandelt ausschließlich gültige strukturierte Modellantworten in einen geprüften Aktionsplan um. Unterstützte V60-Aktionen:

- Texte erstellen oder ersetzen;
- Folien und normale Ablaufpunkte erstellen;
- Reihenfolge und Zeitplanung vorschlagen oder ändern;
- ausgewählte Inhalte überarbeiten;
- Übersetzungsaufträge vorbereiten;
- vorhandene Medien anhand ihrer Metadaten vorschlagen;
- Bibelstellen als Referenzen vorschlagen und anschließend über die bestehende Bibelquelle laden;
- Prüfberichte ohne Änderung erzeugen.

Unbekannte Aktionen, ungültige IDs, nicht unterstützte Elementtypen und unzulässige Seiteneffekte werden verworfen. Das Modell erhält keine direkte Store-, Dateisystem-, Netzwerk- oder Ausgabeschnittstelle.

### `AiActionExecutor`

Prüft den Plan erneut gegen den aktuellen Präsentationszustand und wendet ihn atomar an. Alle Änderungen eines Auftrags bilden einen gemeinsamen Verlaufseintrag. Schlägt eine Teilaktion fehl, wird keine Teilmenge übernommen.

## Antwort- und Aktionsfluss

1. Nutzer sendet einen Auftrag oder wählt eine Schnellaktion.
2. Der Modellmanager stellt ein geeignetes lokales Modell bereit.
3. Der Kontext-Builder sammelt und bereinigt nur benötigte Daten.
4. Der Inferenzdienst erzeugt Antworttext und gegebenenfalls einen strukturierten Aktionsentwurf.
5. Der Aktionsplaner validiert und normalisiert den Entwurf.
6. Im Bestätigungsmodus erscheint eine Vorschau mit Erstellen-, Ändern-, Verschieben- und Übersetzen-Gruppen.
7. Nach Bestätigung wird der Plan atomar ausgeführt. Im Direktmodus geschieht dies sofort.
8. Eine Statusmeldung bietet fünf Sekunden lang „Rückgängig“ an; zusätzlich bleibt die normale Rückgängig-Funktion verfügbar.

Eine neue Präsentationsrevision zwischen Entwurf und Bestätigung macht die Vorschau ungültig. Der Helfer fordert dann eine Neuberechnung an, statt Änderungen auf einen veralteten Zustand anzuwenden.

## Verhalten bei Rückfragen

Bei fehlendem Ziel, widersprüchlichen Anforderungen oder riskanter Mehrdeutigkeit stellt der Helfer eine kurze Rückfrage. Er trifft keine stillen Annahmen, wenn dadurch bestehende Inhalte umfangreich ersetzt, verschoben oder übersetzt würden. Reine Textvorschläge dürfen mit klar benannten Annahmen erzeugt werden.

## Datenschutz und Sicherheit

- Keine Cloud-KI und keine API-Schlüssel.
- Keine Telemetrie mit Chat- oder Präsentationsinhalten.
- Chatverlauf wird lokal gespeichert und kann automatisch oder manuell gelöscht werden.
- Modellantworten gelten als nicht vertrauenswürdig und werden strikt geparst.
- Das Aktionsschema erlaubt nur bekannte Felder und begrenzt Textlängen, Elementanzahl und Gesamtaktionen pro Auftrag.
- Links, HTML, Skripte und ausführbare Inhalte aus Modellantworten werden nicht ausgeführt.
- Persönliche Notizen werden grundsätzlich nicht als Kontext verwendet.
- ON AIR, Veröffentlichungen, Konten, Berechtigungen, Dateilöschungen und externe Kommunikation sind für den Helfer gesperrt.

## Fehlerbehandlung

Die Oberfläche unterscheidet verständlich zwischen:

- Modell wird vorbereitet;
- Download pausiert oder fehlgeschlagen;
- nicht genügend Speicher;
- Modell konnte nicht gestartet werden;
- Auftrag wurde abgebrochen;
- Antwort konnte nicht sicher interpretiert werden;
- Präsentation wurde während der Vorschau geändert;
- Aktion ist für den KI-Helfer nicht erlaubt.

Jeder wiederholbare Fehler bietet „Erneut versuchen“. Abbrechen beendet Generierung oder Download kontrolliert. Bei unbrauchbaren strukturierten Antworten wird niemals ein teilweise interpretierter Plan ausgeführt.

## Leistung und Grenzen

- Generierung läuft außerhalb des UI-Threads.
- Es ist immer nur ein schreibender KI-Auftrag gleichzeitig aktiv.
- Reine Fragen dürfen nach Abbruch eines vorherigen Auftrags neu gestartet werden.
- Kontext und Antwortlänge besitzen feste Grenzen, damit schwächere Geräte bedienbar bleiben.
- Große Präsentationen werden zusammengefasst; die aktuelle Auswahl erhält Vorrang.
- Das Qualitätsprofil darf langsamer sein, die Oberfläche bleibt jedoch reaktionsfähig.

Die Bezeichnung „KI-Helfer“ wird beibehalten. Die Oberfläche behauptet nicht, dass Vorschläge fehlerfrei oder fachlich verbindlich sind.

## Desktop- und Webunterstützung

Desktop ist die vollständige Referenzimplementierung. Die Webversion verwendet dieselbe Seitenleiste und dieselben Aktionsschemata. Lokale Inferenz wird dort nur aktiviert, wenn Browser, Arbeitsspeicher, Speicherverwaltung und notwendige Laufzeitfunktionen unterstützt werden. Andernfalls zeigt sie eine konkrete Kompatibilitätsmeldung und verweist auf die Desktopversion; es gibt keinen Cloud-Fallback.

## Tests und Abnahmekriterien

### Automatisierte Tests

- Geräteprofile wählen deterministisch `eco`, `balanced` oder `quality`.
- Manuelle Profile überschreiben die automatische Auswahl.
- Downloadfortschritt, Abbruch, Wiederaufnahme, Integritätsfehler und Entfernung funktionieren.
- Datenschutzfilter entfernen Geheimnisse, persönliche Notizen und nicht benötigte Pfade.
- Aktionsparser akzeptiert nur das freigegebene Schema.
- Verbotene Aktionen werden abgelehnt.
- Bestätigungsmodus verändert vor Zustimmung nichts.
- Direktmodus wendet einen gültigen Plan atomar an.
- Ein kompletter KI-Auftrag lässt sich mit einem Rückgängig-Schritt entfernen.
- Veraltete Vorschauen werden nicht angewendet.
- Bibelstellen werden über den vorhandenen Provider geladen und nicht als Modelltext übernommen.
- Modellfehler und Abbruch hinterlassen keine Teiländerungen.
- Web-Kompatibilitätsprüfung verhindert nicht unterstützte lokale Inferenz.

### Abnahme

V60 gilt als fertig, wenn ein neu installierter unterstützter Desktop ohne API-Schlüssel automatisch ein geeignetes lokales Modell vorbereitet, anschließend offline Fragen beantwortet und einen bestätigten mehrteiligen Präsentationsauftrag atomar erstellen und wieder rückgängig machen kann. Außerdem müssen Direktmodus, Datenschutzfilter, Fehlerzustände sowie Desktop- und Web-Build geprüft sein.

## Nicht Bestandteil von V60

- Cloud-KI oder kostenpflichtige Provider;
- Sprachsteuerung oder Sprachsynthese;
- autonome Änderungen ohne Nutzerauftrag;
- eigenständiges ON AIR-Schalten;
- automatisches Veröffentlichen oder Versenden;
- Training des Modells mit Nutzerdaten;
- Plugins von Drittanbietern, die eigene KI-Werkzeuge registrieren.
