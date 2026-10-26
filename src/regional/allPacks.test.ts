import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {expect,it} from 'vitest';
import {regionalVariants,releaseRegionalVariants} from '../../shared/regional/catalog';
import {nativeBaseTemplates} from '../../shared/regional/nativeBase';
import {validateRegionalPack} from '../../shared/regional/validation';
import {germanBaseTemplates,getBaseTemplate,locales} from '../i18nBase';
import type {Language} from '../preferences';
import {regionalControlBaseTemplates,regionalControlEnglishTemplates,regionalControlOtherTemplates} from '../../shared/regional/interfaceBaseExtras';
it('has explicit operator-control/status translations in every existing base language, not just a fallback',()=>{
  const keys=['windowMinimize','windowExitFullscreen','windowClose','fontMissing','fontCheckIncomplete','livePreviewHeading','helpContents','helpRelatedTopics','communityDataOnlineUpdated','communityDataOnlineLoading','communityDataOfflineUpdated','communityDataOfflineUnknown','communityDataUnavailable','eventLinkPrompt','eventLinkUnselected','eventLinkFallbackTitle','eventLinkSaved','eventLinkMissing','eventLinkCancelled','eventLinkSelect','eventLinkChange','eventLinkTime','aiStatusCreating','aiStatusRetry','aiPhaseLight','aiPhaseColor','aiPhaseDepth','aiPhaseComposition','aiPhaseContrast','quickScreenNamePrompt','quickScreensExplanation','quickScreenActive','quickScreenInactive','quickScreenAdd','quickScreenName','quickScreenChurchLogo','quickScreenRemoveLogo','quickScreenDurationSeconds','quickScreenEndText','quickScreenTargets','quickScreenType','quickScreenImageLogo','quickScreenCountdown',"settingsExtraVersionDetails","settingsExtraInstalledAt","settingsExtraModifiedAt","settingsExtraFileSize","settingsExtraExecutable","settingsExtraPreviousVersion","settingsExtraRollback","settingsExtraRollbackConfirm","settingsExtraNoPrevious","settingsExtraAudioHelp","settingsExtraSpeakers","settingsExtraMicrophone","settingsExtraSystemDefault","settingsExtraVolume","settingsExtraInputGain","settingsExtraNoiseSuppression","settingsExtraEchoCancellation","settingsExtraTestSpeaker","settingsExtraTestMicrophone","settingsExtraStopTest","settingsExtraMicLevel","settingsExtraHighContrast","settingsExtraHighContrastHelp","settingsExtraLargeText","settingsExtraLargeTextHelp","settingsExtraStrongFocus","settingsExtraStrongFocusHelp","settingsExtraDyslexia","settingsExtraDyslexiaHelp","settingsExtraRollbackDownloading"] as const;
  const source=Object.fromEntries(keys.map(key=>[key,germanBaseTemplates[key]]));
  for(const language of Object.keys(locales) as Language[]){
    const authored=language==='de'?regionalControlBaseTemplates:language==='en'?regionalControlEnglishTemplates:regionalControlOtherTemplates[language];
    for(const key of keys)expect(Object.hasOwn(authored,key),`${language}.${key}`).toBe(true);
    const ui=Object.fromEntries(keys.map(key=>[key,getBaseTemplate(language,key)]));
    expect(validateRegionalPack({id:'ruhr',ui,native:{}},'ruhr',{ui:source,native:{}}),language).toEqual([]);
  }
});
it('preserves the31-ID resource catalog and requires complete authored UI/native namespaces for the released15',()=>{
  const directory=path.resolve('shared/regional/packs');
  expect(readdirSync(directory).filter(file=>file.endsWith('.json')).sort())
    .toEqual(regionalVariants.map(region=>`${region.id}.json`).sort());
  for(const {id} of releaseRegionalVariants){
    const pack=JSON.parse(readFileSync(path.join(directory,`${id}.json`),'utf8'));
    expect(validateRegionalPack(pack,id,{ui:germanBaseTemplates,native:nativeBaseTemplates}),id).toEqual([]);
    expect(Object.keys(pack.ui).sort(),id).toEqual(Object.keys(germanBaseTemplates).sort());
    expect(Object.keys(pack.native),id).toHaveLength(34);
    for(const text of [...Object.values(pack.ui),...Object.values(pack.native)]){
      expect(text,id).not.toMatch(/[\u200B\u200C\u200D\uFEFF]/);
    }
  }
});
