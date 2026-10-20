# v84: vollständige deutsche Regionalvarianten der Bedienoberfläche

Stand: 20.10.2026. Bestätigter Entwurf mit nachträglich bestätigter erster Freigabe von15Varianten; Implementierung läuft.

## Bestätigte erste Freigabe am20.10.2026

Der Benutzer begrenzt die erste Veröffentlichung ausdrücklich auf die bisherigen
13vollständigen Dokumentationsvarianten plus Rheinhessisch und Südhessisch.
Diese15Varianten werden erst nach vollständiger UI-, Dialog-, Hilfe- und
Versionsübersetzung veröffentlicht. Die übrigen16Varianten bleiben ausgeblendet.
Der langfristige31er-Katalog und seine stabilen IDs bleiben erhalten, zählen aber
nicht als verfügbare oder geprüfte Release-Sprachen. Ungültige oder zurückgestellte
gespeicherte Regionalauswahlen fallen auf Hochdeutsch zurück, ohne Audio-, Anzeige-
oder andere gespeicherte Einstellungen zu ersetzen. Die17bestehenden Basissprachen
bleiben unverändert verfügbar. Fehlende UI-Texte oder unvollständige Dokumentation
innerhalb der15Releasevarianten blockieren die Veröffentlichung weiterhin.

Release-IDs in Katalogreihenfolge: bavarian-upper, bavarian-lower,
upper-palatinate, east-franconian, swabian, baden-alemannic,
south-baden-alemannic, palatine, rhine-hessian, south-hessian, cologne, ruhr,
hamburg, berlin, bielefeld-ravensberg.

Die folgenden31er-Angaben beschreiben den langfristigen Gesamtkatalog; für diese
erste Freigabe gilt die vorstehende bestätigte15er-Teilmenge.

## Ziel und bestätigter Umfang

Der Benutzer möchte 31 auswählbare deutsche Regionalvarianten zusätzlich zum
Hochdeutsch-Standard. Nicht nur Menüs, sondern sämtliche von der Anwendung
bereitgestellten Bedien- und Informationstexte werden angepasst: Anmeldung,
Einstellungen, Dialoge, Tooltips, Validierung, Preflight, Updatezustände,
Versionshinweise einschließlich älterer Versionen, Hilfetexte und Systemmeldungen.
Die Auswahl wird auf diesem Gerät gespeichert und sofort angewendet.

Die Sprachvarianten betreffen nicht Durchsagen. Benutzerinhalte, Bibeltexte,
Songs, Firebase-Meldungen, Veranstaltungstitel, Raumbezeichnungen und andere
Präsentationsinhalte bleiben unverändert. Auch URLs, IDs, Versionsnummern,
Tastenkürzel, Produktnamen und technische Protokollbezeichner bleiben stabil.
Das systemseitige Output-Wasserzeichen TESTBETRIEB bleibt zur eindeutigen
Kennzeichnung unverändert. Es ist kein regionalisierter Präsentationstext.

## Architekturentscheidung und Alternativen

Empfohlen: kuratierte lokale Ressourcen je Variante, auf bestehenden
Übersetzungsschlüsseln und stabilen Artikel-/Versions-IDs aufgebaut.
Ein gemeinsamer Resolver führt Basissprache und Regionalvariante zusammen.
Die bestehende Language-Auswahl für andere Sprachen bleibt kompatibel.

Nicht empfohlen: globale Wortersetzungen; sie beschädigen Grammatik,
Mehrdeutigkeiten, Platzhalter und eingebettete Inhalte. Ebenfalls nicht empfohlen:
Online-Übersetzung zur Laufzeit; sie schafft Netzwerkabhängigkeit, zusätzliche
Latenz und nicht reproduzierbare Formulierungen.

## Auswahl und Ressourcen

Unter Einstellungen → Allgemein → Sprache erscheint bei Deutsch eine separate
Auswahl Deutsche Regionalvariante. Standard ist Hochdeutsch. Andere Basissprachen
werden nicht durch eine gespeicherte deutsche Regionalvariante beeinflusst.
Die Regionalvariante verwendet eine interne stabile ID, keinen erfundenen
standardisierten Sprachcode. Datums-/Zahlenformat bleibt de-DE.

Die vereinbarte Liste umfasst regionale Umgangssprachen und Ortsvarianten;
sie behauptet weder sprachwissenschaftliche Gleichrangigkeit noch die vollständige
Erfassung aller deutschen Dialekte:

1. Bayerisch – Oberbayern
2. Niederbayerisch
3. Oberpfälzisch
4. Ostfränkisch
5. Schwäbisch
6. Badisch – alemannisch geprägt
7. Südbadisch – hochalemannisch geprägt
8. Pfälzisch
9. Rheinhessisch
10. Südhessisch
11. Mittelhessisch
12. Nordhessisch
13. Moselfränkisch – Trierer Raum
14. Saarländisch – Saarbrücker Raum
15. Kölsch
16. Öcher Platt – Aachen
17. Niederrheinisch
18. Ruhrdeutsch
19. Siegerländer Platt
20. Wittgensteiner Platt
21. Münsterländer Platt
22. Sauerländer Platt
23. Lippisches Platt
24. Ostfriesisches Platt
25. Hamburger Platt
26. Schleswig-Holsteiner Platt
27. Mecklenburgisches Platt
28. Berlinerisch
29. Thüringisch
30. Obersächsisch
31. Bielefelder Variante – Ravensberger Platt

