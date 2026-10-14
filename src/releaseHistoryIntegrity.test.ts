import {expect,it} from 'vitest';
import fs from 'node:fs';
import releases from '../public/releases.json';
import inventory from './test/fixtures/releases-v81-inventory.json';
it('preserves every historical release identity, date and order',()=>{
  const actual=releases.versions.filter(v=>inventory.some(old=>old.line===v.line)).map(v=>({line:v.line,builds:v.builds.map(b=>({version:b.version,releaseDate:b.releaseDate}))}));
  expect(actual).toEqual(inventory);expect(actual.flatMap(v=>v.builds)).toHaveLength(118);
});
it('makes all historical builds individually discoverable in the Markdown history',()=>{
  const notes=fs.readFileSync('RELEASE_NOTES.md','utf8');
  const versions=[...notes.matchAll(/^# GottesdienstRegie ([\d.]+)\s*$/gm)].map(match=>match[1]);
  for(const build of inventory.flatMap(v=>v.builds))expect(versions.filter(v=>v===build.version),build.version).toHaveLength(1);
});
