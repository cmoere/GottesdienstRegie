# Ansagen vorbereiten – v83

## Deutsch

Öffne Einstellungen → Präsentation → Ansagen. Wähle ein Intervall zwischen 1 und 120 Minuten und einen verbleibenden Musikpegel zwischen 0 und 100 Prozent. Klicke auf „Ansageneinstellungen speichern“. Die Werte gelten für diesen Regie-PC und bleiben beim Schließen der Einstellungen erhalten. 20 Prozent bedeutet ein Fünftel des ansonsten gültigen Pegels, nicht eine Reduzierung um 20 Prozent.

Unter „Freigegebene Saaltexte“ stehen öffentliche, aktuell gültige Meldungen, deren Durchsage und Saalziel in der bestehenden Gemeindeverwaltung freigegeben sind. Es werden die dort gespeicherten Durchsagetexte verwendet, keine internen Kommentare. Änderungen kommen aus der zentralen Datenanbindung. „Texte aktualisieren“ bewertet den vorhandenen Datenstand einschließlich Ablaufzeiten erneut; es legt keine zweite Verbindung an und schreibt nichts nach Firebase. Nicht geladene Daten sind keine Bestätigung, dass keine Meldungen existieren.

Die Aktivierung ist in v83 gesperrt. Automatische Sprachansagen, Gong, Stimmwahl, Probeanhören, Sprachpaketinstallation und zeitgesteuerte Wiedergabe sind noch nicht verfügbar. Das Öffnen der Seite startet weder Audio noch einen Modelldownload. Es gibt keine automatische Ersatzstimme. Diese vorbereiteten Werte lösen auch im Testbetrieb und bei ON AIR keine Durchsage aus.

Die Hintergrund-Audioerweiterung verwendet getrennte Absenkungsansprüche. Eine stärkere Videoabsenkung bleibt erhalten; Benutzer-Mute und aktueller Pegel werden nicht aufgehoben. Die neue Schnittstelle wird noch nicht von einem automatischen Ansagenablauf aufgerufen. Ein Test über eine reale Saalanlage und die Freigabe einer lokalen Sprachengine stehen aus.

## English

Open Settings → Presentation → Announcements (the new screen is currently German). Prepare an interval of 1–120 minutes and a remaining music level of 0–100 percent, then explicitly save. Settings belong to the control PC. A value of 20 percent means one fifth of the otherwise effective music level, not a 20-percent reduction.

Eligible hall texts come from existing public, current community announcements with the speech channel and hall target enabled. Internal comments are excluded. Central data changes update the list; Refresh texts rechecks the existing snapshot and expiry without starting another Firebase connection or writing records. Unloaded data does not prove that there are no announcements.

Speech activation remains blocked in v83. Automatic speech, gong playback, voice selection, auditioning, package installation and scheduling are unavailable. Opening the page starts neither audio nor model downloads, and there is no silent fallback voice. Prepared settings do not trigger announcements in test mode or ON AIR.

The new background-audio API keeps independent attenuation claims and preserves stronger video attenuation, current user volume and mute. No automatic announcement runtime calls it yet. A verified local voice and physical hall-audio testing remain pending. Other help-language translations are unchanged; this new guide is German/English only.
