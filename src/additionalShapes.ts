import type {ShapeDefinition} from './shapeCatalog';
import {framePath} from './frameGeometry';

// Filled geometry keeps holes transparent with the shared even-odd SVG renderer.
// Insets leave room for the existing editable outline without clipping the edge.
const entries:Array<[string,string,ShapeDefinition['category'],string]>=[
 ['semicircle','Halbkreis','Grundformen','M6 72a44 44 0 0 1 88 0Z'],
 ['quarter-circle','Viertelkreis','Grundformen','M6 6a88 88 0 0 1 88 88H6Z'],
 ['ring','Ring','Grundformen','M50 6a44 44 0 1 0 0 88 44 44 0 1 0 0-88Z M50 22a28 28 0 1 0 0 56 28 28 0 1 0 0-56Z'],
 ['arc','Bogen','Grundformen','M6 72a44 44 0 0 1 88 0H78a28 28 0 0 0-56 0Z'],
 ['plus','Pluszeichen','Grundformen','M38 6h24v32h32v24H62v32H38V62H6V38h32Z'],
 ['right-triangle','Rechtwinkliges Dreieck','Grundformen','M6 6 94 94H6Z'],
 ['capsule','Kapsel','Grundformen','M28 24h44a22 22 0 0 1 0 44H28a22 22 0 0 1 0-44Z'],
 ['teardrop','Tropfen','Grundformen','M50 6C40 25 16 45 16 62a34 32 0 0 0 68 0C84 45 60 25 50 6Z'],
 ['frame-rectangle','Rechteckiger Rahmen','Rahmen','M6 6h88v88H6Z M14 14h72v72H14Z'],
 ['frame-rounded','Abgerundeter Rahmen','Rahmen','M22 6h56a16 16 0 0 1 16 16v56a16 16 0 0 1-16 16H22A16 16 0 0 1 6 78V22A16 16 0 0 1 22 6Z M22 14h56a8 8 0 0 1 8 8v56a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8Z'],
 ['frame-oval','Ovaler Rahmen','Rahmen','M50 6a44 44 0 1 0 0 88 44 44 0 1 0 0-88Z M50 14a36 36 0 1 0 0 72 36 36 0 1 0 0-72Z'],
 ['frame-double','Doppelrahmen','Rahmen','M6 6h88v88H6Z M10 10h80v80H10Z M17 17h66v66H17Z M21 21h58v58H21Z'],
 ['frame-corners','Offener Eckrahmen','Rahmen','M6 32V6h26v6H12v20Z M68 6h26v26h-6V12H68Z M94 68v26H68v-6h20V68Z M32 94H6V68h6v20h20Z'],
 ['frame-hexagon','Sechseck-Rahmen','Rahmen','M28 6h44l22 44-22 44H28L6 50Z M33 14h34l18 36-18 36H33L15 50Z'],
 ['banner-ribbon','Banderole','Banner','M6 30h16v30h6v8H6l10-19Z M78 30h16L84 49l10 19H72v-8h6Z M22 22h56v38H22Z'],
 ['banner-pennant','Wimpel','Banner','M6 12h88v46L50 94 6 58Z'],
 ['banner-bookmark','Lesezeichen','Banner','M20 6h60v88L50 76 20 94Z'],
 ['banner-notched','Banner mit Einschnitten','Banner','M6 24h88L80 50l14 26H6l14-26Z'],
 ['banner-chevron','Pfeilbanner','Banner','M6 24h68l20 26-20 26H6l20-26Z'],
 ['banner-wave','Wellenbanner','Banner','M6 28Q28 12 50 28T94 28V72Q72 88 50 72T6 72Z'],
 ['heptagon','Siebeneck','Grundformen','M50 6 84 22 93 60 69 91 31 91 7 60 16 22Z'],
 ['decagon','Zehneck','Grundformen','M36 6h28l23 17 8 27-8 27-23 17H36L13 77 5 50l8-27Z'],
 ['kite','Drachenviereck','Grundformen','M50 6 90 38 50 94 10 38Z'],
 ['rounded-diamond','Abgerundete Raute','Grundformen','M43 9Q50 2 57 9L91 43Q98 50 91 57L57 91Q50 98 43 91L9 57Q2 50 9 43Z'],
 ['frame-diamond','Rautenrahmen','Rahmen',framePath('frame-diamond')!],
 ['frame-triangle','Dreiecksrahmen','Rahmen',framePath('frame-triangle')!],
 ['frame-octagon','Achteckrahmen','Rahmen',framePath('frame-octagon')!],
 ['frame-brackets','Klammerrahmen','Rahmen',framePath('frame-brackets')!],
 ['banner-flag','Fahnenbanner','Banner','M6 20h88L76 50l18 30H6Z'],
 ['banner-tab','Registerbanner','Banner','M6 30h24V14h40v16h24v56H6Z'],
 ['banner-ticket','Ticketbanner','Banner','M6 22h88v18a10 10 0 0 0 0 20v18H6V60a10 10 0 0 0 0-20Z'],
 ['banner-folded','Gefaltetes Banner','Banner','M6 28h20V16h48v12h20v56H74V72H26v12H6Z'],
];

export const additionalShapes:ShapeDefinition[]=entries.map(([kind,name,category,path])=>({kind,name,category,path,vector:true,viewBox:'0 0 100 100'}));
