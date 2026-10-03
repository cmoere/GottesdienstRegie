import {it,expect} from 'vitest';
import {audioPreflight} from './audioPreflight';
it('warns without blocking when engine or configured audio output is missing',()=>{
 expect(audioPreflight(undefined).warnings.join()).toContain('AudioEngine');
 expect(audioPreflight({status:'output-unavailable'} as any).warnings.join()).toContain('Background');
 expect(audioPreflight({status:'playing'} as any).warnings).toEqual([]);
});
