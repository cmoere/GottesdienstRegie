# Mitgelieferte deutsche Sprachausgabe

## Gewählter Aufbau

Der Benutzer hat am 24.10.2026 ausdrücklich gewählt: Die Stimme ist vollständig im normalen Update enthalten. Keine separate Installation, kein nachträglicher Sprachdownload, kein Konto. Die bisherige Vorgabe bleibt bestehen: kostenlose klassische deutsche TTS, keine neuronale Stimme und keine Windows-Systemstimme. Dieser Entwurf ersetzt den separaten eSpeak-Installationsweg aus `2026-10-24-local-espeak-design.md`.

## Alternativen

- **Gewählt:** Sprachsystem und Laufzeit im Update mitliefern. Größerer Download, danach offline und ohne Einrichtungsassistent nutzbar.
- Nicht gewählt: Sprachpaket beim ersten Aktivieren innerhalb der Software herunterladen. Kleinere Erstinstallation, aber zusätzliche Netzabhängigkeit.
- Cloud- und Windows-Stimmen erfüllen die bestehenden Vorgaben nicht.

Technischer Vorschlag: MaryTTS mit der klassischen deutschen Unit-Selection-Stimme `dfki-pavoque-neutral` und einer mitgelieferten Java-Laufzeit. Die Stimme setzt aufgezeichnete Sprachsegmente zusammen. Sie ist keine neuronale Stimme. Die endgültigen Artefaktversionen und Größen werden nach einem echten Kompatibilitäts- und Abhängigkeitstest festgeschrieben; bisher ist noch kein Paket gebaut oder freigegeben.

## Bedienung

Unter Einstellungen → Präsentation → Ansagen entfallen Dateiauswahl und externe Downloadseite. Stattdessen steht dort „Deutsche Stimme ist enthalten“ mit dem tatsächlichen Bereitschaftsstatus. Durchsagen bleiben ausdrücklich ein- und ausschaltbar; das Update aktiviert sie niemals ungefragt. Intervall, Musikrestlautstärke und die angezeigten öffentlichen Ansagetexte bleiben erhalten. Der Benutzer muss weder Java noch MaryTTS installieren oder einen Pfad auswählen.

Alte eSpeak- und neuronale Einstellungen dürfen keine unbemerkte Aktivierung verursachen. Bei einer Umstellung wird die neue Stimme zunächst deaktiviert angeboten. Ein defektes Sprachpaket meldet die Operator-Oberfläche verständlich; es gibt keine automatische Windows-/Cloud-Ersatzstimme.

## Einbindung und Live-Verhalten

Ein zentraler nativer Sprachdienst startet ausschließlich die mitgelieferte Laufzeit und den mitgelieferten Sprach-Worker ohne Shell. Keine systemweite Installation, keine Änderung an PATH oder Java-Registrierung, kein HTTP-Server und kein offener Netzwerkport. Kommunikation über begrenzte Text-/WAV-Nachrichten auf Standard-Ein-/Ausgabe. Die Laufzeit wird erst bei Bedarf geladen, nicht beim Programmstart.

Ein Worker pro Steuerinstanz; keine Sprachprozesse in MAIN, STAGE oder weiteren Ausgabefenstern. Text, Ausgabedaten und Laufzeit werden begrenzt. Abbruch beendet eine hängende Erzeugung kontrolliert; verspätete Antworten dürfen keine Durchsage starten. Stderr bleibt technisch und gelangt niemals auf MAIN. Unicode in Windows-Benutzernamen und Installationspfaden muss funktionieren.

Die vorhandene Durchsagekette bleibt zuständig: gültigen öffentlichen Saaltext vorbereiten → Audiokontext/Route prüfen → Musik über die bestehende Ducking-Verwaltung absenken → angehängten Gong abspielen → Sprache über Background Audio abspielen → nur den eigenen Ducking-Anspruch freigeben. Das Lautsprechersymbol erscheint nur während tatsächlicher Gong-/Sprachwiedergabe. OFF AIR, Bereichswechsel, gesperrter Text, Notfallanzeige und geänderte Audioausgabe brechen weiterhin ab. Testbetrieb verändert das Routing nicht.

## Paketierung und Lizenzen

Sprachdaten, Java-Laufzeit und Worker liegen als Ressourcen außerhalb des ASAR. Plattformabhängige Laufzeiten werden im jeweiligen Build beschafft, mit festen Versionen und Prüfsummen geprüft und zusammen mit der unveränderten Stimme paketiert. Endgeräte laden nichts zusätzlich herunter. Windows x64, macOS x64/arm64 und Linux x64 werden jeweils geprüft; eine nicht geprüfte Plattform darf nicht als unterstützt veröffentlicht werden.

MaryTTS Runtime steht unter LGPLv3; die gewählte Stimme nennt CC BY-ND 3.0. Laufzeit, Sprachpaket und sämtliche transitiven Abhängigkeiten benötigen vor der Veröffentlichung einen vollständigen Lizenz-/Sicherheitseintrag. Hinweise, Lizenztexte und erforderliche Quellcode-/Austauschmöglichkeiten werden mitgeliefert. Keine Änderungen am Sprachdatenpaket und keine Beschränkung der zugehörigen Open-Source-Rechte durch die App-Nutzungsbedingungen. Nicht nachgewiesene Weitergaberechte oder nicht behobene relevante Schwachstellen blockieren die Paketfreigabe.

Primärquellen:
- https://marytts.github.io/faq.html
- https://github.com/marytts/marytts/blob/master/LICENSE.md
- https://github.com/marytts/voice-dfki-pavoque-neutral
- https://github.com/marytts/voice-dfki-pavoque-neutral/blob/master/LICENSE.md

## Abnahme vor Veröffentlichung

1. Frisches Paket ohne installiertes Java, eSpeak oder Windows-Stimmkonfiguration erzeugt offline einen echten deutschen Sprach-WAV mit Signal.
2. Normale deutsche Ansagetexte einschließlich Umlauten, Uhrzeiten und Bibel-/Gemeindebegriffen funktionieren; keine Qualitätsgarantie allein aus einem erfolgreichen API-Aufruf.
3. Gong → Sprache, Lautsprechersymbol, Musikabsenkung und Wiederherstellung funktionieren über die konfigurierte Route; technische Tests bleiben stumm, eine echte Hörprobe wird separat gekennzeichnet.
4. OFF AIR, Abbruch während Erzeugung, Prozessabsturz und fehlende Ressourcen hinterlassen weder weitere Sprache noch abgesenkte Musik.
5. ON AIR/Testbetrieb, mehrere Ausgabefenster und weiterhin laufendes Radio starten keine doppelten Sprachprozesse und ändern keine Audioausgänge.
6. Ein Upgrade bewahrt Anzeige-/Audiogeräte und aktiviert keine bisher deaktivierten Ansagen.
7. Installerprüfung bestätigt alle Sprachressourcen, Laufzeit, Prüfsummen und Lizenzhinweise. Build, relevante Regressionstests und Veröffentlichungskontrollen bestehen.

## Umfang und offene Freigabe

Dies ist eine Änderung am nativen Sprachdienst, an den Ansageneinstellungen und der plattformübergreifenden Paketierung. PowerPoint und Regionalübersetzungen sind davon unabhängig und werden nicht als fertig bezeichnet. Der Benutzer hat diesen konkreten Aufbau mit „ja umsetzten und veröffentlichen!“ freigegeben. Umsetzung bleibt nativ durch den Hauptagenten, entsprechend der bestehenden Benutzerpräferenz; ausschließlich Übersetzungstexte dürfen wie zuvor genehmigt delegiert werden.
