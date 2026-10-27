import {expect,it} from 'vitest';
import {createPowerPointPlaybackIntent} from './PowerPointPlaybackIntent';
it('keeps an operator pause when a quick screen is opened and dismissed',()=>{
 const intent=createPowerPointPlaybackIntent();expect(intent.command('play')).toBe('play');expect(intent.command('pause')).toBe('pause');
 expect(intent.quick(true)).toBe('pause');expect(intent.quick(false)).toBe('pause');
 expect(intent.command('play')).toBe('play');expect(intent.quick(true)).toBe('pause');expect(intent.quick(false)).toBe('play');
});
it('records a requested resume under a quick screen without exposing the native source',()=>{
 const intent=createPowerPointPlaybackIntent();expect(intent.quick(true)).toBe('pause');expect(intent.command('play')).toBe('pause');expect(intent.command('next')).toBe('next');expect(intent.quick(false)).toBe('play');
 intent.reset();expect(intent.quick(true)).toBe('pause');expect(intent.quick(false)).toBe('pause');
});
