import {describe,expect,it} from 'vitest';
import {backgroundAudioLabel} from './audioLabels';

describe('backgroundAudioLabel',()=>{
  it('uses localized German and English labels',()=>{
    expect(backgroundAudioLabel('stop','de')).toBe('HINTERGRUNDAUDIO STOPPEN');
    expect(backgroundAudioLabel('stop','en')).toBe('STOP BACKGROUND AUDIO');
    expect(backgroundAudioLabel('removeStop','en')).toBe('REMOVE STOP CUE');
  });
  it('falls back to German for languages without dedicated copy',()=>{
    expect(backgroundAudioLabel('stop','fr')).toBe('HINTERGRUNDAUDIO STOPPEN');
  });
});
