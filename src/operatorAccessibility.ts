export type OperatorScale=0|1|2|3|4;
const factors=[.85,.925,1,1.1,1.2] as const;
export function normalizeOperatorScale(value:number):OperatorScale{return Math.min(4,Math.max(0,Math.round(value))) as OperatorScale}
export function operatorScaleFactor(value:number){return factors[normalizeOperatorScale(value)]}
export function effectiveOperatorScale(value:number,output:boolean){return output?1:operatorScaleFactor(value)}
