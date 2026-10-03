# Community-Daten, automatisches Nachprogramm und Test-Wasserzeichen

## Ziel

GottesdienstRegie verwendet die bestehende Firebase Realtime Database des Projekts `philippusgemeindebie` zentral für Veranstaltungen, Räume und Meldungen. Beim Eintritt ins Nachprogramm wird anhand stabiler Raum-IDs automatisch auf eine unmittelbar folgende Veranstaltung hingewiesen oder zum Verlassen des Raums aufgefordert. Im Testbetrieb kennzeichnet ein globales Wasserzeichen ausnahmslos alle tatsächlich gerenderten visuellen Ausgaben, unabhängig vom ON-AIR-Status.

## Verbindliche Grundsätze

- Firebase bleibt die einzige Source of Truth. Es entstehen keine parallelen Datenbanken oder konkurrierenden Zeit-, Raum- oder Meldungslogiken.
- Rohdaten werden niemals direkt gerendert. MAIN und andere Outputs erhalten ausschließlich normalisierte öffentliche Objekte.
- Veranstaltungen werden durch `eventKey`, Meldungen durch `messageId` und Räume durch ihre echte `roomId` identifiziert. Sichtbare Namen sind keine Identitäten.
- Interne IDs, `undefined`, `[object Object]`, Netzwerkfehler und Stacktraces dürfen nie auf einem Output erscheinen.
- Firebase-Aktualisierungen verändern eine gerade sichtbare Ausgabe nicht mitten im Frame. Vorbereitete Änderungen werden erst am nächsten sicheren Ausgabewechsel übernommen.
- Live-Ausgabe, Navigation, Medien und Audio haben Vorrang vor Community-Datenaktualisierungen.

## Architektur und Zuständigkeiten

`FirebaseGemeindeService` ist die einzige Initialisierungs- und Abonnementstelle für Firebase. Er stellt intern die Referenzen beziehungsweise Adapter für `veranstaltungen/`, `meldungen/` und `rooms/` bereit, verwaltet Verbindung und Cache und veröffentlicht Änderungen über einen gemeinsamen Store. Schreibvorgänge erfolgen ausschließlich über validierende Command-Services.

Der Renderer-Datenfluss lautet:

`FirebaseGemeindeService → EventService / RoomService / AnnouncementService → normalisierte öffentliche Daten → Loop/Screenmeldung/PostProgram → Output`

Die Services haben klar getrennte Aufgaben:

- `RoomService`: rekursives Einlesen und Normalisieren von Räumen sowie Auflösung stabiler IDs und kompatibler Aliase.
- `EventService`: zentraler Event-Store, geplante und effektive Zeiten, Entfall/Papierkorb, geplante und effektive Locations sowie öffentliche Event-DTOs.
- `AnnouncementService`: Gültigkeit, Ziel-Loop, öffentliche Meldungsfelder und stabile Übergabe an den bestehenden Screenmeldung-Renderer.
- `PostProgramRoomNoticeService`: Auswahl der nächsten Veranstaltung im effektiven aktuellen Raum und Erzeugung eines sicheren öffentlichen Nachprogramm-Hinweises.
- `CommunitySnapshotCache`: letzter gültiger Snapshot für Veranstaltungen, Räume und Meldungen samt Aktualisierungszeit.

## FirebaseGemeindeService

Der Service lädt `veranstaltungen/`, `meldungen/` und `rooms/` genau einmal. Der initiale Zustand darf über `value` geladen werden; laufende Aktualisierungen verwenden nach Möglichkeit `child_added`, `child_changed` und `child_removed`. Bei jedem Event wird `{ eventKey: snapshot.key, ...snapshot.val() }`, bei jeder Meldung `{ messageId: snapshot.key, ...snapshot.val() }` erzeugt. Räume behalten ihren echten Firebase-Key als `roomId`, auch wenn die Struktur verschachtelt ist.

