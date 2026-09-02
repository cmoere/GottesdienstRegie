import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language='de'|'gsw'|'en'|'nl'|'da'|'no'|'sv'|'fi'|'fr'|'it'|'es'|'uk'|'ru'|'tr'|'ar'|'pl'|'pt-BR';
export type ThemeMode='system'|'light'|'dark';
export type VideoFit='contain'|'cover'|'fill';
export interface VideoInputSource{id:string;deviceId:string;name:string;enabled:boolean;width:number;height:number;frameRate:number;audioEnabled:boolean;audioDeviceId:string;volume:number;monitoring:'off'|'operator'|'live';fit:VideoFit;crop:{left:number;right:number;top:number;bottom:number};brightness:number;contrast:number;saturation:number;hue:number}
export type QuickScreenType='logo'|'black'|'empty'|'noText'|'amen'|'countdown'|'bible'|'custom';
export interface QuickScreenConfig{id:string;type:QuickScreenType;name:string;enabled:boolean;targets:string[];text?:string;background?:string;duration?:number;endText?:string;order:number}
const defaultQuickScreens:QuickScreenConfig[]=[
  {id:'logo',type:'logo',name:'Logo',enabled:true,targets:['main'],background:'#000000',order:0},
  {id:'black',type:'black',name:'Schwarz',enabled:true,targets:['main'],order:1},
  {id:'empty',type:'empty',name:'Leer',enabled:true,targets:['main'],background:'#000000',order:2},
  {id:'no-text',type:'noText',name:'Ohne Text',enabled:true,targets:['main'],order:3},
  {id:'amen',type:'amen',name:'Amen',enabled:true,targets:['main'],text:'Amen',background:'#162d36',order:4},
  {id:'countdown',type:'countdown',name:'Countdown',enabled:true,targets:['main'],duration:300,endText:'Wir beginnen gleich',background:'#000000',order:5},
  {id:'bible',type:'bible',name:'Bibel einblenden',enabled:false,targets:['main'],order:6}
];

interface PreferencesState {
  language:Language;
  theme:ThemeMode;
  blackWhite:boolean;
  reduceMotion:boolean;
  compactMode:boolean;
  showLoginBackgrounds:boolean;
  reopenLastPresentation:boolean;
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
  videoInputSources:VideoInputSource[];
  quickScreens:QuickScreenConfig[];
  setLanguage:(language:Language)=>void;
  setTheme:(theme:ThemeMode)=>void;
  setBlackWhite:(blackWhite:boolean)=>void;
  setReduceMotion:(reduceMotion:boolean)=>void;
  setCompactMode:(compactMode:boolean)=>void;
  setShowLoginBackgrounds:(showLoginBackgrounds:boolean)=>void;
  setReopenLastPresentation:(value:boolean)=>void;
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
  setVideoInputSources:(value:VideoInputSource[])=>void;
  setQuickScreens:(value:QuickScreenConfig[])=>void;
}

function detectedLanguage():Language{
  const code=typeof navigator==='undefined'?'de':navigator.language.toLowerCase().split('-')[0];
  if(code==='de'&&navigator.language.toLowerCase().includes('-ch'))return 'gsw';
  if(navigator.language.toLowerCase()==='pt-br')return 'pt-BR';
  if(code==='en'||code==='nl'||code==='da'||code==='no'||code==='nb'||code==='nn'||code==='sv'||code==='fi'||code==='fr'||code==='it'||code==='es'||code==='uk'||code==='ru'||code==='tr'||code==='ar'||code==='pl')return code==='nb'||code==='nn'?'no':code;
  return 'de';
}

export const usePreferences=create<PreferencesState>()(persist(set=>({
  language:detectedLanguage(),
  theme:'dark',
  blackWhite:false,
  reduceMotion:false,
  compactMode:false,
  showLoginBackgrounds:true,
  reopenLastPresentation:true,
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
  videoInputSources:[],
  quickScreens:defaultQuickScreens,
  setLanguage:language=>set({language}),
  setTheme:theme=>set({theme}),
  setBlackWhite:blackWhite=>set({blackWhite}),
  setReduceMotion:reduceMotion=>set({reduceMotion}),
  setCompactMode:compactMode=>set({compactMode}),
  setShowLoginBackgrounds:showLoginBackgrounds=>set({showLoginBackgrounds}),
  setReopenLastPresentation:reopenLastPresentation=>set({reopenLastPresentation}),
  setHighContrast:highContrast=>set({highContrast}),
  setLargeText:largeText=>set({largeText}),
  setStrongFocus:strongFocus=>set({strongFocus}),
  setDyslexiaFriendly:dyslexiaFriendly=>set({dyslexiaFriendly}),
  setAudioOutputDevice:audioOutputDevice=>set({audioOutputDevice}),
  setAudioInputDevice:audioInputDevice=>set({audioInputDevice}),
  setOutputVolume:outputVolume=>set({outputVolume}),
  setInputGain:inputGain=>set({inputGain}),
  setNoiseSuppression:noiseSuppression=>set({noiseSuppression}),
  setEchoCancellation:echoCancellation=>set({echoCancellation}),
  setVideoInputSources:videoInputSources=>set({videoInputSources}),
  setQuickScreens:quickScreens=>set({quickScreens})
}),{name:'gottesdienstregie.preferences'}));
