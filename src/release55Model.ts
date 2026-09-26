export function attachOutputRevision<T extends object>(value:T,revision:number):T&{_outputRevision:number}{
  return {...structuredClone(value),_outputRevision:revision};
}

export function numberSuggestions(max:number):number[]{
  return Array.from({length:Math.max(0,Math.min(176,Math.floor(max)||0))},(_,index)=>index+1);
}
