import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {loadRegionalInterfacePack} from './resources';
import {resolveOperatorCopy} from './operatorCopy';

it('reuses a translated operator resource for an explicitly localized literal',async()=>{
  await loadRegionalInterfacePack('ruhr');
  expect(resolveOperatorCopy({language:'de',germanRegion:'ruhr'},'Element hinzufügen')).toBe('Element dazutun');
  expect(resolveOperatorCopy({language:'en',germanRegion:'ruhr'},'Element hinzufügen')).toBe('Add element');
});

it('retains unregistered source wording and performs single-pass placeholder replacement',()=>{
  expect(resolveOperatorCopy({language:'de',germanRegion:null},'Ergebnis: {value}',{value:'{other}'})).toBe('Ergebnis: {other}');
  expect(resolveOperatorCopy({language:'de',germanRegion:null},'Noch nicht erfasster Bedienungstext')).toBe('Noch nicht erfasster Bedienungstext');
});

it('translates a recognized IPC diagnostic without stripping unknown messages',()=>{
 const selection={language:'en' as const,germanRegion:null};
 expect(resolveOperatorCopy(selection,"Error invoking remote method 'example:action': Error: Element hinzufügen")).toBe('Add element');
 const unknown="Error invoking remote method 'example:action': Error: third-party detail";
 expect(resolveOperatorCopy(selection,unknown)).toBe(unknown);
 expect(resolveOperatorCopy(selection,'A note: Element hinzufügen')).toBe('A note: Element hinzufügen');
});

it('localizes only reviewed diagnostic templates and preserves captured detail literally',async()=>{
 expect(await loadRegionalInterfacePack('ruhr')).toBe(true);
 const pack=JSON.parse(readFileSync('shared/regional/packs/ruhr.json','utf8'));
 const detail='HTTP_403 {anotherPlaceholder}';
 const source="Error invoking remote method 'media:upload': Error: Medienupload: "+detail;
 expect(resolveOperatorCopy({language:'de',germanRegion:'ruhr'},source)).toBe(pack.ui.operatorSource_1b50cb3048447c22.replace('{value1}',detail));
 const unrelated='Ein Dokument mit Medienupload: '+detail;
 expect(resolveOperatorCopy({language:'de',germanRegion:'ruhr'},unrelated)).toBe(unrelated);
});
