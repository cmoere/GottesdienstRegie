export const MINIMUM_AI_GENERATION_MS=8_000;

type LiveItem={id:string;sectionId:string;order?:number;enabled:boolean;disabled?:boolean;slides:Array<{id:string;enabled:boolean;order?:number}>};

export function firstActiveTarget(items:LiveItem[]){
  const priority=new Map([['pre',0],['warmup',1],['service',2],['post',3]]);
  const ordered=items.map((item,index)=>({item,index})).sort((left,right)=>(priority.get(left.item.sectionId)??4)-(priority.get(right.item.sectionId)??4)||(left.item.order??left.index)-(right.item.order??right.index));
  for(const {item} of ordered){
    if(!item.enabled||item.disabled)continue;
    const slide=[...item.slides].sort((a,b)=>(a.order??0)-(b.order??0)).find(entry=>entry.enabled);
    if(slide)return{itemId:item.id,slideId:slide.id};
  }
  return null;
}

export function minimumGenerationDelay(startedAt:number,now:number){
  return Math.max(0,MINIMUM_AI_GENERATION_MS-(now-startedAt));
}
