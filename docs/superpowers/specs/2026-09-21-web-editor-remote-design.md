# GottesdienstRegie Web-Editor und Fernsteuerung – Design

## Ziel

GottesdienstRegie erhält eine responsive Webversion für PC, Tablet und Smartphone. Die erste Webversion dient als Editor und als optionale Fernsteuerung einer verbundenen Desktop-App. Sie erzeugt noch keine eigenständige MAIN-, STAGE- oder Livestream-Ausgabe. Die Desktop-App bleibt für lokale Bildschirme, Mediengeräte, Audio, Videoeingänge, Offline-Ausgabe und lokale Übersetzungsmodelle verantwortlich.

Erfolg bedeutet:

- Präsentationen lassen sich im Browser zuverlässig erstellen und bearbeiten.
- Die Oberfläche ist auf PC, Tablet und Smartphone jeweils sinnvoll bedienbar.
- Eine ausdrücklich gekoppelte Websitzung kann den echten Zustand einer Desktop-App anzeigen und freigegebene Befehle senden.
- Verbindungsabbrüche oder Konflikte führen weder zu stillen Datenverlusten noch zu falschen Erfolgsanzeigen.
- Die bestehende Desktop-Anwendung bleibt während der Umstellung voll funktionsfähig.

## Abgrenzung der ersten Version

Enthalten sind Anmeldung, Präsentationsliste, Ablauf, Song-Editor, Folieneditor, Vorschau, Cloud-Speicherung, PWA-Offlinecache und gekoppelte Fernsteuerung. Nicht enthalten sind eigenständige Browserausgaben für MAIN oder STAGE, direkter Zugriff auf lokale Desktop-Dateien und Geräte, kollaborative Zeichen-für-Zeichen-Bearbeitung sowie unbeaufsichtigte Fernsteuerung ohne Desktop-Freigabe.

Persönliche Notizen werden nicht automatisch zwischen Geräten synchronisiert. Eine spätere Synchronisierung benötigt eine eigene ausdrückliche Einstellung. Der bereits vereinbarte Status-Fix für Notizen – Schloss im Ruhezustand, animierter Speicherstatus, Haken bei Erfolg und Fehlerzeichen bei Fehlschlag – wird getrennt als Desktop-Patch v45.1 umgesetzt.

## Architektur

Die Anwendung wird in einen gemeinsamen React-Anwendungskern und austauschbare Plattformdienste getrennt.

Der gemeinsame Kern besitzt Präsentations-, Song- und Foliendaten, Editor, Vorschau, Ablauf, Notizen, Rollenprüfung sowie Undo/Redo. Er darf keine direkte Abhängigkeit von Electron oder `window.desktop` besitzen.

Desktop-Dienste implementieren lokales Dateisystem, Medienimport, MAIN/STAGE/Livestream, Audio, Videoeingänge, lokale Übersetzungsmodelle, Updates und Betriebssystemintegration. Web-Dienste implementieren Cloud-Speicherung, Browser-Dateiauswahl, PWA-Cache, Onlinezustand und die Verbindung zu einer Desktop-App.

Komponenten greifen auf eine einheitliche Plattform-Schnittstelle zu. Jede Fähigkeit meldet ihren Zustand als verfügbar, nicht verfügbar oder vorübergehend getrennt. Im Web nicht verfügbare Funktionen werden sichtbar erklärt und nicht als wirkungslose Bedienelemente dargestellt.

## Responsive Produktoberflächen

Der PC-Browser zeigt den vollständigen Präsentations- und Song-Editor. Das Tablet priorisiert Editor, Folienübersicht, Vorschau und Fernsteuerung. Das Smartphone startet in einer kompakten Fernsteuerung mit Current/Next, Ablauf, Schnellanzeigen, Präsentationsnotizen sowie Verbindungs- und Synchronisierungsstatus. Über getrennte, für Touch optimierte Ansichten bleiben außerdem Ablauf-, Song- und grundlegende Folienbearbeitung erreichbar; komplexe Canvas- und Designarbeiten werden auf dem Smartphone nicht erzwungen und als eingeschränkt gekennzeichnet.

Alle drei Ansichten verwenden dieselben Datenmodelle und Befehle. Unterschiede bestehen nur in Navigation, Dichte und sichtbaren Werkzeugen. Die Smartphone-Ansicht versucht nicht, den Desktop-Editor verkleinert nachzubauen.

## Speicherung und Synchronisierung

Präsentationen werden automatisch in der vorhandenen Cloud-Infrastruktur gespeichert. Eine PWA-Warteschlange hält Offlineänderungen mit Zeitstempel, Gerätekennung und Basisrevision fest. Nach Wiederherstellung der Verbindung werden Änderungen gegen die aktuelle Cloudrevision geprüft.

Die erste Version verwendet eine Bearbeitungssperre pro Präsentation. Ein zweites Gerät öffnet zunächst lesend und kann die Bearbeitung bewusst übernehmen. Der aktive Editor erneuert seine Sperre alle 30 Sekunden; ohne Erneuerung läuft sie nach 120 Sekunden ab. Eine bewusste Übernahme warnt den bisherigen Editor und erzeugt vor dem Wechsel einen Wiederherstellungspunkt. Bei widersprüchlichen Revisionen wird kein Stand still überschrieben. Beide Fassungen bleiben in der Wiederherstellungshistorie erhalten und der Benutzer wählt, welche Fassung fortgeführt wird.

