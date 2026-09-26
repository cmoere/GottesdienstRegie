import {describe,expect,it} from 'vitest';
import {canHideSlideContent} from './quickScreenAvailability';

describe('Ohne Text availability',()=>{
  it('is disabled for a slide without hideable content',()=>{
    expect(canHideSlideContent({elements:[]})).toBe(false);
  });
  it('is available for visible text but not for an image-only slide',()=>{
    expect(canHideSlideContent({elements:[{type:'text',visible:true}]})).toBe(true);
    expect(canHideSlideContent({elements:[{type:'image',visible:true}]})).toBe(false);
  });
  it('ignores hidden elements and background-only slides',()=>{
    expect(canHideSlideContent({elements:[{type:'text',visible:false}]})).toBe(false);
  });
});
