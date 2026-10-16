import { useEffect, useSyncExternalStore } from 'react';
import { usePreferences } from './preferences';
import { locales, type Translator } from './i18nBase';
import { loadRegionalInterfacePack, regionalResourceStore, resolveRegionalText } from './regional/resources';
import {loadRegionalDocumentation,regionalDocumentationRuntime} from './regional/documentationRuntime';

export { locales, translate } from './i18nBase';
export type { TranslationKey, Translator } from './i18nBase';

export function useI18n(){
  const language=usePreferences(state=>state.language);
  const germanRegion=usePreferences(state=>state.germanRegion);
  useSyncExternalStore(regionalResourceStore.subscribe,regionalResourceStore.getSnapshot,regionalResourceStore.getSnapshot);
  useSyncExternalStore(regionalDocumentationRuntime.subscribe,regionalDocumentationRuntime.getSnapshot,regionalDocumentationRuntime.getSnapshot);
  useEffect(()=>{
    if(language==='de'&&germanRegion){void loadRegionalInterfacePack(germanRegion);void loadRegionalDocumentation(germanRegion)}
  },[language,germanRegion]);
  const t:Translator=(key,values)=>resolveRegionalText({language,germanRegion},key,values);
  return {language,germanRegion,locale:locales[language],t};
}
