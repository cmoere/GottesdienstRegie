import {describe,expect,it} from 'vitest';
import {isLoopCandidateAvailable} from './nowPlayingModel';

const nowPlaying={type:'nowPlaying',enabled:true,metadata:{skipWhenIdle:true}} as any;
describe('now-playing availability',()=>{
  it('skips idle candidates and selects them during playback',()=>{
    expect(isLoopCandidateAvailable(nowPlaying,{active:false})).toBe(false);
    expect(isLoopCandidateAvailable(nowPlaying,{active:true,track:{name:'Song'}} as any)).toBe(true);
  });
  it('rechecks audio after selection and rejects when it stopped',()=>{
    const selected=isLoopCandidateAvailable(nowPlaying,{active:true,track:{name:'Song'}} as any);
    expect(selected).toBe(true);
    expect(isLoopCandidateAvailable(nowPlaying,{active:false})).toBe(false);
  });
  it('keeps ordinary and explicitly non-skipping items available',()=>{
    expect(isLoopCandidateAvailable({type:'content',enabled:true,metadata:{}} as any,{active:false})).toBe(true);
    expect(isLoopCandidateAvailable({...nowPlaying,metadata:{skipWhenIdle:false}},{active:false})).toBe(true);
  });
});
