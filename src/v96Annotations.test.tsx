import {expect,it,afterEach} from 'vitest';import {cleanup,render} from '@testing-library/react';import {readAnnotationStroke} from '../shared/liveAnnotations';import {LiveAnnotationOverlay} from './LiveAnnotations';
afterEach(cleanup);
it('validates bounded live tools and renders their actual vector geometry',()=>{
 for(const [tool,selector]of [['line','line'],['arrow','line[marker-end]'],['rectangle','rect'],['ellipse','ellipse']]){const stroke={id:'shape',tool,color:'#ff3b30',width:.004,points:[{x:.1,y:.2},{x:.8,y:.7}]};expect(readAnnotationStroke(stroke)).toEqual(stroke);const view=render(<LiveAnnotationOverlay state={{revision:1,takeId:'live:1',strokes:[stroke as any]}}/>);expect(view.container.querySelector(selector)).not.toBeNull();view.unmount();expect(readAnnotationStroke({...stroke,points:[...stroke.points,{x:.2,y:.3}]})).toBeUndefined()}
 expect(readAnnotationStroke({id:'x',tool:'image',color:'#ff3b30',width:.004,points:[{x:0,y:0},{x:1,y:1}]})).toBeUndefined();
});
