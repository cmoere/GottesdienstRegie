/** Operator labels only. Document shape IDs, names and geometry stay canonical. */
export const shapeControlGermanTemplates={
 shapeGalleryButton:'2D-OBJEKT',shapeGalleryTitle:'2D-Objekte',shapeGallerySearch:'2D-Objekte suchen …',
 shapeCategoryBasic:'Grundformen',shapeCategoryArrows:'Pfeile',shapeCategorySymbols:'Symbole',shapeCategoryChurch:'Kirche',shapeUnknown:'Unbekannte Form',
 shapeRectangle:'Rechteck',shapeRoundedRectangle:'Abgerundetes Rechteck',shapeEllipse:'Kreis / Ellipse',shapeTriangle:'Dreieck',shapeDiamond:'Raute',
 shapePentagon:'Fünfeck',shapeHexagon:'Sechseck',shapeOctagon:'Achteck',shapeParallelogram:'Parallelogramm',shapeTrapezoid:'Trapez',
 shapeArrowRight:'Pfeil rechts',shapeArrowLeft:'Pfeil links',shapeArrowUp:'Pfeil oben',shapeArrowDown:'Pfeil unten',shapeChevron:'Chevron',shapeDoubleArrow:'Doppelpfeil',
 shapeStar:'Stern',shapeBurst:'Strahlenform',shapeSpeechBubble:'Sprechblase',shapeHeart:'Herz',shapeLightning:'Blitz',shapeShield:'Schild',shapeCloud:'Wolke',
 shapeHome:'Haus',shapeMoon:'Halbmond',shapeSun:'Sonne',shapeCheck:'Haken',shapeInfo:'Information',shapeWarning:'Warnung',
 shapeCross:'Kreuz',shapeFish:'Fisch',shapeChurch:'Kirche',shapeBible:'Bibel',shapeCandle:'Kerze',shapeDove:'Taube',
} as const;
export const shapeControlEnglishTemplates:Record<keyof typeof shapeControlGermanTemplates,string>={
 shapeGalleryButton:'2D OBJECT',shapeGalleryTitle:'2D objects',shapeGallerySearch:'Search 2D objects …',
 shapeCategoryBasic:'Basic shapes',shapeCategoryArrows:'Arrows',shapeCategorySymbols:'Symbols',shapeCategoryChurch:'Church',shapeUnknown:'Unknown shape',
 shapeRectangle:'Rectangle',shapeRoundedRectangle:'Rounded rectangle',shapeEllipse:'Circle / ellipse',shapeTriangle:'Triangle',shapeDiamond:'Diamond',
 shapePentagon:'Pentagon',shapeHexagon:'Hexagon',shapeOctagon:'Octagon',shapeParallelogram:'Parallelogram',shapeTrapezoid:'Trapezoid',
 shapeArrowRight:'Right arrow',shapeArrowLeft:'Left arrow',shapeArrowUp:'Up arrow',shapeArrowDown:'Down arrow',shapeChevron:'Chevron',shapeDoubleArrow:'Double arrow',
 shapeStar:'Star',shapeBurst:'Starburst',shapeSpeechBubble:'Speech bubble',shapeHeart:'Heart',shapeLightning:'Lightning bolt',shapeShield:'Shield',shapeCloud:'Cloud',
 shapeHome:'House',shapeMoon:'Crescent moon',shapeSun:'Sun',shapeCheck:'Check mark',shapeInfo:'Information',shapeWarning:'Warning',
 shapeCross:'Cross',shapeFish:'Fish',shapeChurch:'Church',shapeBible:'Bible',shapeCandle:'Candle',shapeDove:'Dove',
};
export const shapeNameKeys:Readonly<Record<string,keyof typeof shapeControlGermanTemplates>>={
 rectangle:'shapeRectangle',rounded:'shapeRoundedRectangle',ellipse:'shapeEllipse',triangle:'shapeTriangle',diamond:'shapeDiamond',pentagon:'shapePentagon',
 hexagon:'shapeHexagon',octagon:'shapeOctagon',parallelogram:'shapeParallelogram',trapezoid:'shapeTrapezoid',arrow:'shapeArrowRight','arrow-left':'shapeArrowLeft',
 'arrow-up':'shapeArrowUp','arrow-down':'shapeArrowDown',chevron:'shapeChevron','double-arrow':'shapeDoubleArrow',star:'shapeStar',burst:'shapeBurst',speech:'shapeSpeechBubble',
 heart:'shapeHeart',lightning:'shapeLightning',shield:'shapeShield',cloud:'shapeCloud',home:'shapeHome',moon:'shapeMoon',sun:'shapeSun',check:'shapeCheck',
 info:'shapeInfo',warning:'shapeWarning',cross:'shapeCross',fish:'shapeFish',church:'shapeChurch',bible:'shapeBible',candle:'shapeCandle',dove:'shapeDove',
};
export const shapeCategoryKeys:Readonly<Record<string,keyof typeof shapeControlGermanTemplates>>={
 Grundformen:'shapeCategoryBasic',Pfeile:'shapeCategoryArrows',Symbole:'shapeCategorySymbols',Kirche:'shapeCategoryChurch',
};
