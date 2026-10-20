# PowerPoint-Hybridimport: Originaltreue vor Bearbeitbarkeit

Status: Vom Nutzer am20.10.2026 mit „ja“ zur anschließenden Erstellung des
Umsetzungsplans freigegeben. Produktimplementierung erst nach Planprüfung;
keine Veröffentlichung freigegeben.

## Ziel und bestätigte Entscheidungen

Der Nutzer möchte den bestehenden PowerPoint-Import verbessern, insbesondere
Animationen und Zeiten. Originalgetreue Wiedergabe hat Vorrang; eine bearbeitbare
Darstellung soll zusätzlich erhalten bleiben. Die optionale Nutzung einer lokal
installierten Microsoft-PowerPoint-Anwendung wurde ausdrücklich erlaubt.

Erfolg bedeutet nicht, einen Textimport als vollständigen PowerPoint-Import zu
bezeichnen. Der Operator sieht, ob Originalwiedergabe oder bearbeitbare Kopie
ausgegeben wird, welche Voraussetzungen erfüllt sind und wo Grenzen bestehen.
Die Originaldatei wird niemals durch Änderungen an der Kopie überschrieben.

Diese Aufgabe erweitert Import, Live-Steuerung und Ausgabe zusammen. Sie wird
deshalb als Architekturänderung geplant, nicht als kleine Parserkorrektur.

## Ist-Zustand im untersuchten Checkout

- `electron/PresentationRepository.ts` extrahiert aus PPTX überwiegend Texte und
  bildet einige Folienübergänge vereinfacht ab. Objektaufbau und Originaldesign
  werden nicht vollständig importiert; individuelle Folienzeiten fehlen.
- Die Reihenfolge wird derzeit aus Folien-Dateinamen abgeleitet. Künftig gilt
  die tatsächliche Präsentationsreihenfolge aus den PPTX-Beziehungen.
- `OutputWindowManager` verteilt revisionierte Zustände an die Ausgaben.
- `OutputComposition` hält Banner und Test-Overlay außerhalb des Folieninhalts.
- Eine PowerPoint-Steuerung und eine zugehörige Fenster-Capture-Pipeline sind
  derzeit nicht vorhanden. Deren Leistungsfähigkeit ist noch nicht erprobt.
- Auf diesem Windows-Rechner ist POWERPNT.EXE registriert. Das bestätigt weder
  Aktivierung noch erfolgreiche Automation oder Wiedergabe. PowerPoint wurde
  für diese Untersuchung nicht gestartet.

## Betrachtete Ansätze

1. Empfohlen: Hybrid mit optionaler echter PowerPoint-Wiedergabe und getrennten
   nativen Kopien. Damit bleiben die Originaleffekte beim Original-Player und
   unterstützte Inhalte im Regie-Editor bearbeitbar. Der Integrationsaufwand und
   die Plattformabhängigkeit werden ausdrücklich berücksichtigt.
2. Nur nativer PPTX-Nachbau: keine Office-Abhängigkeit, dafür müssten Layout und
   Animationen in einer zweiten Engine nachgebaut werden. Das widerspricht der
   Priorität Originaltreue und ist kein realistisches Vollkompatibilitätsversprechen.
3. Nur vorgerendertes Video: geeignet als ausdrücklich gewählter Fallback für
   feste Abläufe, aber nicht gleichwertig zu frei klickbaren Animationsschritten.
   Ein solcher Export darf interaktive Animationen nicht stillschweigend ersetzen.

## Import und getrennte Dokumentstände

Ein PowerPoint-Element enthält eine unveränderte, anwendungsverwaltete Kopie der
Quelldatei, einen Inhaltsfingerabdruck, stabile Folienreferenzen, Importdiagnosen
und die separat versionierte bearbeitbare Kopie. Absolute Quelldateipfade werden
nicht an Besucherausgaben weitergegeben. Neuimport und Kopieränderungen erzeugen
neue Revisionen; ein aktuell LIVE verwendeter Stand bleibt bis zum sicheren
Wechsel unverändert. Assets müssen mit Sicherung/Export wiederherstellbar sein.

Im Editor gibt es eine eindeutige Auswahl:

- Originalwiedergabe, bevorzugt bei verfügbarer und geprüfter PowerPoint-Anbindung.
- Bearbeitbare Kopie, deren Abweichungen und eigener Änderungsstand sichtbar sind.

