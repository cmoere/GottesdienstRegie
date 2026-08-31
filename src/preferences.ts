import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language='de'|'gsw'|'en'|'nl'|'da'|'no'|'es'|'uk'|'ru'|'tr'|'ar'|'pl';
export type ThemeMode='system'|'light'|'dark';

interface PreferencesState {
  language:Language;
  theme:ThemeMode;
  blackWhite:boolean;
  reduceMotion:boolean;
  compactMode:boolean;
  showLoginBackgrounds:boolean;
  setLanguage:(language:Language)=>void;
  setTheme:(theme:ThemeMode)=>void;
  setBlackWhite:(blackWhite:boolean)=>void;
  setReduceMotion:(reduceMotion:boolean)=>void;
  setCompactMode:(compactMode:boolean)=>void;
  setShowLoginBackgrounds:(showLoginBackgrounds:boolean)=>void;
}

function detectedLanguage():Language{
  const code=typeof navigator==='undefined'?'de':navigator.language.toLowerCase().split('-')[0];
  if(code==='de'&&navigator.language.toLowerCase().includes('-ch'))return 'gsw';
  if(code==='en'||code==='nl'||code==='da'||code==='no'||code==='nb'||code==='nn'||code==='es'||code==='uk'||code==='ru'||code==='tr'||code==='ar'||code==='pl')return code==='nb'||code==='nn'?'no':code;
  return 'de';
}

export const usePreferences=create<PreferencesState>()(persist(set=>({
  language:detectedLanguage(),
  theme:'system',
  blackWhite:false,
  reduceMotion:false,
  compactMode:false,
  showLoginBackgrounds:true,
  setLanguage:language=>set({language}),
  setTheme:theme=>set({theme}),
  setBlackWhite:blackWhite=>set({blackWhite}),
  setReduceMotion:reduceMotion=>set({reduceMotion}),
  setCompactMode:compactMode=>set({compactMode}),
  setShowLoginBackgrounds:showLoginBackgrounds=>set({showLoginBackgrounds})
}),{name:'gottesdienstregie.preferences'}));
