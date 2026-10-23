import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const yaml=createRequire(import.meta.url)('js-yaml') as {load:(text:string)=>{jobs:Record<string,{needs?:string[];if?:string;steps:Array<{uses?:string;with?:{draft?:boolean};run?:string}>}>}};
it('keeps assets in a draft until every requested platform has succeeded',()=>{
 const workflow=yaml.load(readFileSync('.github/workflows/release.yml','utf8'));
 for(const platform of ['windows','macos','linux']){
  const upload=workflow.jobs[platform].steps.find(step=>step.uses?.startsWith('softprops/action-gh-release@'));
  expect(upload?.with?.draft).toBe(true);
 }
 const publish=workflow.jobs.publish;
 expect(publish.needs).toEqual(expect.arrayContaining(['prepare','windows','macos','linux']));
 expect(publish.if).toContain("needs.windows.result == 'success'");
 for(const platform of ['macos','linux']){expect(publish.if).toContain("needs."+platform+".result == 'success'");expect(publish.if).toContain("needs."+platform+".result == 'skipped'")}
 expect(publish.steps.some(step=>step.run?.includes('--draft=false'))).toBe(true);
});
