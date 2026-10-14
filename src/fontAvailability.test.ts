import {expect,it} from 'vitest';
import * as fonts from './fonts';
import {createServiceItem} from './store';
it('reports only unavailable fonts used in enabled visible text, without changing authored fonts',async()=>{
 const item=createServiceItem('content'),element=item.slides[0].elements[0];
 element.properties.fontFamily='Missing Font';
 const hidden={...element,id:'hidden',visible:false,properties:{...element.properties,fontFamily:'Unused'}};
 item.slides[0].elements.push(hidden);
 const probe=async(name:string)=>name==='Cera Pro';
 expect((fonts as any).findMissingFonts).toBeTypeOf('function');
 const result=await (fonts as any).findMissingFonts([item],probe);
 expect(result).toEqual({missing:['Missing Font'],unchecked:[]});
 expect(element.properties.fontFamily).toBe('Missing Font');
});
