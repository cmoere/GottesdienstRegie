export type AnnotationPoint={x:number;y:number};
export type AnnotationStroke={id:string;color:string;width:number;points:AnnotationPoint[]};
export type AnnotationState={revision:number;takeId:string;strokes:AnnotationStroke[]};
export const annotationColors=['#ff3b30','#699f3e','#ffffff','#000000','#ffd60a'] as const;
const finite=(value:unknown,min:number,max:number):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
export function readAnnotationStroke(value:unknown):AnnotationStroke|undefined{
 if(!value||typeof value!=='object'||Array.isArray(value))return;
 const v=value as AnnotationStroke;
 if(Object.keys(v).some(key=>!['id','color','width','points'].includes(key))||typeof v.id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(v.id)||!annotationColors.includes(v.color as any)||!finite(v.width,.001,.02)||!Array.isArray(v.points)||v.points.length<2||v.points.length>256)return;
 if(v.points.some(point=>!point||Object.keys(point).some(key=>!['x','y'].includes(key))||!finite(point.x,0,1)||!finite(point.y,0,1)))return;
 return structuredClone(v);
}
export function readAnnotationState(value:unknown):AnnotationState|null|undefined{
 if(value===null)return null;
 if(!value||typeof value!=='object'||Array.isArray(value))return;
 const v=value as AnnotationState;
 if(Object.keys(v).some(key=>!['revision','takeId','strokes'].includes(key))||!Number.isSafeInteger(v.revision)||v.revision<0||typeof v.takeId!=='string'||v.takeId.length>200||!Array.isArray(v.strokes)||v.strokes.length>40||v.strokes.some(stroke=>!readAnnotationStroke(stroke)))return;
 return structuredClone(v);
}
