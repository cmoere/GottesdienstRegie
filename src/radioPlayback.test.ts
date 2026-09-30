import {describe,expect,it,vi} from 'vitest';
import {startRadioPreview} from './radioPlayback';

describe('radio preview playback',()=>{
  it('assigns and loads the selected stream before playing it',async()=>{
    const media={src:'',load:vi.fn(),play:vi.fn().mockResolvedValue(undefined)};
    await startRadioPreview(media,'https://radio.example/live');
    expect(media.src).toBe('https://radio.example/live');
    expect(media.load).toHaveBeenCalledOnce();
    expect(media.play).toHaveBeenCalledOnce();
  });
});
