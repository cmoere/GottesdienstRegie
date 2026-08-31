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
  highContrast:boolean;
  largeText:boolean;
  strongFocus:boolean;
  dyslexiaFriendly:boolean;
  audioOutputDevice:string;
  audioInputDevice:string;
  outputVolume:number;
  inputGain:number;
  noiseSuppression:boolean;
  echoCancellation:boolean;
  setLanguage:(language:Language)=>void;
  setTheme:(theme:ThemeMode)=>void;
  setBlackWhite:(blackWhite:boolean)=>void;
  setReduceMotion:(reduceMotion:boolean)=>void;
  setCompactMode:(compactMode:boolean)=>void;
  setShowLoginBackgrounds:(showLoginBackgrounds:boolean)=>void;
  setHighContrast:(value:boolean)=>void;
  setLargeText:(value:boolean)=>void;
  setStrongFocus:(value:boolean)=>void;
  setDyslexiaFriendly:(value:boolean)=>void;
  setAudioOutputDevice:(value:string)=>void;
  setAudioInputDevice:(value:string)=>void;
  setOutputVolume:(value:number)=>void;
  setInputGain:(value:number)=>void;
  setNoiseSuppression:(value:boolean)=>void;
  setEchoCancellation:(value:boolean)=>void;
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
  highContrast:false,
  largeText:false,
  strongFocus:true,
  dyslexiaFriendly:false,
  audioOutputDevice:'default',
  audioInputDevice:'default',
  outputVolume:80,
  inputGain:100,
  noiseSuppression:true,
  echoCancellation:true,
  setLanguage:language=>set({language}),
  setTheme:theme=>set({theme}),
  setBlackWhite:blackWhite=>set({blackWhite}),
  setReduceMotion:reduceMotion=>set({reduceMotion}),
  setCompactMode:compactMode=>set({compactMode}),
  setShowLoginBackgrounds:showLoginBackgrounds=>set({showLoginBackgrounds}),
  setHighContrast:highContrast=>set({highContrast}),
  setLargeText:largeText=>set({largeText}),
  setStrongFocus:strongFocus=>set({strongFocus}),
  setDyslexiaFriendly:dyslexiaFriendly=>set({dyslexiaFriendly}),
  setAudioOutputDevice:audioOutputDevice=>set({audioOutputDevice}),
  setAudioInputDevice:audioInputDevice=>set({audioInputDevice}),
  setOutputVolume:outputVolume=>set({outputVolume}),
  setInputGain:inputGain=>set({inputGain}),
  setNoiseSuppression:noiseSuppression=>set({noiseSuppression}),
  setEchoCancellation:echoCancellation=>set({echoCancellation})
}),{name:'gottesdienstregie.preferences'}));
