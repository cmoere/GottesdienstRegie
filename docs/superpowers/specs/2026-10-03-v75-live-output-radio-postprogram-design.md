# GottesdienstRegie v75 – technische Spezifikation

Stand: 03.10.2026. Status: Ansatz freigegeben; schriftliche Spezifikation zur Prüfung. Noch keine Implementierungs- oder Veröffentlichungsbestätigung.

## Ziel und Grenzen

v75 repariert die native MAIN-Ausgabe und Radio-Wiedergabe und erweitert die vorhandenen Services für Veranstaltungen, Räume und Nachprogramm. Die ausführliche v75-Anforderung des Nutzers und seine drei Referenzbilder bestimmen Verhalten und Darstellung. Funktionierende Präsentations-, Medien-, Meldungs- und Live-Funktionen bleiben erhalten. Keine parallele Firebase-Datenbank, keine zweite Zeitlogik und keine direkten Firebase-Zugriffe aus Renderern.

Bestehende Komponenten werden erweitert: FirebaseGemeindeService, EventService, RoomService, AnnouncementService, LiveController/LiveEngine, OutputWindowManager/OutputRenderer, BackgroundAudioEngine und bestehendes Audio-Routing. Ein vollständiger Neuaufbau wurde zugunsten kleiner, überprüfbarer Erweiterungen verworfen. Ein isolierter Radio-Player wurde verworfen, weil er die konfigurierte Background-Audio-Route erneut umgehen könnte.

## 1. Zuverlässiger Start der nativen Ausgaben

Der aktuelle OutputWindowManager sendet die erste Folie nach dem Laden des Fensters ohne Empfangsbestätigung des React-Renderers. Das ist eine mögliche Start-Race-Condition, noch kein am physischen Monitor nachgewiesener alleiniger Fehler.

Der Manager hält pro Output-Rolle den letzten gültigen Folien-, Quick-Screen- und Moduszustand. Ein neu gestarteter Renderer registriert zuerst seine Listener und fordert anschließend den aktuellen Zustand an beziehungsweise meldet Empfangsbereitschaft. Revisionen verhindern, dass eine ältere initiale Antwort eine bereits empfangene neue Live-Nachricht überschreibt. Auch ein neu geladenes Fenster bekommt den aktuellen Zustand, nicht eine veraltete Startfolie. IPC-Zugriffe werden auf verwaltete Ausgabefenster und ihre Rollen beschränkt.

Monitorzuordnung, Fensterlebenszyklus, Output-Route und Live-Start werden gemeinsam untersucht. Fehlende beziehungsweise entfernte Displays werden im Operator-Bereich gemeldet; auf zerstörte Fenster wird nicht zugegriffen. ON AIR startet die echte Live-Engine und öffnet die zugewiesenen Ausgaben. Keine reine UI-Erfolgsanzeige bei fehlgeschlagenem Start.

## 2. Unabhängiger Testmodus

`mode: normal | test` und `onAir: boolean` bleiben getrennte Zustände. Ausschließlich `mode === test` steuert das globale Overlay. ON AIR verändert den Modus nicht.

Alle echten visuellen Outputs und ihre Spiegel erhalten unten rechts `TESTBETRIEB`, einschließlich STAGE und Personal Monitor. Systemfont, etwa 18–24 px bei 1080p, 20–30 px Rand und 45–65 % Deckkraft mit lesbarem Kontrast. Der Layer liegt außerhalb der Folien- und Übergangsebenen, verändert kein Layout, nimmt keine Eingaben entgegen und ist nicht durch Themes, Quick Screens oder Inhaltssteuerung abschaltbar.

Video-, Website-/Browser-, Schwarz- und Aufnahme-/Stream-Pfade werden einzeln geprüft: Ein Operator-Overlay allein reicht nicht. Falls ein nativer Browser-Layer oder separater Capture-Pfad verwendet wird, muss dessen finale Komposition das Overlay enthalten. Modusänderungen erreichen bereits offene sowie neu geöffnete Outputs unmittelbar. Keine Kopplung an Audio, Headerfarbe oder Wiedergabestatus.

## 3. Zentrale Veranstaltungen und Räume

