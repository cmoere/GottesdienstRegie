import {expect,it} from 'vitest';
import {importKeynoteXml} from './KeynoteXmlImport';
it('retains ordered legacy Keynote XML pages, paragraph breaks and hidden slides without reading entities',()=>{
 const result=importKeynoteXml('<key:presentation xmlns:key="http://developer.apple.com/namespaces/keynote2" xmlns:sf="http://developer.apple.com/namespaces/sf"><key:slide><sf:p>Titel</sf:p><sf:p>ÄÖÜ <sf:span>und Text</sf:span></sf:p></key:slide><key:slide hidden="true"><sf:p>Zweite Folie</sf:p></key:slide></key:presentation>');expect(result.pages.map(page=>page.body)).toEqual(['Titel\nÄÖÜ und Text','Zweite Folie']);expect(result.pages[1].hidden).toBe(true);expect(()=>importKeynoteXml('<!DOCTYPE a><presentation/>')).toThrow();
});
