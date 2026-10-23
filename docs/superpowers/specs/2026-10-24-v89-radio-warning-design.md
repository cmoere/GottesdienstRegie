# v89 — eindeutige Radioauswahl und nummerierte Wetterwarnungen

## Bestätigtes Verhalten

Der Nutzer bestätigt am 24.10.2026: Ein neu gewählter Radiosender ersetzt den bisherigen Sender desselben Elements beziehungsweise Ablaufbereichs. Andere Audiodateien bleiben erhalten. „Hinzufügen“ übernimmt die Wahl und schließt das Radio-Popup; dessen separater „Fertig“-Button entfällt. PRE, POST und einzelne Elemente bleiben unabhängig.

Bei mehreren Wetterwarnungen erscheinen die aktuelle Position und Gesamtzahl, zum Beispiel `1/2`, sowie ein zur Warnungsart passendes Symbol. Originaltext, Quelle, Gültigkeit, gemeinsame Zeitbasis und bisherige Ausgabebeschränkung auf PRE/POST/Countdown bleiben erhalten.

## Ansatz

Die vorhandenen Komponenten werden erweitert. Beide Radio-Auswahlwege in BackgroundAudioPanel verwenden dieselbe reine Austauschfunktion: normale Audiodateien behalten Reihenfolge und Daten, alle bisherigen Radioeinträge werden durch genau den gewählten Sender ersetzt. Nach erfolgreicher synchroner Übernahme schließt der reine Radio-Dialog; die in den allgemeinen Audioeinstellungen eingebettete Radiosuche klappt zu. Dort bleiben die übrigen Einstellungen und ihr Abschlussbutton erhalten. Ein zweiter schneller Klick darf keine weitere Übernahme auslösen. Vorhören wird beim Schließen beendet und darf Hintergrundradio nicht beeinflussen.

Eine zusätzliche Bestätigungsseite oder reine UI-Sperre gegen einen zweiten Sender wurden verworfen: Der Nutzer hat ausdrücklich den direkten Austausch bestätigt. Die AudioEngine, Routen, Lautstärke und bestehende Playlists werden nicht neu aufgebaut.

Der Warnungsselektor liefert zusätzlich Index/Gesamtzahl für aktuell gültige Warnungen. Darstellung und Zähler nutzen denselben bereits gemeinsamen Zyklus. Lokale SVG-Symbole für Wind/Sturm, Gewitter, Regen, Schnee, Glätte/Frost, Hitze und Nebel; bei unbekannter Art ein neutrales Warndreieck. Keine neuen Netzwerkabrufe, keine Änderung des DWD-Schemas, keine erfundene DWD-Markenabbildung. Der Zähler steht nur bei mehreren gültigen Warnungen; zugängliche Beschriftung beispielsweise „Warnung 1 von 2“.

## Abnahme

- Neuer Sender ersetzt auch mehrere alte Radioeinträge; alle anderen Audiodateien bleiben unverändert.
- Hinzufügen übernimmt genau einmal und schließt die Radiosuche. Kein „Fertig“ im reinen Radiodialog; Schließen/X bleibt erhalten.
- Eine Senderänderung im PRE verändert weder POST noch andere Elemente.
- Zwei Warnungen zeigen chronologisch `1/2`, danach `2/2`; eine einzelne Warnung zeigt keinen Mehrfachzähler.
- Abgelaufene Warnungen zählen nicht mehr. Unbekannte Warnungsarten behalten ein verständliches neutrales Symbol.
- Kein Neustart von Audio, Countdown oder Meldungslaufband; MAIN und Vorschau nutzen dieselbe Warnungsposition.

## Eigenständige weitere v89-Arbeiten

Der Nutzer möchte außerdem PowerPoint und die 15 freigegebenen Regionalvarianten vervollständigen. Das ist nicht durch diese beiden UI-Änderungen erledigt. Die vorhandenen PowerPoint-Hybrid-/GPU-Pläne und belegten Leistungsgrenzen bleiben maßgeblich; keine Freischaltung ohne bestandene Bild-, Befehls-, Audio- und Fehlerfallprüfungen. Derzeitige regionale Prüfung: 6339 Inventareinträge, davon 3721 noch zu klassifizieren (nicht gleichbedeutend mit 3721 fehlenden Übersetzungen). Hilfe/Versionsdokumentation ist für die 15 Varianten vollständig; die verbleibende Bedienoberfläche benötigt echte Ressourcenanbindung und Übersetzungsarbeit, keine pauschale Freigabe.

Programmierung und technische Kontrolle nativ durch den Hauptagenten; nur Übersetzungsarbeit ist zur Delegation freigegeben. Fremde startup-diagnostic.cjs bleibt unverändert. Die installierte Anwendung und physische Ausgaben werden nicht durch diese UI-Arbeiten bedient. Kein automatischer Versionssprung oder Publish als Nebenwirkung.
