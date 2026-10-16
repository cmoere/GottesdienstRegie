import {readFileSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
import {getHelpCatalog} from '../help';
import {loadRegionalDocumentation,regionalDocumentationRuntime} from './documentationRuntime';
import {indexReleaseTextObjects,localizeReleaseText} from './releaseIdentity';
afterEach(()=>vi.unstubAllGlobals());
it('loads the complete authored Bavarian help/history offline without mutating German or other languages',async()=>{
  const releaseFile=JSON.parse(readFileSync('public/releases.json','utf8'));
  vi.stubGlobal('fetch',async(url:string)=>{
    expect(url).toBe('./releases.json');
    return {json:async()=>releaseFile};
  });
  const german=getHelpCatalog('de'),english=getHelpCatalog('en');
  const before=JSON.stringify(german);
  expect(await loadRegionalDocumentation('bavarian-upper')).toBe(true);
  const pack=regionalDocumentationRuntime.get({language:'de',germanRegion:'bavarian-upper'})!;
  expect(Object.keys(pack.help)).toHaveLength(63);expect(Object.keys(pack.releases)).toHaveLength(1446);
  const regional=getHelpCatalog('de','bavarian-upper');
  expect(regional.topics[0].title).toBe('SCHNELL LOSLEGEN');
  expect(regional.topics.map(topic=>topic.id)).toEqual(german.topics.map(topic=>topic.id));
  expect(getHelpCatalog('en','bavarian-upper')).toBe(english);
  expect(JSON.stringify(german)).toBe(before);
  const value=releaseFile.versions[0].builds[0].overview.label;
  const identity=indexReleaseTextObjects(releaseFile).paths.get(value)!;
  expect(localizeReleaseText(value,'de',identity,pack.releases)).toBe(pack.releases[identity]);
});
