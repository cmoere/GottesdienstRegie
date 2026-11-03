export type SlideDraftRequest={topic:string;notes:string;count:number;design?:boolean};
export const DRAFT_COMPOSITIONS=['cover','split-left','split-right','quote','statement','points','band','photo'] as const;
export type DraftComposition=typeof DRAFT_COMPOSITIONS[number];
export const DRAFT_ACCENTS=['#699f3e','#608f9a','#b6bec3'] as const;
export type SlideDraftDesign={layout:DraftComposition;accent:typeof DRAFT_ACCENTS[number];imagePrompt?:string};
export type SlideDraft={title:string;body:string;design?:SlideDraftDesign};
const safeText=(value:unknown,max:number)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value);
export function readSlideDraftRequest(value:unknown):SlideDraftRequest|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const data=value as Record<string,unknown>;
 if(Object.keys(data).some(key=>!['topic','notes','count','design'].includes(key))||!safeText(data.topic,400)||typeof data.notes!=='string'||data.notes.length>8000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data.notes)||typeof data.count!=='number'||!Number.isInteger(data.count)||data.count<1||data.count>8||(data.design!==undefined&&typeof data.design!=='boolean'))return null;
 return{topic:(data.topic as string).trim(),notes:data.notes.trim(),count:data.count,...(data.design!==undefined?{design:data.design as boolean}:{})};
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
  if(!slide||typeof slide!=='object'||Object.keys(slide).some(key=>!['title','body','design'].includes(key))||!safeText(slide.title,180)||!safeText(slide.body,1400))throw Error('SLIDE_DRAFT_INVALID');
  let design:SlideDraftDesign|undefined;
  if(slide.design!==undefined){
   const value=slide.design;
   if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!['layout','accent','imagePrompt'].includes(key))||!DRAFT_COMPOSITIONS.includes(value.layout)||!DRAFT_ACCENTS.includes(value.accent)||(value.imagePrompt!==undefined&&value.imagePrompt!==''&&!safeText(value.imagePrompt,900)))throw Error('SLIDE_DRAFT_INVALID');
   design={layout:value.layout,accent:value.accent,...(value.imagePrompt!==undefined?{imagePrompt:value.imagePrompt.trim()}:{})};
  }
  return{title:slide.title.trim(),body:slide.body.trim(),...(design?{design}:{})};
 });
}
