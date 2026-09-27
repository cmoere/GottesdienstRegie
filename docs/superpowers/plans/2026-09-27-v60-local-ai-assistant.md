# V60 Local AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free, local, offline-capable AI helper that answers questions and safely proposes or applies presentation changes without API keys.

**Architecture:** A platform-neutral assistant core builds redacted context, validates structured action plans, and executes approved plans atomically. Desktop and web adapters provide local model selection, download, and inference; a shared controller drives the chat sidebar, confirmation flow, cancellation, history, and errors.

**Tech Stack:** React 19, TypeScript, Zustand, Electron IPC, `@huggingface/transformers` 3.8.1, Vitest, Testing Library, existing platform service abstractions.

**Spec:** `docs/superpowers/specs/2026-09-27-v60-local-ai-assistant-design.md`

## Global Constraints

- Version target is `0.60.0`.
- No cloud AI, paid provider, or API key is permitted.
- Normal use works offline after the initial model download.
- Automatic model selection is the default; users may override it in settings.
- Confirmation before changes is the default; direct execution is optional.
- Every assistant mutation is atomic and creates exactly one undo snapshot.
- Personal notes, passwords, tokens, API keys, authentication data, and unnecessary local paths never enter model context.
- The assistant cannot switch ON AIR, publish, change accounts or permissions, delete files, or send external messages.
- Bible verse text comes only from the existing Bible provider.
- Desktop is the reference implementation; web exposes local inference only when supported and never falls back to cloud processing.
- `.superpowers/` is unrelated untracked workspace data and must not be staged or modified.

## Review Focus

- A low-memory device with no acceleration must select `eco` and remain responsive; Task 1 pins this with a deterministic profile-selection test.
- A crafted prompt or model response containing credentials, HTML, scripts, or unknown actions must not leak or execute; Tasks 2 and 3 pin this with redaction and strict-schema tests.
- A presentation changed after plan preview must reject the stale plan without partial edits; Task 4 pins this with a revision-conflict test.
- A cancelled or corrupt model download must leave no runnable partial package and allow retry; Task 5 pins this with cancellation and checksum tests.
- An unsupported browser must show a desktop recommendation instead of attempting inference or sending data elsewhere; Task 6 pins this with a web-capability test.

---

### Task 1: AI preferences and deterministic device profiles

**Files:**
- Create: `src/ai/modelProfiles.ts`
- Create: `src/ai/modelProfiles.test.ts`
- Modify: `src/preferences.ts`
- Test: `src/ai/modelProfiles.test.ts`

**Interfaces:**
- Consumes: existing persisted Zustand preferences.
- Produces: `AiModelPreference`, `AiExecutionMode`, `AiDeviceProfile`, `selectAiModelProfile(profile, override)`, and persisted `aiAssistant` settings.

- [ ] **Step 1: Write the failing profile-selection and preference-migration tests**

Test `selectAiModelProfile()` for low-memory/no-acceleration → `eco`, ordinary supported hardware → `balanced`, capable accelerated hardware → `quality`, and manual override precedence. Test migration defaults: `modelPreference: 'auto'`, `executionMode: 'confirm'`, media/translation/context enabled, chat deletion disabled.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/modelProfiles.test.ts`
Expected: FAIL because the model profile module and assistant preferences do not exist.

- [ ] **Step 3: Implement the profile contracts and preference state**

Add exact types:

```ts
export type AiModelProfile='eco'|'balanced'|'quality';
export type AiModelPreference='auto'|AiModelProfile;
export type AiExecutionMode='confirm'|'direct';
export interface AiDeviceProfile{memoryGb:number;logicalCores:number;freeStorageGb:number;acceleration:'none'|'webgpu'|'gpu'}
export function selectAiModelProfile(device:AiDeviceProfile,preference:AiModelPreference):AiModelProfile;
```

Add one persisted `aiAssistant` object and `setAiAssistant(patch)` to `PreferencesState`; increment the persisted preference version and preserve existing explicit values during migration.

- [ ] **Step 4: Run focused tests and the existing preference-dependent suite**

Run: `npx vitest run src/ai/modelProfiles.test.ts src/audioPreviewPolicy.test.ts src/release54Model.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/modelProfiles.ts src/ai/modelProfiles.test.ts src/preferences.ts
git commit -m "feat(ai): add local model profiles and preferences"
```

### Task 2: Minimal redacted presentation context

**Files:**
- Create: `src/ai/contextBuilder.ts`
- Create: `src/ai/contextBuilder.test.ts`
- Modify: `src/store.ts`
- Test: `src/ai/contextBuilder.test.ts`

**Interfaces:**
- Consumes: `PresentationDocument`, current item/slide/element IDs, `CloudMediaAsset[]`, language, and `includePresentationContext`.
- Produces: `AiAssistantContext` and `buildAiContext(input): AiAssistantContext`.

- [ ] **Step 1: Write failing context-minimization tests**

Assert that the selected slide and relevant structure are included, large presentations are bounded with selection priority, media contributes metadata but not local paths, and keys matching password/token/secret/authorization/API-key patterns plus personal notes are absent from serialized output.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/contextBuilder.test.ts`
Expected: FAIL because `buildAiContext` does not exist.

