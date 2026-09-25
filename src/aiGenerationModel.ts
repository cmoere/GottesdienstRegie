export const AI_LOADING_VARIANTS=Object.freeze(Array.from({length:15},(_,index)=>({id:`phase-${index+1}`,label:['Licht','Farbe','Tiefe','Komposition','Kontrast'][index%5]})));
export const nextLoadingVariant=(current:number,total:number)=>(current+1)%Math.max(1,total);
