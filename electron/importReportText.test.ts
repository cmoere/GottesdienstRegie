import {describe,expect,it} from 'vitest';
import {localizeImportWarning} from './importReportText';
import templates from '../shared/regional/importWarningTemplates.json';

describe('regional import report display',()=>{
 it('localizes known report warnings without modifying imported source data',()=>{
  const source=Object.freeze({title:'Meine Präsentation',warnings:Object.freeze(['Originalzeiten sind hinterlegt; die Kopie startet zur sicheren Prüfung mit manueller Navigation.','Folie 12 enthält keine unterstützten Text- oder Bildobjekte.'])});
  const key=Object.entries(templates).find(([,text])=>text===source.warnings[0])![0];
  const result=source.warnings.map(warning=>localizeImportWarning(warning,(id,values)=>'regional:'+id+':'+(values?.slide??'')));
  expect(result[0]).toBe('regional:'+key+':');
  expect(result[1]).toMatch(/^regional:importWarning_[a-f0-9]+:12$/);
  expect(source.title).toBe('Meine Präsentation');
  expect(source.warnings[1]).toBe('Folie 12 enthält keine unterstützten Text- oder Bildobjekte.');
 });
 it('preserves third-party warnings and refuses partial or injected matches',()=>{
  const copy=()=>{throw Error('must not translate unrelated content')};
  for(const warning of ['An imported document warning','Folie <script> enthält keine unterstützten Text- oder Bildobjekte.','Folie 12 enthält keine unterstützten Text- oder Bildobjekte. Nachsatz'])expect(localizeImportWarning(warning,copy)).toBe(warning);
 });
});
