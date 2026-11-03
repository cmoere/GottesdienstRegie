export type SlideDraftRequest={topic:string;notes:string;count:number};
export type SlideDraft={title:string;body:string};
const safeText=(value:unknown,max:number)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value);
export function readSlideDraftRequest(value:unknown):SlideDraftRequest|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const data=value as Record<string,unknown>;
 if(Object.keys(data).some(key=>!['topic','notes','count'].includes(key))||!safeText(data.topic,400)||typeof data.notes!=='string'||data.notes.length>8000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data.notes)||typeof data.count!=='number'||!Number.isInteger(data.count)||data.count<1||data.count>8)return null;
 return{topic:(data.topic as string).trim(),notes:data.notes.trim(),count:data.count};
}
export function parseSlideDraft(text:string,count:number):SlideDraft[]{
 if(typeof text!=='string'||text.length>24000||!Number.isInteger(count)||count<1||count>8)throw Error('SLIDE_DRAFT_INVALID');
 let source=text.trim();
 if(source.startsWith('<think>')){const end=source.indexOf('</think>');if(end<0)throw Error('SLIDE_DRAFT_INVALID');source=source.slice(end+8).trim()}
 if(source.startsWith('```json')&&source.endsWith('```'))source=source.slice(7,-3).trim();
 let data:unknown;try{data=JSON.parse(source)}catch{throw Error('SLIDE_DRAFT_INVALID')}
 if(!data||typeof data!=='object'||(!Array.isArray(data)&&(Object.keys(data).length!==1||!Object.hasOwn(data,'slides'))))throw Error('SLIDE_DRAFT_INVALID');
 const slides=Array.isArray(data)?data:(data as {slides?:unknown}).slides;
 if(!Array.isArray(slides)||slides.length!==count)throw Error('SLIDE_DRAFT_INVALID');
 return slides.map(slide=>{
  if(!slide||typeof slide!=='object'||Object.keys(slide).length!==2||!safeText(slide.title,180)||!safeText(slide.body,1400))throw Error('SLIDE_DRAFT_INVALID');
  return{title:slide.title.trim(),body:slide.body.trim()};
 });
}
