import {expect,it} from 'vitest';
import {countdownMediaSelection} from './countdownMediaSelection';
it('rejects invalid presets, unknown senders and audio-only contexts',()=>{
  expect(countdownMediaSelection('countdown:60:clear',3,4,{})).toBeNull();
  expect(countdownMediaSelection('../../private',4,4,{})).toBeNull();
  expect(countdownMediaSelection('countdown:60:clear',4,4,{purpose:'audio'})).toBeNull();
  expect(countdownMediaSelection('countdown:60:clear',4,undefined,{})).toBeNull();
});
it('returns a native selection with validated target context, never a background URL',()=>{
  expect(countdownMediaSelection('countdown:60:clear',4,4,{purpose:'background',targetType:'section',targetId:'post'})).toEqual({kind:'countdown-preset',presetId:'countdown:60:clear',purpose:'item',targetType:'section',targetId:'post'});
});