- [ ] **Step 3: Implement the context types and builder**

Expose:

```ts
export interface AiContextInput{document:PresentationDocument;selectedItemId?:string;selectedSlideId?:string;selectedElementIds?:string[];media?:CloudMediaAsset[];language:string;includePresentationContext:boolean}
export interface AiAssistantContext{presentation?:{title:string;sections:unknown[];items:unknown[]};selection?:unknown;media?:Array<{id:string;name:string;kind:string;tags:string[]}>;language:string;truncated:boolean}
export function buildAiContext(input:AiContextInput):AiAssistantContext;
```

Reuse the store's secret-key patterns through an exported `redactSensitiveValue()` helper instead of duplicating policy.

- [ ] **Step 4: Run the focused test**

Run: `npx vitest run src/ai/contextBuilder.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/contextBuilder.ts src/ai/contextBuilder.test.ts src/store.ts
git commit -m "feat(ai): build minimal redacted presentation context"
```

### Task 3: Strict assistant response and action-plan validation

**Files:**
- Create: `src/ai/actionSchema.ts`
- Create: `src/ai/actionSchema.test.ts`
- Test: `src/ai/actionSchema.test.ts`

**Interfaces:**
- Consumes: untrusted local-model output as `unknown`.
- Produces: `AiAssistantResponse`, `AiActionPlan`, `AiAction`, `parseAiAssistantResponse(value)`, and `AiActionValidationError`.

- [ ] **Step 1: Write failing strict-schema tests**

Cover valid answer-only responses; valid create/update/reorder/translate/media/Bible-reference/report actions; maximum text length, action count, and created-slide count; rejection of unknown fields/actions, ON AIR, publish, file deletion, account, external-message, HTML/script payloads, and model-supplied Bible verse text.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/actionSchema.test.ts`
Expected: FAIL because the schema parser does not exist.

- [ ] **Step 3: Implement discriminated action types and strict parsing**

Define only these action kinds for V60: `createItem`, `createSlide`, `replaceSlideText`, `updateTiming`, `reorderItem`, `prepareTranslation`, `suggestMedia`, `requestBiblePassage`, and `report`. Limit a plan to 50 actions, 20 created slides, and 5,000 characters per generated text field. `requestBiblePassage` contains reference and translation ID only.

- [ ] **Step 4: Run the focused test**

Run: `npx vitest run src/ai/actionSchema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/actionSchema.ts src/ai/actionSchema.test.ts
git commit -m "feat(ai): validate structured assistant actions"
```

### Task 4: Atomic action execution and stale-plan protection

**Files:**
- Create: `src/ai/actionExecutor.ts`
- Create: `src/ai/actionExecutor.test.ts`
- Modify: `src/store.ts`
- Test: `src/ai/actionExecutor.test.ts`

**Interfaces:**
- Consumes: `AiActionPlan`, current `PresentationDocument`, `baseRevision:number`, existing Bible and translation callbacks.
- Produces: `validateAiPlanAgainstDocument(plan, document)`, `applyAiActionPlan(plan, baseRevision)`, and store method `applyAiPlan(plan, baseRevision): AiApplyResult`.

- [ ] **Step 1: Write failing atomicity, undo, and conflict tests**

Assert that a multi-action plan changes items/slides in one operation, creates one history snapshot with `source:'ai'`, one undo restores the complete previous state, invalid target IDs apply nothing, Bible text is supplied only by the injected provider result, and a changed output revision rejects the entire stale plan.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/actionExecutor.test.ts`
Expected: FAIL because the executor and store entry point do not exist.

- [ ] **Step 3: Implement pure plan application and the single store mutation**

Keep plan transformation pure until every action validates. Add one `changed()` call for the final document patch and force one AI edit-history transaction. Do not call existing mutating store methods sequentially.

