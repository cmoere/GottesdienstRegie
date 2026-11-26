// Canonical preview geometry for earlier object IDs; existing CSS fill-only
// shapes retain their output geometry. Previously unsupported symbols get SVGs.
import {polygonPath,profilePoints,regularPoints,starPoints} from './objectGeometry';
export const legacyShapeGeometry:Record<string,string>={
 rounded:'M18 6h64q12 0 12 12v64q0 12-12 12H18Q6 94 6 82V18Q6 6 18 6Z',
 pentagon:polygonPath(regularPoints(5)),hexagon:polygonPath(regularPoints(6)),octagon:polygonPath(regularPoints(8)),
 parallelogram:'M22 6h72L78 94H6Z',trapezoid:'M22 6h56l16 88H6Z',
 'arrow-left':'M94 42H36V22L6 50l30 28V58h58Z','arrow-up':'M42 94V36H22L50 6l28 30H58v58Z','arrow-down':'M42 6v58H22l28 30 28-30H58V6Z',
 'double-arrow':'M6 50 30 22v20h40V22l24 28-24 28V58H30v20Z',chevron:polygonPath(profilePoints.chevron),star:polygonPath(starPoints(5)),burst:polygonPath(starPoints(12,32)),
 speech:polygonPath(profilePoints.speech),heart:polygonPath(profilePoints.heart),lightning:'M55 6 20 54h26L34 94l48-55H55Z',shield:polygonPath(profilePoints.shield),cloud:polygonPath(profilePoints.cloud),
 home:'M50 6 94 42H82v52H60V66H40v28H18V42H6Z',moon:polygonPath(profilePoints.moon),
 sun:polygonPath(starPoints(12,29)),
 check:'M6 50 20 36l20 20L80 8l14 14-54 66Z',info:'M50 6a44 44 0 1 0 0 88 44 44 0 1 0 0-88Z M44 22h12v12H44Z M44 42h12v36H44Z',
 warning:'M50 6 94 94H6Z M44 34h12v30H44Z M44 74h12v12H44Z',
 fish:'M8 50Q42 4 76 44L94 24v52L76 56Q42 96 8 50Z M60 40a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z',
 candle:'M30 40h40v54H30Z M50 6Q26 24 50 36 74 24 50 6Z',
 dove:'M6 46 36 50Q24 10 46 6l16 34 18-14 14 12-18 16Q66 86 32 80L6 94l16-26Z',
};
export const legacyVectorKinds=['arrow-left','arrow-up','arrow-down','double-arrow','sun','check','info','warning','fish','church','bible','candle','dove'];
