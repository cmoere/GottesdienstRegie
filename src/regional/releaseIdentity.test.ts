import {expect,it} from 'vitest';
import {indexReleaseTextObjects,localizeReleaseText} from './releaseIdentity';
it('distinguishes identical titles by version and retains the original release objects',()=>{
  const titleA={de:'Korrekturen',en:'Fixes'},titleB={de:'Korrekturen',en:'Fixes'};
  const data={versions:[{line:'0.83',builds:[{version:'0.83.0',overview:{label:titleA}}]},{line:'0.82',builds:[{version:'0.82.0',overview:{label:titleB}}]}]};
  const before=JSON.stringify(data),index=indexReleaseTextObjects(data);
  expect(index.paths.get(titleA)).toBe('versions[0.83].builds[0.83.0].overview.label');
  expect(index.paths.get(titleB)).toBe('versions[0.82].builds[0.82.0].overview.label');
  expect(Object.keys(index.texts)).toHaveLength(2);expect(JSON.stringify(data)).toBe(before);
});
it('uses a regional release only for its exact stable path and leaves unknown remote releases as source text',()=>{
  const value={de:'Änderung',en:'Change'},translations={'versions[0.83].title':'Änderung für dich'};
  expect(localizeReleaseText(value,'de','versions[0.83].title',translations)).toBe('Änderung für dich');
  expect(localizeReleaseText(value,'en','versions[0.83].title',translations)).toBe('Change');
  expect(localizeReleaseText(value,'de','versions[0.99].title',translations)).toBe('Änderung');
});
