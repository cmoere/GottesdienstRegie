# v98 local design AI and controls — implementation plan

Inline execution using writing-plans, executing-plans, systematic-debugging and TDD. No coding delegation. Existing approved worktree retained; unrelated startup diagnostic untouched. User explicitly selected larger models/higher quality, real local images and no separate installation.

**Spec:** docs/superpowers/specs/2026-11-03-v98-ai-design-extension.md
**Goal:** Automatically prepare removable local models, generate editable slide design plus real images, and clarify preview/settings controls.

- [x] Native feasibility: verify a stronger compatible text model and SDXL-class model/runtime revisions/licenses/hashes; download into owned work paths; run actual generation with measured memory/time and visually inspect. Do not substitute templates or a smaller model as successful larger-model inference.
- [x] Preview controls: failing tests for settings placement and two-segment edit/preview state, then move persistent view options to Settings → Presentation, remove only the duplicate popup, and use clear keyboard-accessible light/dark button styles.
- [x] Automatic model lifecycle: persistent app-owned catalog/settings, sequential idle OFF AIR download after workspace ready, progress, explicit cancel/remove/re-enable. Test deletion remains disabled across restart and Settings close does not stop download; ON AIR interrupts jobs/downloads.
- [x] Editable design contract: validated bounded per-slide layout/visual-brief/palette/image prompt, stronger German drafting prompt and regression tests. Build six or more editable restrained compositions with contrast/margins, varied slide sequencing and image zones; preserve backwards draft envelopes and one Undo.
- [x] Native image job: pinned bundled native runtime, verified model pack, bounded CLI arguments without shell/model code execution, owned PNG outputs, actual progress, timeout/cancel/exit cleanup and resource checks. Test malicious input/paths and ON AIR interruption.
- [x] Draft integration: topic/notes → text/design → images sequentially; real previews/editing; discard cleans owned intermediates; explicit acceptance imports generated image assets then inserts one item, with no automatic live take or cloud upload. Handle partial failures without saved-document changes.
- [x] Model Settings UI: status, real size/progress, retry, remove, re-enable; persisted preferences shared across presentations/users on this device. Reuse existing permission and styling conventions.
- [x] Complete new UI/help/regional copy without weakening existing full31 checks. Root coding/review; any translation delegation only within the user's standing translation authorization.
- [ ] Full targeted and broad verification, actual native UI/output/data-lifecycle checks and large-model offline image proof; verify packaging/runtime contents for every supported target before any subsequent publication. Record limitations honestly. Latest user explicitly authorized normal publication; no further publication approval is required.

Every behavior change receives a failing regression before implementation. Keep code changes bounded to model services/shared contracts/draft rendering/Settings and toolbar controls. Do not alter visitor slide styles, output routing or live navigation as an incidental redesign.
