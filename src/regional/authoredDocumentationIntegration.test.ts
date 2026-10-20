import {readFileSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
import {getHelpCatalog} from '../help';
import {loadRegionalDocumentation,regionalDocumentationRuntime} from './documentationRuntime';
import {indexReleaseTextObjects,localizeReleaseText} from './releaseIdentity';
afterEach(()=>vi.unstubAllGlobals());
it.each(['bavarian-upper','ruhr','bielefeld-ravensberg','berlin','hamburg','cologne','bavarian-lower','upper-palatinate','swabian','east-franconian','baden-alemannic','palatine','south-baden-alemannic','rhine-hessian','south-hessian'] as const)('loads complete authored %s help/history offline without mutating other languages',async id=>{
  const releaseFile=JSON.parse(readFileSync('public/releases.json','utf8'));
  vi.stubGlobal('fetch',async(url:string)=>{
    expect(url).toBe('./releases.json');
    return {json:async()=>releaseFile};
  });
  const german=getHelpCatalog('de'),english=getHelpCatalog('en');
  const before=JSON.stringify(german);
  expect(await loadRegionalDocumentation(id)).toBe(true);
  const pack=regionalDocumentationRuntime.get({language:'de',germanRegion:id})!;
  expect(Object.keys(pack.help)).toHaveLength(german.topics.length);
  expect(Object.keys(pack.releases)).toHaveLength(Object.keys(indexReleaseTextObjects(releaseFile).texts).length);
  const regional=getHelpCatalog('de',id);
  expect(regional.topics[0].body).not.toBe(german.topics[0].body);
  expect(regional.topics.map(topic=>topic.id)).toEqual(german.topics.map(topic=>topic.id));
  expect(getHelpCatalog('en',id)).toBe(english);
  expect(JSON.stringify(german)).toBe(before);
  const value=releaseFile.versions[0].builds[0].overview.label;
  const identity=indexReleaseTextObjects(releaseFile).paths.get(value)!;
  expect(localizeReleaseText(value,'de',identity,pack.releases)).toBe(pack.releases[identity]);
});