- [ ] **Step 4: Run focused and store regression tests**

Run: `npx vitest run src/ai/actionExecutor.test.ts src/mandatoryLoops.test.ts src/itemPlacementPolicy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/actionExecutor.ts src/ai/actionExecutor.test.ts src/store.ts
git commit -m "feat(ai): apply assistant plans atomically"
```

### Task 5: Local model manager and resilient package lifecycle

**Files:**
- Create: `src/ai/modelManifest.ts`
- Create: `src/ai/modelManifest.test.ts`
- Create: `electron/AiModelManager.ts`
- Create: `electron/AiModelManager.test.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/electron.d.ts`
- Test: `electron/AiModelManager.test.ts`

**Interfaces:**
- Consumes: selected `AiModelProfile`, the pinned local model manifest, Electron app-data directory, Hugging Face HTTPS assets, `AbortSignal`.
- Produces: `AiModelStatus`, `AiModelManager.status()`, `prepare(profile, signal, onProgress)`, `remove()`, and IPC methods `ai:model-status`, `ai:prepare-model`, `ai:cancel-model`, `ai:remove-model`.

- [ ] **Step 1: Write failing model lifecycle tests with a temporary directory and local response fixtures**

Cover the three exact profile entries, automatic package target, progress events, resume from a valid partial download, cancellation cleanup, checksum mismatch rejection, atomic promotion from `.partial` to installed directory, removal, and insufficient-storage error.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run electron/AiModelManager.test.ts`
Expected: FAIL because `AiModelManager` does not exist.

- [ ] **Step 3: Implement the manager and IPC bridge**

Add a versioned manifest containing these fixed, redistributable Apache-2.0 profiles:

| Profile | Repository and pinned revision | dtype | Selection floor |
|---|---|---|---|
| `eco` | `onnx-community/Qwen2.5-0.5B-Instruct@cc5cc01a65cc3ff17bdb73a7de33d879f62599b0` | `q4` | 4 GB RAM, CPU allowed |
| `balanced` | `onnx-community/Qwen2.5-1.5B-Instruct@6287331f475a3e20e8c879be8fd4bf3551ad9d34` | `q4` | 8 GB RAM, CPU or WebGPU |
| `quality` | `onnx-community/Qwen2.5-1.5B-Instruct@6287331f475a3e20e8c879be8fd4bf3551ad9d34` | `fp16` | 16 GB RAM and WebGPU/GPU |

Treat every profile as a bundle of the pinned tokenizer/configuration assets plus only the selected ONNX dtype files. Record every asset's byte size and SHA-256 in `modelManifest.ts`; verify those hashes before atomic installation. Include the upstream Apache-2.0 license and model attribution in the installed bundle and Settings UI. Store bundles under the app's user-data directory. Never treat `.partial` files as runnable. Expose progress as `{phase,receivedBytes,totalBytes,percent}` and typed error codes. Do not silently substitute another model, revision, or dtype.

- [ ] **Step 4: Run manager and bridge tests**

Run: `npx vitest run src/ai/modelManifest.test.ts electron/AiModelManager.test.ts src/platform/electron/createElectronServices.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/modelManifest.ts src/ai/modelManifest.test.ts electron/AiModelManager.ts electron/AiModelManager.test.ts electron/main.ts electron/preload.ts src/electron.d.ts
git commit -m "feat(ai): manage local model packages"
```

### Task 6: Platform inference services and web compatibility gate

**Files:**
- Create: `src/ai/AiInferenceService.ts`
- Create: `src/platform/electron/ElectronAiService.ts`
- Create: `src/platform/web/WebAiService.ts`
- Create: `src/platform/web/WebAiService.test.ts`
- Modify: `src/platform/types.ts`
- Modify: `src/platform/PlatformServices.ts`
- Modify: `src/platform/electron/createElectronServices.ts`
- Modify: `src/platform/web/createWebServices.ts`
- Modify: `src/platform/capabilities.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Test: `src/platform/web/WebAiService.test.ts`

**Interfaces:**
- Consumes: `AiInferenceRequest {system:string;prompt:string;context:AiAssistantContext;profile:AiModelProfile}`, progress callback, and `AbortSignal`.
- Produces: `AiInferenceService.generate(request, options):Promise<unknown>`, capability `localAi`, desktop IPC `ai:generate`/`ai:cancel-generation`, and web support detection.

- [ ] **Step 1: Write failing web capability and cancellation tests**