Medien werden über stabile Cloudkennungen referenziert. Ist ein Medium im Browser oder am Ausgabe-PC nicht vorhanden, zeigt die Anwendung dies am Element und im Preflight an.

## Kopplung und Fernsteuerung

Die Desktop-App aktiviert Fernsteuerung ausdrücklich und erzeugt einen kurzlebigen Kopplungscode sowie einen QR-Code. Nach Anmeldung und Codeeingabe zeigt der Desktop Gerät, Benutzer und angeforderte Rechte. Erst die Bestätigung erzeugt eine Sitzung.

Rechte sind mindestens in Lesen, Ablauf steuern, Schnellanzeigen, Stage-Nachrichten sowie ON AIR starten oder beenden getrennt. Kritische ON-AIR-Rechte sind standardmäßig nicht erteilt. Sitzungen besitzen Ablaufzeit, Widerrufsmöglichkeit und eine sichtbare Geräteliste.

Jeder Fernsteuerungsbefehl enthält Sitzungs-ID, monotone Befehlsnummer, erwartete Präsentationsrevision und Ziel. Der Desktop prüft Berechtigung und Zustand, führt den Befehl höchstens einmal aus und sendet anschließend den tatsächlichen Zustand zurück. Die Weboberfläche unterscheidet „Wird gesendet“, „Bestätigt“ und „Fehlgeschlagen“. Nach einer Unterbrechung wird zuerst der Desktopzustand neu geladen; alte Befehle werden nicht ungeprüft wiederholt.

Der erste Fernsteuerungsumfang umfasst nächste und vorherige Folie, gezielte Folienauswahl, Current/Next, Logo, Schwarz, Leer, Ohne Text, Countdown, Stage-Nachrichten, ON-AIR-Status und Präsentationsnotizen. Persönliche Notizen werden weder an die Fernsteuerung übertragen noch dort angezeigt.

## Fehlerverhalten und Sicherheit

Ein Web-Verbindungsabbruch beeinflusst die laufende Desktop-Ausgabe nicht. Die Weboberfläche zeigt deutlich „Nicht verbunden“ und deaktiviert zustandsverändernde Befehle. Kein Befehl gilt ohne Desktopbestätigung als erfolgreich.

Browserzugriff auf lokale Dateien, Monitore, Audioausgänge und Videoeingänge erfolgt niemals direkt, sondern nur durch explizite Browserfreigaben oder die Desktop-Vermittlung. Sitzungsdaten werden transportverschlüsselt, an Benutzer und Gerät gebunden und serverseitig autorisiert. Kopplungscodes sind kurzlebig und nur einmal verwendbar.

Offlineänderungen und Synchronisierungsfehler bleiben sichtbar. Der Benutzer kann auf einen früheren Cloudstand zurückkehren. Fehlertexte nennen betroffene Präsentation, Gerät und nächste sinnvolle Aktion, ohne vertrauliche technische Details offenzulegen.

## Umsetzungsetappen

1. **Plattform-Schnittstelle:** Direkte Electron-Aufrufe werden nach Fähigkeitsbereichen hinter Dienste verschoben. Vertragsprüfungen sichern identisches erwartbares Verhalten.
2. **Browser-Editor:** Anmeldung, Präsentationsliste, Ablauf, Songs, Folieneditor, Vorschau und Cloudspeicherung werden browserfähig und responsiv.
3. **PWA und Offline:** Installierbarkeit, Cache, lokale Warteschlange, Wiederverbindung und Konfliktoberfläche werden ergänzt.
4. **Fernsteuerung:** Kopplung, Rechte, Sitzungsverwaltung, Current/Next und bestätigte Steuerbefehle werden aktiviert.

Jede Etappe muss die vorhandene Desktop-App weiterhin bauen und ausführen lassen. Web- und Desktopveröffentlichungen verwenden getrennte Release-Kanäle.

## Qualitätssicherung

- Vertragstests laufen gegen Desktop- und Web-Dienste.
- Responsive Tests decken definierte PC-, Tablet- und Smartphone-Größen ab.
- Offline-/Online-Wechsel, konkurrierende Revisionen und Sperrübernahme werden automatisiert geprüft.
- Kopplung, Rechte, Widerruf und abgelaufene Sitzungen besitzen Sicherheitstests.
- Doppelte, verspätete und in falscher Reihenfolge eintreffende Befehle werden simuliert.
- Vor jedem Webrelease läuft die vollständige Desktop-Regression.
- Preflight erkennt fehlende Medien am tatsächlich verbundenen Ausgabe-PC.
- Ein Ende-zu-Ende-Test verbindet Browser und Desktop, wechselt eine Folie und wartet auf die bestätigte Current/Next-Aktualisierung.

## Spätere Erweiterungen

Nach stabiler erster Version sind eigenständige Browserausgaben, feinere kollaborative Bearbeitung, synchronisierte persönliche Notizen und weitere Fernsteuerungsrollen möglich. Diese Punkte gehören ausdrücklich nicht zum ersten Umsetzungsplan.
