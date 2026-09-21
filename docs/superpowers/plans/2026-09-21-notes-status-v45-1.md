# Notes Status v45.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Status persönlicher Notizen so darstellen, dass Schloss, laufende Speicherung, Erfolg und Fehler jeweils ein passendes Symbol und Verhalten besitzen.

**Architecture:** Die bestehende reine Statuslogik in `noteStatus.ts` liefert Symbol und Text getrennt. `PersonalNotesPanel` rendert sie zugänglich; ein Timer setzt „Gespeichert“ nach fünf Sekunden auf den privaten Ruhezustand zurück.

**Tech Stack:** React 19, TypeScript, Material Symbols, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-21-web-editor-remote-design.md` (abgegrenzter Desktop-Patch v45.1)

## Global Constraints

- Im Ruhezustand erscheint ein Schloss mit „Diese Notiz ist nur für dich sichtbar.“
- Während der Speicherung erscheint ein rotierendes Synchronisationssymbol und der Text wechselt sichtbar zwischen `.`, `..` und `...`.
- Nach Erfolg erscheint ein Haken mit „Gespeichert“ höchstens fünf Sekunden.
- Bei Fehler erscheint ein Fehlerzeichen mit „Speichern fehlgeschlagen“.
- Persönliche Notizen werden durch diesen Patch nicht synchronisiert.

## Review Focus

- Schnelle aufeinanderfolgende Eingaben dürfen keinen alten Timer den neuen Speicherstatus zurücksetzen lassen; geprüft in Task 1.
- Ein Fehler nach einem früheren Erfolg muss sichtbar bleiben und darf nicht zum Schloss zurückspringen; geprüft in Task 1.
- Beim Schließen des Panels dürfen keine Timer weiterlaufen; geprüft in Task 1.
- Screenreader sollen Statusänderungen hören, ohne die Punkteanimation dreimal anzusagen; geprüft in Task 1.
- Der sichtbare Erfolgsstatus darf nie länger als fünf Sekunden bleiben; geprüft in Task 1.

---

### Task 1: Notizenstatus implementieren und veröffentlichungsfähig prüfen

**Files:**
- Modify: `src/noteStatus.ts`
- Modify: `src/PersonalNotesPanel.tsx`
- Modify: `src/shared-device.css`
- Create: `src/noteStatus.test.ts`
- Create: `src/PersonalNotesPanel.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`

**Interfaces:**
- Consumes: vorhandener `NoteStatus` und `PERSONAL_NOTE_SAVED_MS`.
- Produces: `noteStatusPresentation(status,dotCount)` und die v45.1-Statusanzeige.

- [ ] **Step 1: Fehlende Zustände als Tests schreiben**

```ts
expect(noteStatusPresentation('idle',0)).toEqual({icon:'lock',text:'Diese Notiz ist nur für dich sichtbar.',animated:false});
expect(noteStatusPresentation('saving',1)).toEqual({icon:'sync',text:'Speichert .',animated:true});
expect(noteStatusPresentation('saving',3).text).toBe('Speichert ...');
expect(noteStatusPresentation('saved',0)).toEqual({icon:'check_circle',text:'Gespeichert',animated:false});
expect(noteStatusPresentation('error',0)).toEqual({icon:'error',text:'Speichern fehlgeschlagen',animated:false});
```

Der Komponententest verwendet Fake Timer, löst Speichern aus, prüft `saving`, dann `saved`, springt 5000 ms vor und erwartet wieder `idle`. Ein separater Fehlerfall prüft, dass der Erfolgstimer nach Fehler nicht zurücksetzt.

Run: `npx vitest run src/noteStatus.test.ts src/PersonalNotesPanel.test.tsx`

Expected: FAIL.

- [ ] **Step 2: Reine Statusdarstellung implementieren**

```ts
export function noteStatusPresentation(status:NoteStatus,dotCount=0){
  if(status==='saving')return {icon:'sync',text:`Speichert ${'.'.repeat(Math.min(3,Math.max(1,dotCount)))}`,animated:true};
  if(status==='saved')return {icon:'check_circle',text:'Gespeichert',animated:false};
  if(status==='error')return {icon:'error',text:'Speichern fehlgeschlagen',animated:false};
  return {icon:'lock',text:'Diese Notiz ist nur für dich sichtbar.',animated:false};
}
```

- [ ] **Step 3: Sichere Timerlogik in `PersonalNotesPanel` ergänzen**

Ein 400-ms-Intervall läuft ausschließlich bei `saving` und rotiert `1 → 2 → 3 → 1`. Ein separater 5000-ms-Timeout startet ausschließlich bei `saved`. Beide Timer werden beim Statuswechsel und Unmount bereinigt. Der Fehlerstatus startet keinen Rücksetztimer.

Das Statuslabel erhält `role="status" aria-live="polite"`; für Screenreader bleibt bei `saving` ein stabiler, visuell versteckter Text „Notiz wird gespeichert“, während die Punkteanimation `aria-hidden="true"` ist.

- [ ] **Step 4: Symbolanimation gestalten**

```css
.personal-note-status .material-symbols-outlined.is-spinning{animation:note-status-spin .8s linear infinite}
@keyframes note-status-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.personal-note-status .material-symbols-outlined.is-spinning{animation:none}}
```

- [ ] **Step 5: Version und ausführliche Release Notes vorbereiten**

`package.json` wird auf `0.45.1` gesetzt. `CHANGELOG.md` und `RELEASE_NOTES.md` nennen ausschließlich den korrigierten Notizenstatus, Timerbereinigung, Barrierefreiheit und unveränderte lokale Speicherung.

- [ ] **Step 6: Vollständig verifizieren**

Run: `npx vitest run src/noteStatus.test.ts src/PersonalNotesPanel.test.tsx && npm run typecheck && npm run build`

Expected: alle Befehle Exitcode 0.

- [ ] **Step 7: Commit**

```bash
git add src/noteStatus.ts src/PersonalNotesPanel.tsx src/shared-device.css src/noteStatus.test.ts src/PersonalNotesPanel.test.tsx package.json package-lock.json CHANGELOG.md RELEASE_NOTES.md
git commit -m "fix: clarify personal note save status"
```