Assert that an unsupported browser returns `CapabilityUnavailableError('localAi', ...)`, never calls `fetch`, and recommends desktop; a supported adapter loads only a local cached model and honors abort.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/platform/web/WebAiService.test.ts src/platform/capabilities.test.ts`
Expected: FAIL because the `localAi` capability and services do not exist.

- [ ] **Step 3: Implement shared service contracts and platform adapters**

Use `@huggingface/transformers` behind the adapters. Run desktop inference outside the renderer UI thread. Web inference requires supported browser primitives and local model caching; do not add a remote generation endpoint.

- [ ] **Step 4: Run platform tests**

Run: `npx vitest run src/platform/web/WebAiService.test.ts src/platform/capabilities.test.ts src/platform/electron/createElectronServices.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/AiInferenceService.ts src/platform electron/main.ts electron/preload.ts
git commit -m "feat(ai): add local inference platform services"
```

### Task 7: Assistant controller, local chat history, and request lifecycle

**Files:**
- Create: `src/ai/assistantController.ts`
- Create: `src/ai/assistantController.test.ts`
- Create: `src/ai/assistantStore.ts`
- Test: `src/ai/assistantController.test.ts`

**Interfaces:**
- Consumes: inference service, context builder, parser, executor, preferences, presentation revision.
- Produces: `AiChatMessage`, `AiAssistantState`, `createAssistantController(dependencies)`, `send(prompt)`, `cancel()`, `retry()`, `confirm(planId)`, `reject(planId)`, `clearHistory()`.

- [ ] **Step 1: Write failing controller-state tests**

Cover answer-only chat, proposed plan in confirm mode without mutation, immediate atomic apply in direct mode, cancel, retry, structured parse failure, stale confirmation, five-second undo notification, single-writer enforcement, local history persistence, and clear-on-close behavior.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/assistantController.test.ts`
Expected: FAIL because the controller and store do not exist.

- [ ] **Step 3: Implement the controller and Zustand assistant store**

Keep model lifecycle and presentation mutation behind injected interfaces. Persist only local chat messages and preference-safe metadata; never persist raw model context.

- [ ] **Step 4: Run the focused test**

Run: `npx vitest run src/ai/assistantController.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/assistantController.ts src/ai/assistantController.test.ts src/ai/assistantStore.ts
git commit -m "feat(ai): orchestrate assistant requests and history"
```

### Task 8: Assistant sidebar and change-preview interface

**Files:**
- Create: `src/ai/AiAssistantPanel.tsx`
- Create: `src/ai/AiAssistantPanel.test.tsx`
- Create: `src/ai/AiChangePreview.tsx`
- Create: `src/ai/ai-assistant.css`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Test: `src/ai/AiAssistantPanel.test.tsx`

**Interfaces:**
- Consumes: Task 7 store/controller and Task 3 `AiActionPlan`.
- Produces: accessible responsive assistant panel, quick actions, message list, generation/download status, cancellation, retry, confirmation, rejection, and undo affordance.

- [ ] **Step 1: Write failing interaction tests**

Test opening/closing, focus return, prompt submission, quick actions, progress and percent, cancellation, retry button, grouped change preview, no mutation before confirmation, direct-mode result, and modal behavior below the mobile breakpoint.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npx vitest run src/ai/AiAssistantPanel.test.tsx`
Expected: FAIL because the panel does not exist.

- [ ] **Step 3: Implement the shared responsive panel and preview components**

Add one toolbar/menu entry named `KI-Helfer`. Desktop uses a collapsible right rail; narrow layouts use an aria-modal overlay. Do not use emoji or shadows. Announce progress and errors through an `aria-live` region.

- [ ] **Step 4: Run component and modal-interaction regressions**

Run: `npx vitest run src/ai/AiAssistantPanel.test.tsx src/PersonalNotesPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/AiAssistantPanel.tsx src/ai/AiAssistantPanel.test.tsx src/ai/AiChangePreview.tsx src/ai/ai-assistant.css src/App.tsx src/main.tsx
git commit -m "feat(ai): add assistant chat and change preview"
```

### Task 9: AI settings and model-management UI

**Files:**
- Create: `src/ai/AiSettings.tsx`
- Create: `src/ai/AiSettings.test.tsx`
- Modify: `src/App.tsx`
- Test: `src/ai/AiSettings.test.tsx`

**Interfaces:**
- Consumes: Task 1 preferences, Task 5 model status/actions, Task 6 platform capability.
- Produces: complete `Einstellungen → KI-Funktionen` panel.

- [ ] **Step 1: Write failing settings tests**

Assert automatic selection is default; manual eco/balanced/quality choices persist; confirm/direct mode persists; permissions persist; installed model version/size appear; update/remove/clear-history require appropriate confirmation; unsupported web shows compatibility copy and desktop link.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/AiSettings.test.tsx`
Expected: FAIL because the new settings component does not exist.