Bielefeld wird als örtliche Variante gekennzeichnet. Grundlage zur Einordnung:
https://www.lwl.org/komuna/pdf/Niederdeutsches_Wort_03_1963.pdf
Die sprachliche Qualität der neu verfassten Ressourcen wird nicht als von
Muttersprachlern geprüft ausgegeben, solange eine solche Prüfung nicht vorliegt.

## Integration in vorhandene Textquellen

- src/i18n.ts: gemeinsamer Resolver und typsichere Bedienoberflächentexte.
- src/preferences.ts: persistierte Regionalpräferenz, sichere Migration und
  unveränderter Standard bei fehlenden/ungültigen gespeicherten IDs.
- src/App.tsx und weitere Komponenten: bisher fest eingebaute sichtbare Texte
  inventarisieren und in Ressourcen überführen; Sprachwahl integrieren.
- src/help/index.ts: stabile Artikel-IDs, gesamte Titel und Inhalte lokalisieren;
  bestehende Hilfeverknüpfungen, Formatierung und Bildreferenzen erhalten.
- public/releases.json und Versionshinweis-Ansichten: regionale Texte nach
  stabiler Version und Abschnitt referenzieren; historische Fakten unverändert.
- Native Dialoge und Update-Meldungen: dieselbe Auswahl und denselben Katalog
  verwenden, nur normalisierte sichere Textparameter über vorhandene IPC-Grenzen.
- Betriebssystemeigene Datei-/Geräte-Dialogtexte und fremde Websites sind nicht
  app-eigene Texte und können nicht durch diese Funktion übersetzt werden.

Ressourcen für umfangreiche Hilfe und Release-Historie werden bedarfsweise geladen,
statt alle 31 Pakete in den initialen Editor-Bundle aufzunehmen. Ein Sprachwechsel
darf weder Präsentationsdaten neu laden noch Audio/MAIN neu starten. Ausstehende
Ladevorgänge einer alten Auswahl dürfen die neue Auswahl nicht überschreiben.

## Vollständigkeit und Sicherheit

Alle app-eigenen Texte werden inventarisiert. Vollständigkeitsprüfungen erfassen
Schlüssel, Artikel, Versionsabschnitte, Platzhalter und erlaubte Formatierung.
Ein identischer Fachbegriff kann sprachlich korrekt sein; Abdeckung ist deshalb
nicht mit bloßer Textverschiedenheit gleichzusetzen. Leere Ressourcen oder wenige
ersetzte Menütitel dürfen nicht als vollständige Sprachpakete deklariert werden.

Hochdeutsch dient ausschließlich als defensiver Laufzeit-Fallback bei beschädigten
oder künftig ergänzten Ressourcen. Fehlende Ressourcen im vereinbarten Umfang
bleiben ein Release-Hindernis, nicht ein stillschweigend reduzierter Lieferumfang.
Es wird kein Netzwerkdienst zur automatischen Umformulierung aufgerufen.
Technische Fehler werden in verständliche regionale Operator-Meldungen übersetzt;
rohe Fehlercodes und Nutzdaten werden weder verfälscht noch auf MAIN ausgegeben.

## Abnahme

- Genau 31 Regionalvarianten und Hochdeutsch sind eindeutig auswählbar.
- Auswahl bleibt nach Neustart bestehen; ungültige Werte fallen sicher zurück.
- Anmeldung, Menüs, Hilfen, Fehler und Updates verwenden dieselbe Auswahl.
- Auch historische In-App-Versionshinweise haben vollständige Ressourcen.
- Platzhalter, Zahlen, Links und Formatierung bleiben funktionsfähig.
- Andere Sprachen, Benutzerinhalte und öffentliche Präsentationsdaten bleiben gleich.
- Keine zusätzliche Verzögerung durch Übersetzungsarbeit im Live-Renderpfad.
- Sprachwechsel bei laufendem Radio/MAIN verändert weder Routing noch Liveposition.
- Layoutprüfung prüft lange Bezeichnungen, Dialoge und kleine Fenster.
- Tests, Produktionsbuild und native Smoke-Tests müssen vor Fertigmeldung bestehen.

## Abgrenzung zum bisherigen v83-Stand

Die angekündigte klassische, nicht-neuronale Durchsagestimme ist ein separates
Vorhaben. Dieser Entwurf aktiviert keine Sprachsynthese und übernimmt weder
Windows-Stimmen noch den verworfenen neuronalen Probeaufbau. Eine Veröffentlichung
von v84 wird erst nach Implementierung und belegter Prüfung als erfolgt gemeldet.
