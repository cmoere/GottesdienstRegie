import {shapeByKind} from './shapeCatalog';
import {useI18n} from './i18n';
import {shapeLabel} from './shapeLabels';
export function ShapeArtwork({kind,className}:{kind:string;className?:string}){const shape=shapeByKind(kind),{t}=useI18n();return <svg className={className} viewBox={shape.viewBox} role="img" aria-label={shapeLabel(kind,t)}><path d={shape.path}/></svg>}
