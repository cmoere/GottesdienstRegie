import {shapeByKind} from './shapeCatalog';
import {memo} from 'react';
import {useI18n} from './i18n';
import {shapeLabel} from './shapeLabels';
import {ShapePaths} from './ShapeVector';
export const ShapeArtwork=memo(function ShapeArtwork({kind,className}:{kind:string;className?:string}){const shape=shapeByKind(kind),{t}=useI18n();return <svg className={className} viewBox={shape.viewBox} role="img" aria-label={shapeLabel(kind,t)}><ShapePaths shape={shape} preview/></svg>});
