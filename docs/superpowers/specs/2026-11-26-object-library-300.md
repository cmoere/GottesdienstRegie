# 300 objects and shared color selection

User approved proceeding with the recommended projected 3D approach. Keep native SVG output, editable element properties and existing presentation IDs. No WebGL/model downloads or external assets.

Library totals: 60 basic forms, 50 arrows/connectors, 40 frames, 40 banners/bubbles, 50 symbols (including the existing church/Christmas/Easter categories), 60 spatial forms = 300. Retain all 77 existing IDs and their default geometry. New entries differ by actual geometry, not by color. Spatial forms are projected SVG solids with editable depth and projection angle, not freely orbitable meshes.

Library UI: searchable, categories, 2D/3D, favorites/recent and adjustable preview size; full names, keyboard dismissal and bounded modal layout. Favorites/recent persist locally. Static SVG previews must not start live rendering or access remote data.

Shared color picker for selected shape fill/outline: congregation palette, persisted favorites/recent, HEX and RGB entry, system picker, opacity, optional gradient for fill and EyeDropper when supported. Invalid text does not overwrite a valid saved color; cancel/reset restores values captured at opening. Primitive properties retain document compatibility. Keep existing undo and fill-off behavior.

Use shared vector paint rendering so previews and output agree. Existing shape rendering stays unchanged until an applicable setting is edited. Preserve stable saved metadata and accessible translated labels; new geometric terminology may use standard German in regional packs as in the preceding release.
