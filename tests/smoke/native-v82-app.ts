import {usePreferences} from '../../src/preferences';
await import('./native-v77');
(window as any).v82Locale=(language:any)=>usePreferences.getState().setLanguage(language);
