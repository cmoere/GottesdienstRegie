import { useEffect, useSyncExternalStore } from 'react';
import { usePreferences } from './preferences';
import { locales, type Translator } from './i18nBase';
import { loadRegionalInterfacePack, regionalResourceStore, resolveRegionalText } from './regional/resources';
import {loadRegionalDocumentation,regionalDocumentationRuntime} from './regional/documentationRuntime';
import {resolveOperatorCopy} from './regional/operatorCopy';

export { locales, translate } from './i18nBase';
export type { TranslationKey, Translator } from './i18nBase';

// Async actions may retain this function across renders. Read the selected
// interface at invocation time; resource subscriptions still drive UI renders.
const currentOperatorCopy=(source:string,values:Record<string,string|number>={})=>
  resolveOperatorCopy(usePreferences.getState(),source,values);

export function useI18n(){
  const language=usePreferences(state=>state.language);
  const germanRegion=usePreferences(state=>state.germanRegion);
  useSyncExternalStore(regionalResourceStore.subscribe,regionalResourceStore.getSnapshot,regionalResourceStore.getSnapshot);
  useSyncExternalStore(regionalDocumentationRuntime.subscribe,regionalDocumentationRuntime.getSnapshot,regionalDocumentationRuntime.getSnapshot);
  useEffect(()=>{
    if(language==='de'&&germanRegion){void loadRegionalInterfacePack(germanRegion);void loadRegionalDocumentation(germanRegion)}
  },[language,germanRegion]);
  const t:Translator=(key,values)=>resolveRegionalText({language,germanRegion},key,values);
  const tx=currentOperatorCopy;
  return {language,germanRegion,locale:locales[language],t,tx};
}
