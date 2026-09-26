import {describe,expect,it} from 'vitest';
import {SUPPORTED_TERMS_LOCALES,termsDocument} from './termsContent';

describe('localized terms',()=>{
  it('provides a complete localized document for every supported locale',()=>{
    const german=termsDocument('de').sections;
    for(const locale of SUPPORTED_TERMS_LOCALES){
      const document=termsDocument(locale);
      expect(document.sections).toHaveLength(18);
      expect(document.sections.every(section=>section.title.trim()&&section.paragraphs.every(Boolean))).toBe(true);
      if(locale!=='de')expect(document.sections).not.toEqual(german);
    }
  });
});
