const phaseKeys=['aiPhaseLight','aiPhaseColor','aiPhaseDepth','aiPhaseComposition','aiPhaseContrast'] as const;
export const AI_LOADING_VARIANTS=Object.freeze(Array.from({length:15},(_,index)=>({id:`phase-${index+1}`,labelKey:phaseKeys[index%phaseKeys.length]})));
export const nextLoadingVariant=(current:number,total:number)=>(current+1)%Math.max(1,total);
