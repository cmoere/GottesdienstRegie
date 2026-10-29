import {expect,it} from 'vitest';
import {germanBaseTemplates,getBaseTemplate} from '../i18nBase';

it('owns session and shell labels as translatable resources with sentence case',()=>{
  expect(germanBaseTemplates).toMatchObject({operatorAddElement:'Element hinzufügen',operatorSongLibrary:'Songbibliothek',operatorTestStart:'Testbetrieb starten',operatorTestEnd:'Testbetrieb beenden',operatorSaving:'Wird gespeichert …',operatorSaveError:'Speicherfehler',operatorSaved:'Gespeichert ✓'});
  expect(getBaseTemplate('en','operatorTestStart' as never)).toBe('Start test mode');
});
