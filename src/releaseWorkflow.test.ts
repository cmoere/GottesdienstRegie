import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const yaml=createRequire(import.meta.url)('js-yaml') as {load:(text:string)=>{jobs:Record<string,{needs?:string[];if?:string;steps:Array<{uses?:string;with?:{draft?:boolean};run?:string}>}>}};
it('keeps assets in a draft until every requested platform has succeeded',()=>{
 const workflow=yaml.load(readFileSync('.github/workflows/release.yml','utf8'));
 for(const platform of ['windows','macos','linux']){
  expect(workflow.jobs[platform].steps.some(step=>step.uses?.startsWith('softprops/action-gh-release@'))).toBe(false);
  expect(workflow.jobs[platform].steps.some(step=>step.uses?.startsWith('actions/upload-artifact@'))).toBe(true);
 }
 const publish=workflow.jobs.publish;
 expect(publish.needs).toEqual(expect.arrayContaining(['prepare','verify','windows','macos','linux']));
 expect(publish.if).toContain("needs.verify.result == 'success'");
 expect(workflow.jobs.verify.steps.some(step=>step.run?.includes('test:unit'))).toBe(true);
 expect(publish.if).toContain("needs.windows.result == 'success'");
 for(const platform of ['macos','linux']){expect(publish.if).toContain("needs."+platform+".result == 'success'");expect(publish.if).toContain("needs."+platform+".result == 'skipped'")}
 expect(publish.steps.some(step=>step.run?.includes('--draft=false'))).toBe(true);
 expect(publish.steps.some(step=>step.uses?.startsWith('actions/download-artifact@'))).toBe(true);
 const script=publish.steps.map(step=>step.run??'').join('\n');
 expect(script.indexOf('check-release-assets.cjs')).toBeLessThan(script.indexOf('--draft=false'));
 expect(script).toContain('gh release create');
 expect(script).toContain('gh release upload');
});
