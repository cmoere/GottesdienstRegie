# LiveQuiz-Teilnahme einrichten

Die Desktop-App und die mobile Join-Seite verwenden die bestehende Firebase Realtime Database `philippusgemeindebie`. Es werden keine Administrator- oder Secret-Schlüssel im Browser ausgeliefert.

## Einmalige Firebase-Konfiguration

1. In der Firebase Console das Projekt `philippusgemeindebie` öffnen.
2. Unter **Authentication → Sign-in method** den Anbieter **Anonymous/Anonym** aktivieren.
3. Unter **Realtime Database → Rules** die Regeln aus [`docs/livequiz-database.rules.example.json`](docs/livequiz-database.rules.example.json) mit den bestehenden Regeln zusammenführen und veröffentlichen.
4. Die autorisierte Domain `pgbielefeld.neocities.org` unter **Authentication → Settings → Authorized domains** eintragen, falls sie dort noch nicht vorhanden ist.

Die Regeln trennen Quizdefinition, öffentlichen Sitzungsstatus und Antworten. Teilnehmer dürfen nur ihre eigene Antwort zur gerade geöffneten Frage schreiben. Nur die anonyme Firebase-Identität der Desktop-Sitzung darf alle Antworten lesen und die Sitzung steuern.

## Bedienung

1. In GottesdienstRegie ein LiveQuiz auswählen.
2. **LIVEQUIZ STARTEN** anklicken.
3. Den angezeigten sechsstelligen Code oder QR-Code auf dem Bedienbildschirm verwenden.
4. Teilnehmer öffnen `https://pgbielefeld.neocities.org/quiz` oder scannen den QR-Code.
5. Gewünschte Frage im Editor auswählen und **AKTUELLE FRAGE STARTEN** anklicken.
6. Mit **ANTWORTEN SCHLIESSEN** zur Lobby zurückkehren oder mit **QUIZ BEENDEN** den Code ungültig machen.

Ein Code ist höchstens vier Stunden gültig. Richtige Antworten werden nicht an die Browser der Teilnehmer übertragen.
