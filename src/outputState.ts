import type {AppModeState} from './appMode';
export type OutputStateSnapshot={revision:number;slide:unknown|null;quick:unknown|null;appMode:AppModeState};
export function shouldApplyOutputState(currentRevision:number,incomingRevision:number){return Number.isFinite(incomingRevision)&&incomingRevision>currentRevision}
