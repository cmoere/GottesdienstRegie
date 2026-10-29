import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {expect,it} from 'vitest';
import {regionalVariants} from '../../shared/regional/catalog';
import {nativeBaseTemplates} from '../../shared/regional/nativeBase';
import {validateRegionalPack} from '../../shared/regional/validation';
import {germanBaseTemplates} from '../i18nBase';

const require=createRequire(import.meta.url);
const {checkDocumentationPacks}=require('../../scripts/check-regional-documentation.cjs');

it.each(regionalVariants)('$id covers every canonical interface and native-dialog key',region=>{
  const pack=JSON.parse(readFileSync(path.resolve('shared/regional/packs',`${region.id}.json`),'utf8'));
  expect(validateRegionalPack(pack,region.id,{ui:germanBaseTemplates,native:nativeBaseTemplates})).toEqual([]);
});

it('does not equate complete interface keys with complete regional documentation',()=>{
  const source={help:{start:{title:'Erste Schritte',body:'GottesdienstRegie vorbereiten.'}},helpUI:{title:'Hilfe'},releases:{'0.95':'Bedienoberfläche'}};
  const incomplete={ruhr:{id:'ruhr',help:source.help,helpUI:source.helpUI,releases:{}}};
  const result=checkDocumentationPacks([{id:'ruhr'}],source,incomplete);
  expect(result.complete).toBe(false);
  expect(result.issues).toContain('ruhr: releases.0.95: missing-text');
});