Ein Moduswechsel während LIVE ist ein ausdrücklicher Take, keine Nebenwirkung
einer Bearbeitung. Es gibt keine automatische Rückübersetzung nativer Änderungen
in das PowerPoint-Original. Für Änderungen des Originals wird eine neue Datei
importiert. Nicht unterstützte native Objekte behalten eine originalgetreue
Vorschau, soweit verfügbar, und werden nicht als editierbar ausgegeben.

PPTX ist der erste Ausbauschritt. Bestehende TXT/Markdown-, ODP- und Keynote-Pfade
bleiben erhalten, erhalten aber keine ungetesteten Kompatibilitätsversprechen.
Der erste Original-Adapter ist Windows-exklusiv. macOS, Linux und der Web-Editor
behalten den unterstützten nativen Import; dort wird kein Original-Player als
verfügbar angezeigt, solange kein eigener Adapter geprüft wurde.

## Original-Player und Steuerung

Ein Windows-spezifischer Adapter kapselt eine von GottesdienstRegie verwaltete
PowerPoint-Präsentation. Ein separater Helper verarbeitet eng begrenzte,
validierte Befehle in Reihenfolge. COM-Fehler und hängende Aufrufe dürfen den
Electron-Hauptprozess nicht blockieren. Es wird kein fremdes PowerPoint-Dokument
übernommen oder geschlossen und kein pauschales Beenden aller Office-Prozesse
verwendet. Fehlt die Anwendung oder scheitert die Automation, meldet Preflight
den Originalmodus als nicht verfügbar; der Operator wählt einen Fallback selbst.

Die Sitzung unterscheidet vorbereitet, bereit, LIVE, pausiert, beendet und Fehler.
Vorbereiten startet keine hörbare oder sichtbare Publikumswiedergabe. Wiederholte
Start-/Stop-Anfragen, späte Antworten und Fensterverluste sind generationsgesichert.

NEXT bedient zuerst den nächsten regulären Animationsschritt, dann die nächste
Folie. PREV und direkte Folienwahl haben einen klaren Aufbauzustand; ein gezielter
Foliensprung ist von einem einzelnen Animationsschritt getrennt. Automatische
Animationen und Folienzeiten werden im Originalmodus von PowerPoint geführt.
GottesdienstRegie startet dafür keinen konkurrierenden Folientimer. Nach der
letzten vorgesehenen Folie übernimmt wieder die bestehende Regie-Navigation;
kein unerwarteter Sprung zur ersten Folie und kein hängen gebliebenes Fremdfenster.

Normale Klickfolgen sind die erste unterstützte Interaktion. Objektabhängige
Trigger, Makros, Add-ins und externe Interaktionen werden erkannt bzw. als nicht
abgedeckt ausgewiesen. Vollständige PowerPoint-Kompatibilität wird nicht behauptet.

## Ausgabe, Vorschau und Sicherheit der Capture-Pipeline

PowerPoint darf nicht als eigenes Publikums-Vollbild MAIN ersetzen. Der geplante
Weg ist die Erfassung ausschließlich des eigenen, identifizierten Show-Fensters
und dessen Einbettung als Content in die vorhandene Output-Komposition. Die
Zuordnung muss anhand der eigenen Sitzung und Fensteridentität überprüft werden,
nicht lediglich anhand eines Fenstertitels. Kein Capture des ganzen Desktops,
keine Auswahl fremder Fenster und keine pauschale Capture-Berechtigung für Inhalte.

Die Aufnahme eines unauffällig positionierten Show-Fensters ohne Rahmen,
Operator-Oberfläche oder schwarze Frames muss zunächst praktisch nachgewiesen
werden. Ein minimiertes oder verdecktes Fenster darf nicht ungeprüft als zuverlässige
Quelle gelten. Falls die Plattform diese Voraussetzung nicht erfüllt, bleibt der
Originalmodus dort gesperrt. Ein sichtbares Office-Fenster darf MAIN nicht überdecken.

Es gibt eine maßgebliche Player-Sitzung und eine zugehörige Bildquelle, nicht
unabhängig laufende PowerPoint-Shows für Vorschau und MAIN. Die technische
Verteilung des Bildstroms muss Latenz, Auflösung und Ressourcenverbrauch nachweisen.
STAGE kann Folienreferenz und Notizen erhalten; weitere Ausgaben erhalten nur
freigegebene Bildinhalte. Banner, Test-Wasserzeichen und Schnellanzeigen bleiben
oberhalb des PowerPoint-Inhalts. Eine Aufnahme oder ein Stream muss das komponierte
Ausgabebild enthalten, nicht einen unmarkierten Roh-Capture.

