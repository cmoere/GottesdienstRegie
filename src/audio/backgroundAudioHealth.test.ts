import {describe,it,expect} from 'vitest';
import {backgroundAudioStatus} from './backgroundAudioHealth';
const base={hasSource:true,paused:false,progressing:false,waiting:false,routeReady:true,muted:false,volume:.7,error:false,signal:'unavailable' as const,silentMs:0};
describe('background health',()=>{
 it('does not report playing from play promise alone',()=>expect(backgroundAudioStatus(base)).toBe('connecting'));
 it('reports real progression with an available route',()=>expect(backgroundAudioStatus({...base,progressing:true})).toBe('playing'));
 it('never hides missing output behind playing',()=>expect(backgroundAudioStatus({...base,progressing:true,routeReady:false})).toBe('output-unavailable'));
 it('distinguishes unknown measurement and confirmed silence',()=>{expect(backgroundAudioStatus({...base,progressing:true,signal:'silent',silentMs:6000})).toBe('no-signal');expect(backgroundAudioStatus({...base,progressing:true,muted:true})).toBe('no-signal')});
});
