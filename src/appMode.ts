export interface AppModeState{mode:'normal'|'test';onAir:boolean}
export const NORMAL_APP_MODE:AppModeState={mode:'normal',onAir:false};
export function setAppOnAir(state:AppModeState,onAir:boolean):AppModeState{return{...state,onAir}}
export function setAppTestMode(state:AppModeState,testMode:boolean):AppModeState{return{...state,mode:testMode?'test':'normal'}}
