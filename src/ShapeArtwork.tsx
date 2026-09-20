import {shapeByKind} from './shapeCatalog';
export function ShapeArtwork({kind,className}:{kind:string;className?:string}){const shape=shapeByKind(kind);return <svg className={className} viewBox={shape.viewBox} role="img" aria-label={shape.name}><path d={shape.path}/></svg>}
