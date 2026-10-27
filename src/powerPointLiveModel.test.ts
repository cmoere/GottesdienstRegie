import {expect,it} from 'vitest';
import {originalPowerPointRequest,readPowerPointSurface} from './powerPointLiveModel';
it('requires original mode, immutable hash and stable native slide ID, never a title or array index',()=>{
 const item={metadata:{importMode:'original',powerPointSourceHash:'a'.repeat(64)}};
 expect(originalPowerPointRequest(item,{sourceSlideId:'256'})).toEqual({sourceHash:'a'.repeat(64),slideId:256});
 expect(originalPowerPointRequest({...item,metadata:{...item.metadata,importMode:'editable-copy'}},{sourceSlideId:'256'})).toBeNull();
 const missingId={sourceSlideId:undefined,title:'256',order:256};expect(originalPowerPointRequest(item,missingId)).toBeNull();
 expect(originalPowerPointRequest(item,{sourceSlideId:'../256'})).toBeNull();
});
it('accepts only sanitized runtime binding fields for the composed native surface',()=>{
 const binding={sessionId:'a'.repeat(32),generation:'b'.repeat(32)};
 expect(readPowerPointSurface(binding)).toEqual(binding);
 expect(readPowerPointSurface({...binding,rootWindowHandle:'12'})).toBeNull();
 expect(readPowerPointSurface({sessionId:'bad',generation:'bad'})).toBeNull();
});
