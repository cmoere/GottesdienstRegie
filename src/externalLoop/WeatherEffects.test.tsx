import {afterEach,expect,it} from 'vitest';import {cleanup,render} from '@testing-library/react';import {WeatherEffects} from './WeatherEffects';
afterEach(cleanup);
it('uses condition-specific decorative motion with a shared phase and a static reduced-motion state',()=>{
 for(const [code,kind]of [[0,'sun'],[63,'rain'],[73,'snow'],[45,'fog']]){const view=render(<WeatherEffects code={code as number} wind={32} elapsed={4500} reduced={false}/>);const effect=view.container.querySelector('[data-weather-effect]')!;expect(effect.getAttribute('data-weather-effect')).toBe(kind);expect(effect.getAttribute('style')).toContain('4500ms');expect(effect.getAttribute('aria-hidden')).toBe('true');view.rerender(<WeatherEffects code={code as number} wind={32} elapsed={4500} reduced/>);expect(view.container.querySelector('[data-reduced-motion=true]')).not.toBeNull();view.unmount()}
});
