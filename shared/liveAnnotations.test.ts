import {expect,it} from 'vitest';
import {readAnnotationStroke,readAnnotationState} from './liveAnnotations';
const stroke={id:'one',color:'#ff3b30',width:.004,points:[{x:0,y:0},{x:1,y:1}]};
it('accepts only bounded normalized strokes and returns detached data',()=>{
 expect(readAnnotationStroke(stroke)).toEqual(stroke);expect(readAnnotationStroke(stroke)).not.toBe(stroke);
 for(const value of [{...stroke,width:100},{...stroke,color:'url(x)'},{...stroke,points:[{x:0,y:NaN},{x:1,y:1}]},{...stroke,points:Array(257).fill({x:0,y:0})},{...stroke,private:'data'}])expect(readAnnotationStroke(value)).toBeUndefined();
 expect(readAnnotationState({revision:1,takeId:'slide:1',strokes:[stroke]})).toEqual({revision:1,takeId:'slide:1',strokes:[stroke]});
 expect(readAnnotationState({revision:1,takeId:'slide:1',strokes:Array(41).fill(stroke)})).toBeUndefined();
 expect(readAnnotationState(null)).toBeNull();
});
