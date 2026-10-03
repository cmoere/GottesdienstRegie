# v75 Update-Diagnose

Geprüft am 04.10.2026 (Europe/Berlin):

- Installierte App im vorherigen Diagnoseschritt: 0.73.0; GitHub-Provider cmoere/GottesdienstRegie, stabile Releases, automatische Suche aktiv.
- Exakter vom GitHubProvider verwendeter Request `GET https://github.com/cmoere/GottesdienstRegie/releases/latest` mit `Accept: application/json`: `tag_name = v0.74.0`.
- `releases/latest/download/latest.yml` erreichbar, Manifest meldet `version: 0.74.0` und `GottesdienstRegie-Setup-0.74.0.exe`.
- Der Fehler der damaligen Suche ist mit diesen Read-only-Abrufen nicht reproduziert. Ein erfolgreicher HTTP-Test beweist nicht, dass der installierte Renderer seinen damaligen Status korrekt angezeigt hat.
- Kein alternativer Feed, kein erzwungenes Update und keine Änderung an Benutzerpräferenzen. Nach v75-Veröffentlichung Manifest und Asset erneut prüfen.