Der Service veröffentlicht kleine inkrementelle Änderungen an die Domain-Stores. UI-Komponenten, Fenster, MAIN und Renderer initialisieren Firebase nicht selbst. Verbindungsverlust aktiviert einen zeitlich gekennzeichneten Cache-Zustand. Technische Fehler bleiben auf die Operator-Oberfläche beschränkt.

## RoomService

`RoomService` hält `roomsById` und `aliasMap`. Er kann verschachtelte Container wie `rooms`, `raeume`, `räume`, `roomList` und `room_list` rekursiv flatten. Eine kanonische ID kommt bevorzugt aus dem Firebase Child-Key, sonst aus `id`, `roomId`, `raumId`, `key` oder `__key`.

Für den Namen werden tolerant `raumname`, `raumName`, `name`, `label`, `bezeichnung`, `titel`, `displayName`, `raumkurzname`, `kurzname`, `shortName`, `meta.name` und `meta.label` geprüft. Etage, Gebäude, Kapazität und Barrierefreiheit verwenden die im Auftrag genannten kompatiblen Felder.

Die Auflösung prüft zuerst die exakte ID. Danach folgen Aliase aus ID, Pfad, Name, Kurzname, Bezeichnung, Kürzel, `code`, `slug`, Alias-/Suchbegriff-Arrays und sinnvollen Kombinationen mit Etage und Gebäude. Eine nicht auflösbare technische Referenz ergibt für öffentliche DTOs keine sichtbare ID. Die Operator-Oberfläche darf eine gezielte Warnung mit der Referenz ausgeben.

## EventService

`EventService` hält den zentralen Event-Store und bietet mindestens `getByKey`, `getAllEvents`, `upsert`, `remove`, `getPlannedStart`, `getPlannedEnd`, `getEffectiveStart`, `getEffectiveEnd`, `isCancelled`, `isTrashed`, `getPlannedLocation`, `getEffectiveLocation` und `getUpcomingEvents`.

Planzeiten bleiben in `start_datum/start_uhrzeit` und `ende_datum/ende_uhrzeit`. Effektive Zeiten verwenden vorrangig die `Verspaetungs...`-Felder und kompatibel `delay.start`/`delay.end`; die Planzeit wird nicht überschrieben. Entfall wird über `cancelled === true` oder `cancel.enabled === true` erkannt.

Location-Regeln:

- `veranstaltungsort === "raum"`: `raum || ort` als Raumreferenz auflösen.
- `veranstaltungsort === "ort"`: freien Ort direkt verwenden.
- `veranstaltungsort === "online"`: normalisierte Online-Location.
- `veranstaltungsort === "hybrid"`: anhand `hybrid_vorort_typ` Raum oder freien Ort verwenden und Online-Anteil erhalten.
- `ersatzortType === "raum"`: Ersatzraum auflösen und als effektive Location verwenden.
- `zusatzraeume` beziehungsweise `zusatz_rooms`: jede Referenz einzeln auflösen.

Eine normalisierte interne Location enthält mindestens `{ type: "room", roomId, name, floor, building, accessible }`. Öffentliche Darstellungen verwenden ausschließlich Namen und erlaubte Details. Präsentationen speichern ausschließlich `linkedEventKey`; Umbenennungen oder Raumstammdatenänderungen zerstören die Verbindung nicht.

## AnnouncementService und Screenmeldung

Eine Meldung ist für den Meldungsscreen gültig, wenn sie nicht im Papierkorb liegt, einen öffentlichen Status besitzt, `messageScreen` truthy ist und im gültigen Zeitraum liegt. Bei `saalscreenUseShowFrom === true` hat `showFrom` Vorrang vor `giltAb`. `Bis auf Weiteres` bedeutet kein festes Ende. Der Text kommt aus `textMeldung`, ersatzweise `beschreibung`.

Die optionale `gottesdienstRegie.loopTargets`-Zuordnung ergänzt das Schema, ersetzt `messageScreen` aber nicht. Ohne gültige Meldungen ist das Loop-Element `EMPTY` und wird übersprungen. Der bestehende Screenmeldung-Renderer bleibt die visuelle Grundlage. MAIN erhält nur öffentliche Felder und übernimmt Datenänderungen an einem sicheren Wechselpunkt.

