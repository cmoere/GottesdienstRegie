import {describe,expect,it} from 'vitest';
import {paginateBibleVerses} from './bibleOverlayModel';

describe('paginateBibleVerses',()=>{
  it('keeps short passages on one page',()=>{
    expect(paginateBibleVerses(['16 Denn also hat Gott die Welt geliebt.'],220)).toEqual([['16 Denn also hat Gott die Welt geliebt.']]);
  });
  it('splits long passages only between verses',()=>{
    const pages=paginateBibleVerses(['16 '+ 'A'.repeat(130),'17 '+ 'B'.repeat(130),'18 Kurz'],220);
    expect(pages).toEqual([['16 '+ 'A'.repeat(130)],['17 '+ 'B'.repeat(130),'18 Kurz']]);
  });
});
