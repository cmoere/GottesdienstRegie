import {describe,it,expect} from 'vitest';
import {getHelpArticle,getHelpCatalog,helpLanguages,stableGerman} from './index';
import translated from './translated.json';
import {helpEnglish} from './english';
import {helpWest} from './localesWest';

describe('offline help catalog',()=>{
  it('preserves stable selection IDs without duplicates',()=>{
    expect(new Set(stableGerman).size).toBe(stableGerman.length);
    expect(stableGerman).toContain('Erste Schritte');
    expect(stableGerman).toContain('Servicezeit & Verspätung');
    expect(stableGerman.length).toBeGreaterThanOrEqual(63);
  });
  for(const language of helpLanguages) {
    it(`provides substantive articles and translated UI for ${language}`,()=>{
      const catalog=getHelpCatalog(language);
      expect(catalog.topics.map(a=>a.id)).toEqual(stableGerman);
      expect(Object.values(catalog.ui).every(text=>text.length>0)).toBe(true);
      for(const article of catalog.topics) {
        expect(article.title,article.id).toBeTruthy();
        expect(article.body.length,article.id).toBeGreaterThan(250);
        expect(article.body,article.id).toContain('\n\n');
        expect(getHelpArticle(article.id,language)).toBe(article);
        if(language!=='en') expect(article.body,article.id).not.toBe(helpEnglish[article.id].body);
      }
    });
  }
  it('contains complete static translation packs without an English fallback',()=>{
    for(const pack of [...Object.values(translated),...Object.values(helpWest)]) {
      expect(Object.keys(pack).sort()).toEqual([...stableGerman].sort());
    }
  });
  it('uses Swiss spelling and handles unknown IDs and languages explicitly',()=>{
    expect(getHelpCatalog('gsw').topics.some(a=>a.body.includes('ß'))).toBe(false);
    expect(getHelpArticle('missing','de')).toBeUndefined();
    expect(getHelpCatalog('unknown')).toBe(getHelpCatalog('en'));
  });
});