- [ ] **Step 3: Implement settings and replace the existing basic `aiEnabled` section**

Keep automatic profile choice visually primary and put technical details behind a disclosure. Model removal and history deletion use separate confirmation dialogs.

- [ ] **Step 4: Run settings and capability tests**

Run: `npx vitest run src/ai/AiSettings.test.tsx src/platform/CapabilityNotice.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/AiSettings.tsx src/ai/AiSettings.test.tsx src/App.tsx
git commit -m "feat(ai): add assistant and model settings"
```

### Task 10: Presentation-aware quick actions and trusted integrations

**Files:**
- Create: `src/ai/assistantPrompts.ts`
- Create: `src/ai/assistantPrompts.test.ts`
- Modify: `src/ai/assistantController.ts`
- Modify: `src/ai/actionExecutor.ts`
- Modify: `src/ai/AiAssistantPanel.tsx`
- Test: `src/ai/assistantPrompts.test.ts`

**Interfaces:**
- Consumes: selected presentation context, existing Bible provider, translation manager, and media metadata list.
- Produces: prompt templates for the specified quick actions and trusted resolution of Bible/translation/media requests.

- [ ] **Step 1: Write failing integration-prompt tests**

Assert each required quick action supplies purpose, selected scope, language, structured response contract, and relevant permission flag. Assert Bible actions resolve through the provider, media suggestions return only existing IDs, and disabled media/translation permissions suppress those tools.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/ai/assistantPrompts.test.ts`
Expected: FAIL because prompt templates and trusted resolvers do not exist.

- [ ] **Step 3: Implement quick-action templates and resolver wiring**

Include complete-service planning, shorten/rewrite, announcement slides, Bible/song suggestions, presentation audit, translation, media search, headings, moderation text, prayers, and style unification. Keep generated prayer and pastoral wording clearly labeled as editable suggestions.

- [ ] **Step 4: Run assistant integration tests**

Run: `npx vitest run src/ai/assistantPrompts.test.ts src/ai/assistantController.test.ts src/ai/actionExecutor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ai/assistantPrompts.ts src/ai/assistantPrompts.test.ts src/ai/assistantController.ts src/ai/actionExecutor.ts src/ai/AiAssistantPanel.tsx
git commit -m "feat(ai): add presentation-aware assistant tools"
```

### Task 11: V60 release integration and complete verification

**Files:**
- Create: `scripts/check-version60.cjs`
- Create: `src/version60.css` only if final cross-theme adjustments cannot remain in `src/ai/ai-assistant.css`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/release.yml`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `public/releases.json`
- Modify: `src/main.tsx` if `version60.css` is created

**Interfaces:**
- Consumes: all prior tasks.
- Produces: version `0.60.0`, release metadata, CI validation, and distributable desktop/web builds.

- [ ] **Step 1: Write the failing V60 release check**

Check package version, exactly one current release, V60 release copy, registered `localAi` capability, assistant panel, automatic profile selector, strict action parser, and no configured cloud-AI endpoint or API-key field.

- [ ] **Step 2: Run the release check and verify RED**

Run: `node scripts/check-version60.cjs`
Expected: FAIL until version and release metadata are updated.

- [ ] **Step 3: Add V60 metadata and CI check wiring**

Set `0.60.0`, mark only V60 current, document local/offline behavior and limitations, and append `check-version60.cjs` to local and CI release verification.

- [ ] **Step 4: Run complete verification**

Run: `npm run verify:release`
Expected: all unit and version checks pass.

Run: `npm run typecheck`
Expected: exit 0.

Run: `npm run build`
Expected: desktop renderer and Electron build exit 0.

Run: `npm run build:web`
Expected: web build exits 0 and contains no cloud-AI fallback.

- [ ] **Step 5: Perform focused manual acceptance**

Verify automatic first-use preparation, offline answer after installation, confirm-mode multi-change preview, direct mode, one-step undo, cancellation, model removal, narrow-screen overlay, unsupported-web explanation, and that personal notes never appear in captured model context.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/release.yml CHANGELOG.md RELEASE_NOTES.md package.json package-lock.json public/releases.json scripts/check-version60.cjs src/version60.css src/main.tsx
git commit -m "release: prepare version 0.60.0"
```
