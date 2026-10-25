import type {usePresentation} from './store';
type StartState=ReturnType<typeof usePresentation.getState>;
function canonical(value:unknown):unknown{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,entry])=>[key,canonical(entry)]));
 return value;
}
function signature(state:StartState){
 return JSON.stringify(canonical({presentationId:state.presentationId,items:state.items,sections:state.sections,eventKey:state.eventLink?.eventKey,displayRoles:state.displayRoles,onAir:state.onAir,date:state.date,serviceTime:state.serviceTime,transitionDefault:state.transitionDefault,lyricScrolling:state.lyricScrolling}));
}
/** Startup-only semantic guard: reloaded references are harmless; actual output edits are not. */
export function captureLiveStartGuard(state:StartState){
 const expected=signature(state);
 return(current:StartState,permitted:boolean)=>permitted&&signature(current)===expected;
}
