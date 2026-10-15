import {describe,it,expect} from 'vitest';
import {getHelpArticle,getHelpCatalog,helpLanguages,stableGerman} from './index';
import translated from './translated.json';
import {helpEnglish} from './english';
import {helpWest} from './localesWest';
import {helpEnhancementsEnglish} from './enhancementsEnglish';
import {legacyGerman} from './legacyGerman';
const extensionFiles=import.meta.glob<Record<string,{body:string;related:string[]}>>('./enhancements/*.json',{eager:true,import:'default'});

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
  it('does not mutate the imported source articles while assembling the catalog',()=>{
    expect(getHelpArticle('Erste Schritte','en')?.body).toContain('## Practical workflow');
    expect(helpEnglish['Erste Schritte'].body).not.toContain('## Practical workflow');
  });
  it('replaces legacy setup blocks for workflows whose key-entry UI no longer exists',()=>{
    for(const id of ['Erste Schritte','Unsplash']) {
      expect(getHelpArticle(id,'de')?.body).not.toContain(legacyGerman[id]);
      expect(getHelpArticle(id,'de')?.related?.length).toBeGreaterThan(0);
    }
  });
  it('provides localized practical sections and valid related topics in every language',()=>{
    for(const language of helpLanguages) {
      for(const article of getHelpCatalog(language).topics) {
        const headings=article.body.split('\n').filter(line=>line.startsWith('## '));
        expect(headings.length,`${language}: ${article.id}`).toBeGreaterThanOrEqual(2);
        expect(article.related?.length,`${language}: ${article.id}`).toBeGreaterThan(0);
        for(const id of article.related??[]) {
          expect(getHelpArticle(id,language),`${language}: ${article.id} → ${id}`).toBeDefined();
        }
        if(!['en','de','gsw'].includes(language)) {
          expect(headings,`${language}: ${article.id}`).not.toContain('## Practical workflow');
          expect(headings,`${language}: ${article.id}`).not.toContain('## Rehearsal and troubleshooting');
        }
      }
    }
  });
  it('preserves every extension ID and ordered related-topic mapping in static translations',()=>{
    expect(Object.keys(extensionFiles).map(file=>file.split('/').at(-1)!.replace('.json','')).sort())
      .toEqual(helpLanguages.filter(locale=>!['de','gsw','en'].includes(locale)).sort());
    for(const [file,pack] of Object.entries(extensionFiles)) {
      expect(Object.keys(pack).sort(),file).toEqual([...stableGerman].sort());
      for(const [id,article] of Object.entries(pack)) {
        expect(article.related,`${file}: ${id}`).toEqual(helpEnhancementsEnglish[id].related);
        expect(article.body,`${file}: ${id}`).not.toContain('\uFFFD');
      }
    }
  });
  it('uses Swiss spelling and handles unknown IDs and languages explicitly',()=>{
    expect(getHelpCatalog('gsw').topics.some(a=>a.body.includes('ß'))).toBe(false);
    expect(getHelpArticle('missing','de')).toBeUndefined();
    expect(getHelpCatalog('unknown')).toBe(getHelpCatalog('en'));
    expect(getHelpCatalog('constructor')).toBe(getHelpCatalog('en'));
  });
});
