import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const require=createRequire(import.meta.url);
it('blocks v84 and later publications for either unreviewed interface texts or incomplete documentation',()=>{
  const {regionalPublicationIssues}=require('../../scripts/check-version84.cjs');
  expect(regionalPublicationIssues('0.83.0',['pending'],['missing'])).toEqual([]);
  expect(regionalPublicationIssues('0.84.0',['inventory: incomplete'],[])).toEqual(['inventory: incomplete']);
  expect(regionalPublicationIssues('0.84.0',[],['ruhr: missing text'])).toEqual(['ruhr: missing text']);
  expect(regionalPublicationIssues('0.85.0',[],['missing'])).toEqual(['missing']);
  expect(regionalPublicationIssues('0.84.0',[],[])).toEqual([]);
  expect(regionalPublicationIssues('invalid',[],[])).toEqual(['invalid release version']);
});