SELECTED bleibt von LIVE getrennt: Die Einzelvorschau einer anders ausgewählten
Folie zeigt eine vorbereitete Originalvorschau oder die ausdrücklich ausgewählte
native Kopie. Sie steuert niemals die laufende Original-Sitzung. Nur die Anzeige
„Live auf MAIN“ spiegelt den aktuellen Live-Bildstrom. Ein Take einer anderen
Folie darf erst dann die Live-Sitzung umstellen.

Bei einer Schnellanzeige bleibt der Show-Stand erhalten. Für den ersten Ausbau
pausiert der Adapter den Original-Player samt zugehörigem Medienfortschritt während
der Überdeckung und setzt ihn nach deren Ende kontrolliert fort. Unterstützung
wird nur bei nachgewiesener Pausierung ausgewiesen; keine heimliche Fortsetzung
mit übersprungenen Folien. ON AIR und Testbetrieb bleiben unabhängige Zustände.

## Ton und praktische Freigabegrenzen

Ein nativer Office-Player kann einen anderen Audiopfad als die bestehende
AudioEngine verwenden. Deshalb wird eingebetteter PowerPoint-Ton nicht allein
aufgrund eines laufenden Bildes als korrekt geroutet gemeldet. Die Untersuchung
muss isolierte Audioerfassung, ausschließlich einmalige hörbare Wiedergabe,
Synchronität, Stummschaltung, Pause und den konfigurierten Ausgabeweg nachweisen.
Ein globaler System-Loopback mit Radio-/Mikrofon-Rückkopplung ist kein Fallback.

Kann die erste Anbindung diese Anforderungen nicht erfüllen, weist Preflight
Ton enthaltende Originalpräsentationen als nicht freigegeben aus. Der Operator
kann ausdrücklich lautlose Wiedergabe wählen oder einen vorgerenderten Export
über die bestehende Medien-/Audio-Pipeline verwenden. Solange dieser Fall nicht
erprobt ist, darf weder vollständige Audio-Unterstützung noch ein hörbarer
PowerPoint-Ton über die AudioRoute behauptet werden. Bestehendes Radio und
Hintergrundaudio werden durch die Integration nicht umgeroutet oder global gemutet.

## Verbesserte bearbeitbare Kopie und Zeiten

Der native Import übernimmt zuerst Folienreihenfolge, Seitenverhältnis,
ausgeblendete Folien, Titel, Notizen, vorhandene Bilder sowie unterstützte Texte,
Positionen und grundlegende Formatierung. Unterstützte Übergänge werden mit
Dauer und Richtung übernommen. Nicht abbildbare Effekte erzeugen eine
folienbezogene Diagnose statt eines stillen Standard-Fades.

Pro Folie werden automatische Wechselzeit, Klickfreigabe und Übergangsdauer
getrennt gespeichert. Fehlende Zeiten werden nicht als sieben Sekunden Originalzeit
ausgegeben. Der Operator entscheidet sichtbar zwischen Originalzeiten, manueller
Navigation und eigenen Zeiten. Die native Laufzeit nutzt die bestehende
Regie-Zeitlogik; neue parallele Countdown-/Loop-Timer sind zu vermeiden.

Komplexe Objektanimationen bleiben zunächst dem Originalmodus vorbehalten. Die
Kopie muss ihre unterstützte Teilmenge klar benennen, ohne Layouttreue vorzutäuschen.

## Dateisicherheit, Fehler und Wiederherstellung

Nur ausdrücklich ausgewählte lokale Dateien werden verarbeitet. ZIP-Größe,
entpackte Gesamtgröße, Anzahl Einträge und XML-Größe werden begrenzt; keine
Pfadtraversierung, externen XML-Entitäten, ausgeführten Makros, ActiveX-Objekte
oder automatischen Downloads externer Verknüpfungen. Die unterstützte Dateiliste
wird nicht ungeprüft auf makrohaltige Office-Formate erweitert.

Programmgesteuertes Öffnen erfolgt schreibgeschützt und mit deaktivierten Makros.
Trust-Center-, Aktivierungs- und Protected-View-Grenzen werden nicht umgangen.
Fehler sind im Operator sichtbar, niemals als Stacktrace auf MAIN. Bei Verlust
der Quelle bleibt ein ausdrücklich definierter letzter gültiger Frame stehen,
mit Test-Overlay; Preflight/Operator erhalten einen Fehler. Keine stille
Umschaltung auf eine abweichende Kopie. Der Operator kann eine sichere Schnellanzeige
oder einen vorbereiteten Fallback wählen. Eine ausgefallene Quelle wird nicht als
laufender Live-Player gemeldet. Eine Wiederverbindung startet nicht unbemerkt neu.