Firebase `veranstaltungen/`, `rooms/`, `meldungen/` bleibt Source of Truth. FirebaseGemeindeService initialisiert zentral und verteilt Änderungen an die vorhandenen Stores. Child-Keys bleiben kanonische IDs und können nicht durch gleichnamige Felder in Rohdaten überschrieben werden. Präsentationen verknüpfen über `linkedEventKey`; bestehende kompatible Verknüpfungen werden ohne Titelvergleich übernommen.

RoomService normalisiert verschachtelte Container `rooms`, `raeume`, `räume`, `roomList`, `room_list`. Er unterstützt die in der Nutzeranforderung aufgeführten ID-, Namens-, Etagen-, Gebäude-, Kapazitäts-, Barrierefreiheits- und Aliasfelder. Direkte IDs haben Vorrang vor Aliasauflösung; mehrdeutige Aliase dürfen keine beliebige Raumzuordnung erzeugen. Namensänderungen lösen keine Änderungen an Veranstaltungen aus.

Expliziter Typ `raum`: primär `raum`, ersatzweise `ort` auflösen. Expliziter Typ `ort`: freie Ortsangabe, keine Raumauflösung. `online`: kein Raum. `hybrid`: Vor-Ort-Untertyp entscheidet. Typfreie Altdaten dürfen über eine eindeutig bekannte Raumreferenz kompatibel aufgelöst werden. Nicht auflösbare technische Raumreferenzen erscheinen niemals als Besuchertext. Ersatz- und Zusatzräume werden separat aufgelöst; effektive und geplante Location bleiben getrennt.

EventService bleibt allein verantwortlich für Planzeit, effektive Zeit und Entfall. Teilweise gesetzte effektive Datums-/Zeitfelder werden mit den zugehörigen Plankomponenten ergänzt, ohne Planwerte zu überschreiben. Kompatible `delay.start/end` werden unterstützt. `cancelled === true` oder `cancel.enabled === true` sowie Papierkorb/gelöschte Datensätze schließen Kandidaten aus. MAIN erhält ausschließlich reduzierte öffentliche Daten, keine internen Kommentare oder Fehlerobjekte.

## 4. Nachprogramm-Session und sichere Übernahme

Beim tatsächlichen Eintritt ins Nachprogramm entsteht genau eine Session. Sie wählt einmal zufällig `#608F9A` oder `#699F3E` und hält die Farbe zentral. Alle Outputs bekommen dieselbe Farbe im Snapshot. Re-Render, Firebase-Update, Testmodus und ON AIR/OFF AIR würfeln nicht erneut. Erst Verlassen des Abschnitts und späterer Wiedereintritt erzeugen eine neue Session.

Eine zentrale injizierbare App-Zeitquelle wird verwendet; vorhandene vertrauenswürdige Zeitintegration hat Vorrang. Ist keine synchronisierte Zeitquelle verfügbar, wird lokale App-Zeit ausdrücklich als solche behandelt, nicht als extern verifiziert ausgegeben. Grenzen sind automatisiert mit deterministischer Zeit testbar.

Prüfung: verknüpftes Event laden, eindeutigen effektiven internen Raum bestimmen, alle übrigen nicht gelöschten/nicht ausgefallenen Events nach `effectiveStart > now && effectiveStart <= now + 61 Minuten` und identischer effektiver roomId filtern. Nicht öffentliche Buchungen dürfen zählen. Alle Treffer chronologisch verwenden, einschließlich Ersatzräume. Bei fehlender Verknüpfung oder unauflösbarem aktuellem Raum gibt es keinen belastbaren Prüfbefund: keine irreführende Räumungsaufforderung, sondern Operator-Warnung und Fortsetzung des normalen Nachprogramms.

Bei gültiger Prüfung ohne Treffer: exakt `Wir bitten alle Besucher, den Raum zu verlassen.`. Mit Treffern: `Ihre nächsten Veranstaltungen`, Datum, effektive Start-/Endzeit, vollständiger Titel und aufgelöster Raum. Datenänderungen und fortschreitende Zeit berechnen einen vorbereiteten Zustand neu. Aktuelle sichtbare Snapshots bleiben stabil; Übernahme am nächsten sicheren Folien-/Loop-Wechsel. Auch ein Wechsel zu keinem Ergebnis wird explizit übernommen, nicht durch einen alten Snapshot verdeckt.

## 5. Schwarzes Nachprogramm-Design

