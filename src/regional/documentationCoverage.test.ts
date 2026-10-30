import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const require=createRequire(import.meta.url);
it('never treats complete help alone as a complete regional edition',()=>{
  const {checkDocumentationPacks}=require('../../scripts/check-regional-documentation.cjs');
  const source={help:{live:{title:'LIVE',body:'Ausgabe prüfen.'}},helpUI:{title:'Hilfe'},releases:{'versions[0.83].title':'Updates'}};
  const report=checkDocumentationPacks([{id:'ruhr'},{id:'berlin'}],source,{ruhr:{id:'ruhr',...source,releases:{}}});
  expect(report.regions).toBe(2);
  expect(report.sourceHelpArticles).toBe(1);
  expect(report.sourceReleaseFields).toBe(1);
  expect(report.complete).toBe(false);
  expect(report.issues).toContain('ruhr: releases.versions[0.83].title: missing-text');
  expect(report.issues.some((issue:string)=>issue.includes('missing documentation pack'))).toBe(true);
});

it('checks the entire31-region catalog instead of ignoring formerly deferred documentation packs',()=>{
  const {checkDocumentationCorpus}=require('../../scripts/check-regional-documentation.cjs');
  const report=checkDocumentationCorpus();
  expect(report.regions).toBe(31);
  expect(report.sourceHelpArticles).toBe(63);
  expect(report.sourceReleaseFields).toBe(1628);
});
