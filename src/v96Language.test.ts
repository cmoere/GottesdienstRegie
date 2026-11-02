import {expect,it} from 'vitest';
import {languageOptionName} from './regional/languageOptionName';
import {regionalVariants} from '../shared/regional/catalog';
it('includes only the active German region in the German language label',()=>{
 for(const region of regionalVariants)expect(languageOptionName('de','Deutsch',{language:'de',germanRegion:region.id})).toBe('Deutsch · '+region.name);
 expect(languageOptionName('de','Deutsch',{language:'en',germanRegion:'ruhr'})).toBe('Deutsch');
 expect(languageOptionName('en','English',{language:'de',germanRegion:'ruhr'})).toBe('English');
 expect(languageOptionName('de','Deutsch',{language:'de',germanRegion:null})).toBe('Deutsch');
});