## Automatisches Nachprogramm

Beim Eintritt in den Abschnitt `NACHPROGRAMM` liest `PostProgramRoomNoticeService` die aktuell verknüpfte Veranstaltung über `presentation.linkedEventKey`. Er verwendet deren effektive Location einschließlich Ersatzraum. Ohne auflösbare interne `roomId` wird keine Raumsuche durchgeführt; der sichere Rückfall ist die Verlassen-Anzeige.

Das Suchfenster reicht von `TrustedClock.now()` exklusiv bis einschließlich `now + 61 Minuten`. Kandidaten:

- sind nicht die aktuell verknüpfte Veranstaltung,
- sind weder ausgefallen noch im Papierkorb,
- beginnen effektiv `> jetzt` und `<= Fensterende`,
- besitzen dieselbe effektive `roomId`.

Die öffentliche Sichtbarkeit ist für diese interne Raumbelegungsprüfung unerheblich. Bei mehreren Treffern gewinnt der früheste effektive Beginn.

Mit Treffer wird vorbereitet:

`IHRE NÄCHSTE VERANSTALTUNG`

mit Titel, effektiver Startzeit, echtem Raumname und Etage sowie optional `Beginn in X Minuten`. Ohne Treffer wird exakt `Wir bitten alle Besucher, den Raum zu verlassen.` dargestellt. Technische IDs werden nie angezeigt.

Änderungen an Events oder Räumen während des Nachprogramms lösen eine Neuberechnung aus. Absage, Zeitverschiebung, Ersatzraum und neue Veranstaltung werden berücksichtigt. Ein neues Ergebnis wird vorbereitet, aber erst beim nächsten sicheren Folien-/Loop-Wechsel aktiviert.

## Offline und Preflight

Der Cache enthält Veranstaltungen, Räume, Meldungen und `updatedAt`. Bei Verbindungsverlust werden nur noch fachlich sinnvolle Daten verwendet. Operatoren sehen `Offline · letzter Stand HH:MM Uhr`; Outputs bleiben frei von technischen Fehlern.

Preflight prüft Verbindung, Ladezustand aller drei Sammlungen, `linkedEventKey`, verknüpfte Veranstaltung, interne Raum-ID, Auflösung von Haupt-/Ersatzraum, Meldungen und vorbereitete PRE-/POST-Inhalte. Dynamische optionale Inhalte blockieren ON AIR standardmäßig nicht. Nicht auflösbare Raumreferenzen werden ausschließlich im Operator-Bereich gemeldet.

## Globaler Testmodus

Testbetrieb und ON AIR sind unabhängige Zustände:

```ts
type AppModeState = {
  mode: "normal" | "test";
  onAir: boolean;
};
```

Alle vier Kombinationen sind gültig. ON AIR darf den Testmodus weder aktivieren noch beenden. Der Testmodus wird niemals als Negation von ON AIR berechnet und nicht automatisch bei OFF AIR zurückgesetzt.

Neue Output-Fenster erhalten den aktuellen Zustand beim Start. Laufende Fenster erhalten Modusänderungen unmittelbar per IPC; ein Neustart ist nicht erforderlich. Remote-, MIDI-, OSC-, HTTP- oder Präsentationsbefehle dürfen das Wasserzeichen nicht entfernen.

## TestModeWatermark

Jede tatsächliche visuelle Output-Wurzel rendert nach Content, Quick Screen und Transition einen systemseitigen `TestModeOverlayLayer`. Er ist nur sichtbar, wenn `mode === "test"`, unabhängig von `onAir`.

Der Layer:

