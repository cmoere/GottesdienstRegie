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