Vollbreiter farbiger Header mit 17–18 % Bildhöhe. Mit Treffern große schwarze fette linksbündige Überschrift; ohne Treffer bleibt der Header leer. Inhaltsbereich schwarz.

Treffer als große weiße fette Tabellenzeilen ohne Cards oder Spaltenüberschriften. Spalten Datum/Zeit/Titel/Raum ungefähr 25/29/31/15 %, Raum rechtsbündig, übrige linksbündig, dünne helle Trenner. Datum etwa `So., 11.10.2026`, Zeit `12:30–14:00`. Fehlende Endzeit wird nicht erfunden. Bei mehr Treffern als Bildschirmplatz bleiben alle in chronologischen Folgeseiten erreichbar; Seitenwechsel erfolgen an sicheren Übergängen und behalten die Sessionfarbe.

Ohne Treffer steht der genaue Räumungstext groß, weiß, fett und linksbündig weit oben unter dem Header. Keine Zusatzmeldung, Icons oder Countdown. Das globale Test-Wasserzeichen liegt unverändert darüber.

## 6. Helle Veranstaltungsübersicht und vollständige Titel

Die separate normale Veranstaltungsübersicht erhält das helle zweispaltige Referenzdesign: kleine türkise zentrierte Überschrift, türkise Nummernkreise, große schwarze kräftige Titel und kleinere helle statische Metazeilen `Datum · Start–Ende · Raum · Etage`. Keine Cards/Rahmen. Öffentliche und zeitlich relevante Events werden zentral gefiltert, ausgefallene nicht als normale Termine dargestellt.

Titel behalten dieselbe vorgesehene Schriftgröße und Gewichtung. Keine Ellipse, Zeichenkürzung, line-clamp-Abschneidung oder automatische Schriftverkleinerung. Nach Layout und Font-Laden wird pro Titel geprüft: eine Zeile, sonst natürlicher Umbruch bis zwei Zeilen; reicht der Bereich weiterhin nicht, wird nur der innere Titel horizontal bewegt. Ruhige Bewegung mit Pause an beiden Enden, vollständiges Erreichen des Textendes. Kreis, Metazeile und Nachbarereignisse bleiben statisch. Größen-/Inhaltsänderungen lösen eine neue Messung aus. Bei reduzierter Bewegung wird vollständiger Umbruch mit zusätzlicher Seitenaufteilung gegenüber einer erzwungenen Laufanimation bevorzugt.

## 7. Radio und Background-Audio-Route

Der aktuelle AudioLevelProvider erstellt einen MediaElementSource und verbindet ihn mit einem separaten AudioContext-Standardausgang. Damit kann er den nativen Media-Sink umgehen; fehlendes Resume und Cross-Origin-Beschränkungen sind weitere konkrete Risiken. Physische Hörbarkeit ist damit noch nicht bewiesen oder widerlegt.

Die bestehende BackgroundAudioEngine bleibt Eigentümer der Wiedergabe. Radio verwendet dieselbe konfigurierte Background-Audio-Route, Lautstärke, Mute-, Ducking- und Gerätebehandlung. Die Pegelanalyse darf den hörbaren Signalweg nicht übernehmen. Bevorzugt wird eine unterstützte nichtinvasive Stream-Analyse; ist sie technisch nicht möglich, lautet der Signalstatus unbekannt/nicht messbar. Synthetisch animierte Balken dürfen niemals als gemessener Pegel oder Signalnachweis gelten.

AudioContext wird bei Bedarf resumed, Quellen/Analyser werden korrekt aufgeräumt und nicht mehrfach an dasselbe Element gebunden. Routingfehler werden nicht still verschluckt. Gerätewechsel und `devicechange` prüfen die gewählte Route neu; ein explizit ausgewiesener Standardgeräte-Fallback oder verständlicher Fehler ersetzt stilles Scheinerfolgsverhalten. Rückkehr des gewünschten Geräts stellt die Route wieder her.

Statusmodell trennt Verbindungs-/Pufferzustand, Medienfortschritt, Signalnachweis und Route: `VERBINDET …`, `PUFFERT …`, `LÄUFT`, `KEIN AUDIOSIGNAL`, `AUDIOAUSGANG NICHT VERFÜGBAR`, `STREAMFEHLER`. Ein erfülltes play-Promise allein genügt nicht für LÄUFT. Fortschreitende Wiedergabe und erfolgreiche verfügbare Route werden geprüft; nicht messbares Signal wird offen ausgewiesen. Kein Softwarestatus behauptet, physisch Lautsprecher gehört zu haben.