- liegt über Slides, Videos, Webseiten, PDFs, dynamischen Inhalten, Quick Screens und Schwarzbild,
- ist nicht Teil einer Folie und verändert deren Layout nicht,
- nimmt nicht an Übergängen oder Designanimationen teil,
- verwendet eine neutrale Systemschrift, kleine halbtransparente Darstellung und sicheren Randabstand,
- zeigt auf MAIN/LIVESTREAM/Virtual Screens `TESTBETRIEB`, auf STAGE und echtem Personal Monitor `TEST`,
- besitzt `pointer-events: none` und einen systemseitig reservierten höchsten Overlay-Z-Index.

Da Recording und Streaming denselben finalen Output-Frame verwenden, muss der Layer auch dort sichtbar sein. Reine Operator-Vorschauen erhalten das Wasserzeichen nur dann, wenn sie einen echten Output-Frame spiegeln; die Bedienoberfläche selbst ist nicht die Sicherheitsgrenze.

## Sicherheit und Übergänge

Das Wasserzeichen bleibt während Folienwechseln statisch und flackert nicht. Auch `SCHWARZ` überdeckt es nicht. Testbetrieb + ON AIR führt die normale Live-Engine aus, bleibt jedoch eindeutig als Test markiert. Nur ein expliziter, gegebenenfalls bestätigter Wechsel zu `mode: "normal"` entfernt das Overlay; ON AIR darf dabei unabhängig weiterlaufen.

## Tests und Abnahme

Automatisierte Tests decken mindestens ab:

- Event-/Meldungs-Child-Keys bleiben erhalten; Umbenennungen ändern Identitäten nicht.
- Rekursiv verschachtelte Räume, echte IDs, Aliasfelder, Umlaute, Ersatz- und Zusatzräume werden korrekt aufgelöst.
- Keine unaufgelöste Raum-ID erscheint in öffentlichen DTOs.
- Plan- und Effektivzeiten bleiben getrennt; Entfall und Papierkorb werden erkannt.
- Meldungszeitfenster, `showFrom`, `Bis auf Weiteres`, Loop-Ziele und `EMPTY` funktionieren.
- Nachprogramm-Grenzen: jetzt ausgeschlossen, exakt 61 Minuten eingeschlossen, 61 Minuten plus eine Millisekunde ausgeschlossen.
- Ersatzraum, Absage, Zeitänderung, Raumwechsel und mehrere Kandidaten aktualisieren die vorbereitete Auswahl korrekt.
- Sichtbare Loop-Snapshots bleiben bis zum sicheren Wechsel stabil.
- Cache und Preflight liefern Operatorwarnungen, aber keine technischen MAIN-Ausgaben.
- Normal/OFF AIR und Normal/ON AIR zeigen kein Wasserzeichen.
- Test/OFF AIR und Test/ON AIR zeigen das Wasserzeichen auf allen Output-Rollen.
- Video, Website, Schwarzbild, Quick Screens und Transitionen können das Overlay nicht verdecken oder mitfaden.
- IPC aktiviert und entfernt das Overlay in laufenden und neu geöffneten Output-Fenstern.
- Der endgültige Livestream-/Recording-Frame enthält das Overlay im Testmodus.

## Nicht-Ziele

- Keine Umstrukturierung oder Migration der bestehenden Firebase-Daten.
- Keine zweite Event-, Raum- oder Meldungsdatenbank.
- Keine Designoption zum Abschalten oder Verändern des Test-Wasserzeichens.
- Keine direkte Firebase-Nutzung aus UI, MAIN oder Renderern.
- Keine Änderung sichtbarer Veranstaltungen anhand ihres Titels.

## Abschlussregeln

Firebase speichert Rohdaten, Domain-Services normalisieren sie, Outputs rendern nur öffentliche DTOs. Der automatische Nachprogramm-Hinweis vergleicht ausschließlich stabile effektive Raum-IDs innerhalb des festgelegten 61-Minuten-Fensters. Testbetrieb und ON AIR bleiben orthogonale Zustände. Im Testbetrieb darf kein tatsächlicher visueller Output-Frame ohne systemseitiges Test-Wasserzeichen ausgegeben, gestreamt oder aufgenommen werden.
