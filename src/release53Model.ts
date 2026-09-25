export const MINIMUM_AI_GENERATION_MS=8_000;

type LiveItem={id:string;enabled:boolean;disabled?:boolean;slides:Array<{id:string;enabled:boolean}>};

export function firstActiveTarget(items:LiveItem[]){
  for(const item of items){
    if(!item.enabled||item.disabled)continue;
    const slide=item.slides.find(entry=>entry.enabled);
    if(slide)return{itemId:item.id,slideId:slide.id};
  }
  return null;
}

export function minimumGenerationDelay(startedAt:number,now:number){
  return Math.max(0,MINIMUM_AI_GENERATION_MS-(now-startedAt));
}
