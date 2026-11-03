# v98 extension: automatic local AI and clearer controls

Status: approved in principle; user chose larger models/higher image quality over the recommended compact profile on 3 November 2026. Existing v98 reliability fixes are committed separately as 7e92e76 and remain unpublished.

## Requested behavior

- Download required local AI models automatically; provide removal in Settings. A deliberate removal disables automatic redownload until the user explicitly re-enables it.
- Produce genuinely generated local images/motifs as well as improved editable slide designs. The user selected images in addition to text/colors/shapes. No external AI account, API key or separate installation.
- Move preview/overview view options into the main Settings dialog, preserving saved options.
- Replace the crowded three-control Edit/Preview switch with two clearly selected, keyboard-accessible segments. Preserve visitor designs and live state.

## User-selected quality approach

The current machine has approximately 8 GB system RAM. Keep preparation sequential and OFF AIR: topic/notes → structured German content and visual brief → validated editable layouts → local image generation → preview/edit → explicit insertion with one Undo. Do not load models or start inference at application startup. Automatic downloads begin only after workspace readiness while OFF AIR; cancel/pause background work before actual outputs start.

Evaluate a stronger text/design model on the existing native runtime and an SDXL-class image model on a pinned native stable-diffusion.cpp runtime. Prefer higher image quality and larger downloads as explicitly selected by the user. Verify exact revisions, sizes, checksums, licensing, measured memory/time and real generated image quality before adoption. Keep models sequential and unloaded between stages; report insufficient memory honestly rather than silently substituting the compact image model or inventing generated assets. No promise of acceptable speed or image quality before native measurements.

The layout generator should use controlled editable primitives rather than flatten text into the generated image: title/body, image/text split, quotation, large title, structured points and restrained church-appropriate themes. Use the existing palette (#699f3e, #608f9a, #b6bec3), generous margins and checked text contrast. Generated pictures are image assets; text, colors, shapes and geometry remain editable. Repeated slides should not all receive the same composition. Validate bounds, text limits, image requests and outputs; never execute arbitrary model-supplied code/HTML.

## Settings and lifecycle

Settings → Presentation → Local AI models: separate text/design and image model status, total/local size, real download progress, cancel/retry, remove/re-enable. Removal persists across restarts and does not trigger an immediate automatic download. A cancelled or corrupt download never becomes ready. Closing Settings does not cancel an application-owned download. No hidden conversion of OFF AIR/test/normal modes; LIVE remains higher priority. Models run sequentially in isolated native jobs and are stopped before ON AIR. User-visible media is retained only on explicit draft acceptance; discarded intermediate pictures are cleaned from owned temporary storage.

Settings → Presentation → View: thumbnail size, show slide titles, show next slide. Remove only the duplicate toolbar popup; retain single/grid navigation. Existing saved values migrate without reset.

Edit/Preview: a single two-segment group with selected state, consistent dimensions, visible focus, adequate contrast and touch targets in light/dark themes and narrow windows. Existing edit/preview actions and permissions remain unchanged.

## Verification

Lifecycle and removal/automatic-redownload tests, ON AIR interruption, multiple background callers, staged asset cleanup, valid structured text/layout contracts and single Undo. Real offline native image test, measured RAM/time on this machine and visual inspection of resulting images and editable slide layouts. Native settings/toolbar layout checks, no visitor-design changes, complete current regional copy, full build and relevant regressions. The latest user explicitly authorized completion and normal publication after verification.

Sources checked 3 November 2026: https://github.com/leejet/stable-diffusion.cpp ; https://github.com/leejet/stable-diffusion.cpp/blob/master/docs/quantization_and_gguf.md ; https://huggingface.co/second-state/stable-diffusion-v1-5-GGUF .
