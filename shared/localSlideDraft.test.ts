import {describe,it,expect} from 'vitest';
import {readSlideDraftRequest,parseSlideDraft} from './localSlideDraft';
describe('local slide drafting contract',()=>{
 it('bounds requests and preserves supplied German notes',()=>{
  expect(readSlideDraftRequest({topic:'Dankbarkeit',notes:'Für den Gottesdienst',count:3})).toEqual({topic:'Dankbarkeit',notes:'Für den Gottesdienst',count:3});
  for(const value of [{topic:'',notes:'',count:3},{topic:'x',notes:'',count:100},{topic:'x',notes:'x'.repeat(8001),count:2},{topic:'x',notes:'',count:2,url:'https://invalid'}])expect(readSlideDraftRequest(value)).toBeNull();
 });
 it('accepts only complete plain text model drafts, not executable content or truncated fallback',()=>{
  const valid=JSON.stringify({slides:[{title:'Danke sagen',body:'Wofür bist du heute dankbar?'}]});
  expect(parseSlideDraft(valid,1)).toEqual([{title:'Danke sagen',body:'Wofür bist du heute dankbar?'}]);
  for(const value of ['{slides:',valid.replace('Danke sagen','<script>alert(1)</script>'),JSON.stringify({slides:[{title:'x',body:'y',command:'run'}]}),JSON.stringify({slides:[{title:'x'.repeat(181),body:'y'}]})])expect(()=>parseSlideDraft(value,1)).toThrow();
  expect(()=>parseSlideDraft(valid,2)).toThrow();
 });
 it('normalizes a complete fenced array without accepting trailing model text',()=>{
  const array='[{"title":"Dankbarkeit","body":"Kleine gute Dinge wahrnehmen."}]';
  expect(parseSlideDraft('```json\n'+array+'\n```',1)).toEqual([{title:'Dankbarkeit',body:'Kleine gute Dinge wahrnehmen.'}]);
  expect(()=>parseSlideDraft(array+' explanation',1)).toThrow();
 });
});
