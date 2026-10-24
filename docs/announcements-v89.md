# Lokale Durchsagen / Local announcements

## Deutsch

Installiere eSpeak NG separat über die [offizielle Downloadseite](https://github.com/espeak-ng/espeak-ng/releases). Es ist eine klassische Formant-Sprachsynthese, kein KI-Modell und keine Windows-Systemstimme. GottesdienstRegie liefert die Sprachengine nicht mit und ändert seine eigene Lizenz nicht. Unter Windows wird der übliche Installationsordner `C:\Program Files\eSpeak NG` empfohlen: Der geprüfte Windows-Build verarbeitet Datenpfade mit Umlauten nicht zuverlässig. Die Anwendung erzeugt Audiodaten über die Prozessleitung, damit ein Umlaut im Windows-Benutzerprofil keine temporären WAV-Dateipfade beschädigt.

Öffne **Einstellungen → Präsentation → Ansagen**. Klicke auf **eSpeak NG auswählen** und wähle `espeak-ng.exe` (auf macOS/Linux das Programm `espeak-ng`). Die Einrichtung prüft eine kurze lokale Sprachdatei, ohne sie abzuspielen. Bei einem Fehler bleibt die Aktivierung gesperrt; es gibt keine automatische Ersatzstimme. Wähle anschließend **Automatische Ansagen aktivieren**, Intervall und Musikpegel, und speichere ausdrücklich. Das Öffnen oder Schließen der Einstellungen startet keine hörbare Probe und unterbricht keinen laufenden Zeitplan. Die Auswahl einer anderen Engine deaktiviert Ansagen zunächst wieder.

Die erste automatische Durchsage beginnt nach dem gespeicherten Intervall, nur während ON AIR im Vor- oder Nachprogramm. Dies gilt ebenso für ON AIR im Testbetrieb. Die bestehende Gemeindedatenanbindung liefert ausschließlich öffentliche, gültige, für den Saal freigegebene Durchsagetexte. Es wird weder ein neues Firebase-Schema angelegt noch ein interner Kommentar gesprochen. Pro Intervall wird ein Text ausgewählt; mehrere Texte wechseln in ihrer bestehenden Prioritätsreihenfolge ab.

Die Sprachdatei wird vor der Musikabsenkung erzeugt. Danach laufen der bereitgestellte Drei-Klang-Gong und die Sprache über den unter Audioausgänge konfigurierten **Background-Audio-Ausgang**. Dieser Ausgang darf nicht stummgeschaltet sein. Es gibt keinen stillen Wechsel auf ein anderes Gerät. Ein Musikpegel von 20 % bedeutet ein Fünftel des sonst geltenden Musikpegels. Benutzer-Mute und stärkere Videoabsenkung bleiben bestehen. Radio und andere Hintergrundtitel werden für die Absenkung nicht neu gestartet.

Während tatsächlicher Gong-/Sprachwiedergabe erscheint oben links ein kleines Lautsprechersymbol in der Ausgabe und ihrer echten Vorschau. Es liegt über dem Content und wird nicht in Folien gespeichert. Nach Ende, Fehler oder Abbruch verschwindet es. OFF AIR, ein Wechsel aus Vor-/Nachprogramm, eine zurückgezogene Meldung, Änderungen an der Audioausgabe und Notfall-Schnellbilder brechen die aktuelle Ansage kontrolliert ab. Der Testbetrieb bleibt unabhängig davon gekennzeichnet.

Prüfe vor öffentlichem Einsatz die Aussprache, den Gong, die Lautstärke und die echte Saalroute durch eine bewusst gestartete Probe. Die Stimme klingt synthetisch. Die automatisierten Prüfungen bestätigen Dateierzeugung, Rendererwiedergabe, Overlay und Abbruch; die physische Anlage wurde dabei nicht beschallt.

## English

Install eSpeak NG separately from its [official downloads](https://github.com/espeak-ng/espeak-ng/releases). This uses classical formant synthesis, not an AI model or a Windows system voice. On Windows use the default installation folder without accented characters. The app receives WAV audio through the process pipe, avoiding Unicode temporary-output paths.

Open **Settings → Presentation → Announcements**, select the eSpeak NG executable and let the silent file-generation check finish. Explicitly enable announcements, choose the interval and remaining music level, and save. An unavailable engine remains disabled without a fallback voice. Selecting another engine disables announcements until saved again. No audible preview is started merely by opening settings.

Approved public hall texts run one at a time after the configured interval, only ON AIR in pre/post programs, including test-mode ON AIR. The supplied gong precedes the voice. Both use the configured Background Audio device and respect its mute/volume; there is no silent device fallback. Music attenuation preserves stronger video ducking and user mute. A small top-left speaker appears only during actual playback, independent of slide content.

OFF AIR, emergency quick screens, leaving pre/post programs, revoked content and audio-route changes cancel playback and release announcement attenuation. Rehearse pronunciation and routing on the real hall system before public use. Automated renderer tests keep physical audio muted and do not certify the real equipment.
