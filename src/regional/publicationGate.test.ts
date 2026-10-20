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

it('permits only the disclosed0.84 partial scope and still blocks stale inventory, malformed resources and missing documents',()=>{
  const {regionalPublicationIssues}=require('../../scripts/check-version84.cjs');
  const partial={
    manifest:{schemaVersion:1,complete:false,regionIds:['bavarian-upper','bavarian-lower','upper-palatinate','east-franconian','swabian','baden-alemannic','south-baden-alemannic','palatine','rhine-hessian','south-hessian','cologne','ruhr','hamburg','berlin','bielefeld-ravensberg'],partialRelease:{version:'0.84.0',inventoryFingerprint:'a'.repeat(64),notice:'Regionalvarianten sind noch nicht vollständig übersetzt. Fehlende UI-Texte werden auf Hochdeutsch angezeigt.'}},
    inventory:{complete:false,sourceFingerprint:'a'.repeat(64),entries:[{key:'source.pending.1',status:'review-required'}]},
    disclosed:true,
  };
  const pending=['inventory: incomplete','inventory: source.pending.1 requires classification'];
  expect(regionalPublicationIssues('0.84.0',pending,[],partial)).toEqual([]);
  expect(regionalPublicationIssues('0.84.0',[...pending,'ruhr: missing ui.close'],[],partial)).toEqual(['ruhr: missing ui.close']);
  expect(regionalPublicationIssues('0.84.0',pending,['ruhr: missing help'],partial)).toEqual(['ruhr: missing help']);
  expect(regionalPublicationIssues('0.84.0',[...pending,'inventory: stale source fingerprint'],[],partial)).toEqual(['inventory: stale source fingerprint']);
  expect(regionalPublicationIssues('0.84.0',[...pending,'inventory: source.unapproved.1 requires classification'],[],partial)).toEqual(['inventory: source.unapproved.1 requires classification']);
  expect(regionalPublicationIssues('0.85.0',pending,[],partial)).not.toEqual([]);
  expect(regionalPublicationIssues('0.84.0',pending,[],{...partial,disclosed:false})).not.toEqual([]);
  expect(regionalPublicationIssues('0.84.0',pending,[],{...partial,inventory:{...partial.inventory,sourceFingerprint:'b'.repeat(64)}})).not.toEqual([]);
});
