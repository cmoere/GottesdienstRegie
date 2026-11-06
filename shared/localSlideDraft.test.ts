import {describe,it,expect} from 'vitest';
import {readSlideDraftRequest,parseSlideDraft,parseSlideQuestions} from './localSlideDraft';
describe('local slide drafting contract',()=>{
 it('accepts controlled editable design briefs and local image prompts, preserving old text-only drafts',()=>{
  expect(readSlideDraftRequest({topic:'Gemeinschaft',notes:'',count:1,design:true})).toMatchObject({design:true});
  const draft={title:'Gemeinsam unterwegs',body:'Einander zuhören und füreinander da sein.',design:{layout:'split-left',accent:'#608f9a',imagePrompt:'A peaceful sunlit country path, no text, no people'}};
  expect(parseSlideDraft(JSON.stringify({slides:[draft]}),1)).toEqual([draft]);
  for(const design of [{...draft.design,layout:'javascript'},{...draft.design,imagePrompt:'<lora:../private:1>'},{...draft.design,accent:'url(secret)'},{...draft.design,command:'execute'}])expect(()=>parseSlideDraft(JSON.stringify({slides:[{...draft,design}]}),1)).toThrow();
 });
 it('only accepts bounded plain text clarification questions',()=>{
  expect(parseSlideQuestions('{"questions":[]}')).toEqual([]);
  expect(parseSlideQuestions('{"questions":["Wann beginnt der Gottesdienst?"]}')).toEqual(['Wann beginnt der Gottesdienst?']);
  for(const questions of [['<script>'],['a','b','c','d'],[null]])expect(()=>parseSlideQuestions(JSON.stringify({questions}))).toThrow();
 });
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
