# Additional slide shapes, frames and banners

Approved scope: extend the existing object gallery, prioritizing shapes, frames and banners. Keep the existing presentation format, editable fill/outline/size and shared gallery/output geometry.

## Approaches
Extend the current catalog (chosen): searchable individual objects, no new document type or dependency. A separate template library would suit whole-slide compositions but adds unnecessary UI for this request.

Add 20 objects: eight geometric shapes (semicircle, quarter circle, ring, arc, plus, right triangle, capsule, teardrop), six transparent frames (rectangle, rounded rectangle, oval, double, open corners, hexagon), six banners (ribbon, pennant, bookmark, notched, chevron, wave). Categories and names have German/English labels; other languages retain the existing fallback policy. Existing IDs and geometry remain unchanged.

New objects use the current vector renderer, including even-odd holes. The shape toolbar lists the same catalog as the gallery. No publication/version bump is part of this implementation request.

Acceptance: search and selection persist stable IDs; frames have transparent centers; all new paths render identically in gallery and output; fill/outline changes work; labels remain complete; existing shapes still work.

## Follow-up requested by user
Colors, outlines and thickness must be adjustable. Add a no-fill toggle retaining the saved color, with a visible default outline when needed. Add independent frame band width (1–24 in the normalized 100-unit coordinate system), preserving exact geometry of old saved frames unless width is explicitly edited. Add another twelve objects: four geometric shapes, four frames and four banners. Polygon outlines must follow the shape rather than a clipped rectangular CSS border. No new dependency or publication.