Operator-Diagnose: Stream, Signal vorhanden/kein Signal/nicht messbar, Route Background Audio, Gerätename, tatsächliche Lautstärke, Mute, AudioContext-Zustand und echter Pegel sofern messbar. Abschnittswechsel erhalten den Audioweg, wenn die konfigurierte Fortsetzungsregel dies verlangt. Testmodus/ON AIR erzeugen keinen zusätzlichen Mute.

## 8. Offline, Preflight und Update-Diagnose

Letzter gültiger Snapshot darf offline fachlich/zeitlich geprüft weiterverwendet werden. Unsichere oder veraltete Daten erzeugen Operator-Warnungen statt falscher öffentlicher Aussagen. MAIN zeigt keine technischen IDs, `undefined`, `[object Object]`, Netzwerkfehler oder Stacktraces.

Preflight prüft Firebase-Status, Datenladezustände, linkedEventKey, effektiven und Ersatzraum, Nachprogramm-Vorbereitung sowie AudioEngine, Background-Route und Gerät. Dynamische optionale Inhalte blockieren ON AIR nicht pauschal. Fehlende MAIN-Zuordnung oder fehlgeschlagener Output-Start werden dagegen klar angezeigt.

Die offene Update-Suche bleibt ein separater Diagnosepunkt: installierte Version 0.73.0 und öffentliches v0.74.0-Manifest wurden festgestellt. Der konkrete Grund für die fehlende Anzeige ist noch nicht nachgewiesen. Exakten Updater-Abruf, Rückgabestatus und UI-Verarbeitung prüfen; keine erfundene Ursache oder unbelegte Veröffentlichungsbehauptung.

## 9. Prüfung und Freigabekriterien

- Automatisierte Tests für verspätete Renderer-Registrierung, neue/neu geladene Outputs, stale initial state und zerstörte Fenster.
- Alle vier Testmodus/ON-AIR-Kombinationen; neue Fenster und sofortige Moduswechsel; Overlay über Schwarz, Video, Website und Übergängen. Aufnahme/Stream am tatsächlichen Capture-Pfad prüfen.
- Raumvarianten, verschachtelte Container, Aliasmehrdeutigkeit, echte IDs, freie externe Orte, Hybrid, Ersatz-/Zusatzräume, Umbenennung und ungelöste Referenzen.
- Effektive Teilzeiten und Planwerterhalt; 30, exakt 61 und 62 Minuten, bereits begonnen, mehrere Treffer, Entfall, interne Buchung und Ersatzraum.
- Sessionfarbe einmal pro Eintritt, unverändert bei Updates/Moduswechseln/Ergebniswechseln, neue Session nach Verlassen. Ungültiger aktueller Raum erzeugt keine Räumungsaufforderung.
- Realtime-Änderungen werden vorbereitet und erst am sicheren Wechsel sichtbar; leere Resultate ersetzen alte Ergebnisse korrekt.
- Visuelle Prüfung beider Referenzlayouts bei 1920×1080 und skalierten Vorschauen; lange Titel umbrechen oder scrollen vollständig, Metadaten bleiben statisch.
- Audiotests mit simulierten Geräten, suspended Context, Mute/Gain, Routingfehlern, fehlendem Signal, nicht messbarer Analyse, Geräteentfernung/-rückkehr und Abschnittswechseln.
- Native Prüfung auf zugewiesenem MAIN und der realen Background-Audio-Route; falls Hardwareprüfung nicht möglich ist, ausdrücklich als unbestätigt ausweisen.
- Bestehende Tests, Typecheck, Release-Guards und native Build-Prüfung müssen bestehen. Veröffentlichung und Installer-Verfügbarkeit anschließend separat verifizieren; keine Veröffentlichung vor diesen Nachweisen.

## Nächster Schritt

Nach Prüfung dieser schriftlichen Spezifikation folgt ein ausführbarer Implementierungsplan mit Reihenfolge, betroffenen Dateien und Tests. Produktcode bleibt bis zur dafür vorgesehenen Freigabe unverändert.
