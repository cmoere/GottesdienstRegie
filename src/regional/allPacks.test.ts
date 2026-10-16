import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {expect,it} from 'vitest';
import {regionalVariants} from '../../shared/regional/catalog';
import {nativeBaseTemplates} from '../../shared/regional/nativeBase';
import {validateRegionalPack} from '../../shared/regional/validation';
import {germanBaseTemplates} from '../i18nBase';
it('has all 31 explicitly authored UI and native namespaces with exact placeholders',()=>{
  const directory=path.resolve('shared/regional/packs');
  expect(readdirSync(directory).filter(file=>file.endsWith('.json')).sort())
    .toEqual(regionalVariants.map(region=>`${region.id}.json`).sort());
  for(const {id} of regionalVariants){
    const pack=JSON.parse(readFileSync(path.join(directory,`${id}.json`),'utf8'));
    expect(validateRegionalPack(pack,id,{ui:germanBaseTemplates,native:nativeBaseTemplates}),id).toEqual([]);
    expect(Object.keys(pack.ui),id).toHaveLength(196);
    expect(Object.keys(pack.native),id).toHaveLength(33);
    for(const text of [...Object.values(pack.ui),...Object.values(pack.native)]){
      expect(text,id).not.toMatch(/[\u200B\u200C\u200D\uFEFF]/);
    }
  }
});
