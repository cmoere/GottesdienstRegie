import {useMemo} from 'react';
import {createServiceItem} from './store';
import {SlideRenderer} from './SlideRenderer';
import type {SongTranslationMode} from './songTranslation';
import {useI18n} from './i18n';
/** Authored demonstration lyrics; never read or modify the current presentation. */
export function SongTranslationPreview({mode}:{mode:SongTranslationMode}){
 const {tx}=useI18n();
 const sample=useMemo(()=>{const slide=createServiceItem('song',{body:'Wir kommen vor dich, Gott.\nDu schenkst uns neuen Mut.'}).slides[0];return{...slide,songTranslationMode:mode,translation:{language:'en',text:'We come before you, God.\nYou give us strength anew.'}}},[mode]);
 return <figure className="song-translation-example" data-translation-mode={mode}><div><SlideRenderer slide={sample} mode="thumbnail"/></div><figcaption>{tx('Vorschau')}</figcaption></figure>;
}
