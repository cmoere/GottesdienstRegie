import {describe,expect,it} from 'vitest';
import {NOW_PLAYING_DESIGNS,nowPlayingDisplay,shouldSkipNowPlaying} from './nowPlayingModel';

describe('now-playing loop',()=>{
  it('offers exactly eight stable designs',()=>expect(NOW_PLAYING_DESIGNS).toHaveLength(8));
  it('uses live track metadata instead of the placeholder',()=>expect(nowPlayingDisplay({active:true,track:{name:'Good Grace',url:'x',assetId:'1',artist:'Hillsong',album:'People'}})).toMatchObject({title:'Good Grace',artist:'Hillsong',album:'People'}));
  it('skips an opted-in now-playing item while no audio is active',()=>{
    const item={type:'nowPlaying',metadata:{skipWhenIdle:true}} as any;
    expect(shouldSkipNowPlaying(item,{active:false})).toBe(true);
    expect(shouldSkipNowPlaying(item,{active:true,track:{name:'Song'}} as any)).toBe(false);
  });
});
