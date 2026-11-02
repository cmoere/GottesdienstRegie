import {expect,it} from 'vitest';import {correctGermanAnnouncementText} from './germanSpeechCorrections';
it('corrects only known German announcement typos and preserves source/names/links',()=>{
 const source='Herzlich willkomen zum Gottesdiens! Frau Müller, https://willkomen.de und max@willkomen.de.';
 expect(correctGermanAnnouncementText(source)).toBe('Herzlich willkommen zum Gottesdienst! Frau Müller, https://willkomen.de und max@willkomen.de.');expect(source).toContain('willkomen');
 expect(correctGermanAnnouncementText('WILLKOMEN! Die Veranstalung beginnt.')).toBe('WILLKOMMEN! Die Veranstaltung beginnt.');
 for(const text of ['Bielefeld · PGB · ON AIR','Bibel: Gott ist die Liebe.','Corbin Mörchen und Josias','Willkommenskreis','https://example.org/veranstalung?willkomen=1'])expect(correctGermanAnnouncementText(text)).toBe(text);
});
