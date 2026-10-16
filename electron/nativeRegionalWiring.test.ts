import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {nativeBaseTemplates} from '../shared/regional/nativeBase';
it('connects every canonical native template to the desktop dialog/status surface',()=>{
  const main=readFileSync('electron/main.ts','utf8');
  const used=new Set([...main.matchAll(/nativeText\('([A-Za-z]+)'/g)].map(match=>match[1]));
  expect([...used].sort()).toEqual(Object.keys(nativeBaseTemplates).sort());
});
