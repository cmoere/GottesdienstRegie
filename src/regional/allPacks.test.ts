import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {expect,it} from 'vitest';
import {regionalVariants} from '../../shared/regional/catalog';
import {nativeBaseTemplates} from '../../shared/regional/nativeBase';
import {validateRegionalPack} from '../../shared/regional/validation';
import {germanBaseTemplates,getBaseTemplate,locales} from '../i18nBase';
import type {Language} from '../preferences';
import {regionalControlBaseTemplates,regionalControlEnglishTemplates,regionalControlOtherTemplates} from '../../shared/regional/interfaceBaseExtras';
it('has explicit operator-control/status translations in every existing base language, not just a fallback',()=>{
  const keys=['windowMinimize','windowExitFullscreen','windowClose','fontMissing','fontCheckIncomplete','livePreviewHeading','helpContents','helpRelatedTopics','communityDataOnlineUpdated','communityDataOnlineLoading','communityDataOfflineUpdated','communityDataOfflineUnknown','communityDataUnavailable'] as const;
  const source=Object.fromEntries(keys.map(key=>[key,germanBaseTemplates[key]]));
  for(const language of Object.keys(locales) as Language[]){
    const authored=language==='de'?regionalControlBaseTemplates:language==='en'?regionalControlEnglishTemplates:regionalControlOtherTemplates[language];
    for(const key of keys)expect(Object.hasOwn(authored,key),`${language}.${key}`).toBe(true);
    const ui=Object.fromEntries(keys.map(key=>[key,getBaseTemplate(language,key)]));
    expect(validateRegionalPack({id:'ruhr',ui,native:{}},'ruhr',{ui:source,native:{}}),language).toEqual([]);
  }
});
it('has all 31 explicitly authored UI and native namespaces with exact placeholders',()=>{
  const directory=path.resolve('shared/regional/packs');
  expect(readdirSync(directory).filter(file=>file.endsWith('.json')).sort())
    .toEqual(regionalVariants.map(region=>`${region.id}.json`).sort());
  for(const {id} of regionalVariants){
    const pack=JSON.parse(readFileSync(path.join(directory,`${id}.json`),'utf8'));
    expect(validateRegionalPack(pack,id,{ui:germanBaseTemplates,native:nativeBaseTemplates}),id).toEqual([]);
    expect(Object.keys(pack.ui),id).toHaveLength(209);
    expect(Object.keys(pack.native),id).toHaveLength(33);
    for(const text of [...Object.values(pack.ui),...Object.values(pack.native)]){
      expect(text,id).not.toMatch(/[\u200B\u200C\u200D\uFEFF]/);
    }
  }
});
