import {afterEach,expect,it} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {SongTranslationPreview} from './SongTranslationPreview';
import {translationModes,translationBlocks} from './songTranslation';
afterEach(cleanup);
it('renders the selected song translation mode through the real slide renderer',()=>{
 for(const mode of translationModes){const view=render(<SongTranslationPreview mode={mode.value}/>);const root=view.container.querySelector('[data-translation-mode]')!;expect(root.getAttribute('data-translation-mode')).toBe(mode.value);expect(root.querySelector('.slide-renderer')).not.toBeNull();const blocks=translationBlocks('Wir kommen vor dich, Gott.\nDu schenkst uns neuen Mut.',{language:'en',text:'We come before you, God.\nYou give us strength anew.'},mode.value);for(const text of blocks.flatMap(b=>b.split('\n')).filter(Boolean))expect(root.textContent).toContain(text);view.unmount()}
});