## Umsetzungsetappen und Freigabekriterien

Nach Freigabe dieses Entwurfs folgt ein schriftlicher Implementierungsplan.
Die erste technische Etappe prüft mit eigenen Testdateien die lokale
PowerPoint-Steuerung und Fenstererfassung, ohne sie bereits produktiv freizugeben.
Ihre Ergebnisse entscheiden, ob der Original-Player die hier gesetzten
Freigabekriterien erfüllt oder eine Nutzerentscheidung über Einschränkungen braucht.
Neue Produktabhängigkeiten oder eine andere Wiedergabearchitektur werden dabei
nicht stillschweigend eingeführt. Bis zur schriftlichen Planfreigabe wird kein
Produktcode geändert und PowerPoint nicht für diese Aufgabe gestartet.

Danach folgen der robuste Import mit Diagnosen, die getrennten Dokumentstände,
die Live-/Output-Integration und die native Bearbeitung. Freigabeprüfungen:

1. PPTX-Reihenfolge unabhängig von Dateinamen, versteckte Folien und Seitenformat.
2. Automatische und manuelle Folienzeiten ohne Doppeltimer.
3. Mehrere Klickanimationen, automatische Animationen und Übergänge.
4. NEXT/PREV, direkte Folienwahl und definierter Übergang nach der letzten Folie.
5. Original unverändert nach Bearbeitung, Speichern, Sicherung und Neuöffnung.
6. Erkennbare Abweichungen und ausdrücklich gewählte Fallbacks ohne PowerPoint.
7. Ein maßgeblicher Bildzustand in MAIN und Live-Vorschau; gemessene Latenz und
   im lokalen1080p/30fps-Test höchstens150ms p95 Versatz über60Sekunden.
   Der Befehl-bis-sichtbarem-Animationsbeginn-Wert wird separat gemessen und
   darf im selben Test höchstens250ms p95 betragen. Werden diese Freigabeziele
   verfehlt, wird der Originalmodus nicht als live-tauglich freigegeben.
8. Test-Wasserzeichen auch bei ON AIR, Schwarz, Video und PowerPoint-Animationen.
9. Banner und Schnellanzeigen über der PowerPoint-Ausgabe samt kontrollierter Pause.
10. Kein fremdes Fenster/Desktop aufgenommen; nur autorisierte Steuerbefehle.
11. Office-Absturz, Timeout, entfernte Datei, fehlende Fonts und fehlende Aktivierung.
12. Eingebetteter Ton nur mit bestandener Audio-/Routenprüfung bzw. klarer Sperre.
13. Keine Regression bei Radio, bestehenden Ausgaberollen, ODP/Keynote/Text und
    Wiederherstellung; echte native Tests zusätzlich zu Unit- und Browser-Tests.

Eine geeignete reale Beispieldatei des Nutzers ergänzt die reproduzierbaren
Testdateien, ist aber keine Voraussetzung für den Entwurf. Erst nach bestandenen
Prüfungen kann eine neue Veröffentlichung angeboten werden; sie ist nicht Teil
der bisherigen Zustimmung zur optionalen PowerPoint-Anbindung.

## Technische Referenzen

Die folgenden APIs begründen einen geplanten Ansatz, keinen Nachweis, dass die
gesamte Integration auf diesem Rechner bereits funktioniert:

- Microsoft: [SlideShowSettings.Run](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.slideshowsettings.run)
  startet eine Show und liefert deren Fenster.
- Microsoft: [GotoClick](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.slideshowview.gotoclick)
  und [GetClickCount](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.slideshowview.getclickcount)
  beschreiben reguläre Animations-Klickfolgen; Sondertrigger bleiben gesondert zu prüfen.
- Microsoft: [AutomationSecurity](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.application.automationsecurity)
  erlaubt das Deaktivieren von Makros beim programmgesteuerten Öffnen.
- Electron: [desktopCapturer](https://www.electronjs.org/docs/latest/api/desktop-capturer)
  dokumentiert Fensterquellen und plattformspezifische Grenzen. Der tatsächliche
  unterstützte Umfang ist zusätzlich gegen die Projektversion Electron37 zu prüfen.
- Microsoft: [CreateVideo](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.presentation.createvideo)
  bietet einen expliziten Videoexport mit Zeitoptionen, ersetzt keine interaktive Show.
