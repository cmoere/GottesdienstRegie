import {afterEach,expect,it,vi} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {useEventPresentationClock} from './EventScrollViewport';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('does not schedule React state updates for each animation frame on static output',()=>{
 const raf=vi.fn(()=>1);vi.stubGlobal('requestAnimationFrame',raf);
 function Probe(){useEventPresentationClock(Date.now());return <span>Liste</span>}
 render(<Probe/>);
 expect(raf).not.toHaveBeenCalled();
});
