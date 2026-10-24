# Lokale Durchsagen / Local announcements

## Deutsch

Ab Version 0.89.2 enthält das normale Update die deutsche MaryTTS-Stimme und ihre private Java-Laufzeit. Es muss weder eSpeak noch Java separat installiert werden. Ein Konto, eine Windows-Systemstimme und ein nachträglicher Sprachdownload sind nicht erforderlich. Die klassische Unit-Selection-Stimme setzt aufgezeichnete Sprachsegmente zusammen und arbeitet vollständig offline. Der größere Download enthält die Sprachdaten bereits.

Öffne **Einstellungen → Präsentation → Ansagen**. Der Status zeigt, ob das mitgelieferte Sprachpaket verfügbar ist. Wähle **Automatische Ansagen aktivieren**, Intervall und Musikpegel und speichere ausdrücklich. Alte externe oder neuronale Stimmeinstellungen aktivieren die neue Stimme nicht ungefragt. Ein unvollständiges Paket wird im Operatorbereich gemeldet; eine automatische Ersatzstimme gibt es nicht. Das Öffnen der Einstellungen startet keine hörbare Probe. Lizenztexte, Quellen der LGPL-Komponenten und die geänderte Kompatibilitätsklasse liegen beim Sprachpaket; die Stimme selbst wird unverändert weitergegeben.

Die erste automatische Durchsage beginnt nach dem gespeicherten Intervall, nur während ON AIR im Vor- oder Nachprogramm. Dies gilt ebenso für ON AIR im Testbetrieb. Die bestehende Gemeindedatenanbindung liefert ausschließlich öffentliche, gültige, für den Saal freigegebene Durchsagetexte. Es wird weder ein neues Firebase-Schema angelegt noch ein interner Kommentar gesprochen. Pro Intervall wird ein Text ausgewählt; mehrere Texte wechseln in ihrer bestehenden Prioritätsreihenfolge ab.

Die Sprachdatei wird vor der Musikabsenkung erzeugt. Danach laufen der bereitgestellte Drei-Klang-Gong und die Sprache über den unter Audioausgänge konfigurierten **Background-Audio-Ausgang**. Dieser Ausgang darf nicht stummgeschaltet sein. Es gibt keinen stillen Wechsel auf ein anderes Gerät. Ein Musikpegel von 20 % bedeutet ein Fünftel des sonst geltenden Musikpegels. Benutzer-Mute und stärkere Videoabsenkung bleiben bestehen. Radio und andere Hintergrundtitel werden für die Absenkung nicht neu gestartet.

Während tatsächlicher Gong-/Sprachwiedergabe erscheint oben links ein kleines Lautsprechersymbol in der Ausgabe und ihrer echten Vorschau. Es liegt über dem Content und wird nicht in Folien gespeichert. Nach Ende, Fehler oder Abbruch verschwindet es. OFF AIR, ein Wechsel aus Vor-/Nachprogramm, eine zurückgezogene Meldung, Änderungen an der Audioausgabe und Notfall-Schnellbilder brechen die aktuelle Ansage kontrolliert ab. Der Testbetrieb bleibt unabhängig davon gekennzeichnet.

Prüfe vor öffentlichem Einsatz die Aussprache, den Gong, die Lautstärke und die echte Saalroute durch eine bewusst gestartete Probe. Die Stimme klingt synthetisch. Die automatisierten Prüfungen bestätigen Dateierzeugung, Rendererwiedergabe, Overlay und Abbruch; die physische Anlage wurde dabei nicht beschallt.

## English

Starting with 0.89.2, the normal update includes the German MaryTTS voice and a private Java runtime. No separate eSpeak or Java installation, account, Windows voice or subsequent speech download is needed. Classical unit selection combines recorded speech segments entirely offline. The larger update already contains the speech data.

Open **Settings → Presentation → Announcements**, check the included voice status, explicitly enable announcements, set interval and remaining music level, and save. Old external or neural voice settings do not silently activate the new voice. A missing package produces an operator error; there is no automatic fallback voice. No audible preview starts merely by opening settings.

Approved public hall texts run one at a time after the configured interval, only ON AIR in pre/post programs, including test-mode ON AIR. The supplied gong precedes the voice. Both use the configured Background Audio device and respect its mute/volume; there is no silent device fallback. Music attenuation preserves stronger video ducking and user mute. A small top-left speaker appears only during actual playback, independent of slide content.

OFF AIR, emergency quick screens, leaving pre/post programs, revoked content and audio-route changes cancel playback and release announcement attenuation. Rehearse pronunciation and routing on the real hall system before public use. Automated renderer tests keep physical audio muted and do not certify the real equipment.
