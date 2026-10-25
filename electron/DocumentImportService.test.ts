import {expect,it} from 'vitest';
import {readDocumentImportResult} from './DocumentImportService';
it('allows only bounded local document content and never executes active embedded data',()=>{
 const value={version:1,pages:[{title:'Notiz',body:'Text',images:[{src:'data:image/png;base64,YQ=='}]}],warnings:['Layout wird neu angeordnet.']};expect(readDocumentImportResult(value)).toEqual(value);
 expect(()=>readDocumentImportResult({...value,pages:[{...value.pages[0],images:[{src:'data:image/svg+xml;base64,YQ=='}]}]})).toThrow();
 expect(()=>readDocumentImportResult({...value,pages:[]})).toThrow();
 expect(()=>readDocumentImportResult({...value,pages:[{...value.pages[0],images:[{src:'https://example.org/tracker.png'}]}]})).toThrow();
});
