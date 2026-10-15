import {usePreferences} from '../../src/preferences';
// This isolated smoke profile may have ended its previous run in the Arabic chapter.
usePreferences.getState().setLanguage('de');
await import('./native-v77');
(window as any).v82Locale=(language:any)=>usePreferences.getState().setLanguage(language);
