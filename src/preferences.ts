import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language='de'|'en'|'nl'|'da'|'no';
export type ThemeMode='system'|'light'|'dark';

interface PreferencesState {
  language:Language;
  theme:ThemeMode;
  blackWhite:boolean;
  setLanguage:(language:Language)=>void;
  setTheme:(theme:ThemeMode)=>void;
  setBlackWhite:(blackWhite:boolean)=>void;
}

function detectedLanguage():Language{
  const code=typeof navigator==='undefined'?'de':navigator.language.toLowerCase().split('-')[0];
  if(code==='en'||code==='nl'||code==='da'||code==='no'||code==='nb'||code==='nn')return code==='nb'||code==='nn'?'no':code;
  return 'de';
}

export const usePreferences=create<PreferencesState>()(persist(set=>({
  language:detectedLanguage(),
  theme:'system',
  blackWhite:false,
  setLanguage:language=>set({language}),
  setTheme:theme=>set({theme}),
  setBlackWhite:blackWhite=>set({blackWhite})
}),{name:'gottesdienstregie.preferences'}));
