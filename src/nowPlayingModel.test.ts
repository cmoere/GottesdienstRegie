import {describe,expect,it} from 'vitest';
import {NOW_PLAYING_DESIGNS,normalizeNowPlayingSettings,nowPlayingDisplay,nowPlayingSettingsPatch,shouldSkipNowPlaying} from './nowPlayingModel';

describe('now-playing loop',()=>{
  it('offers exactly ten stable designs',()=>expect(NOW_PLAYING_DESIGNS).toHaveLength(10));
  it('uses live track metadata instead of the placeholder',()=>expect(nowPlayingDisplay({active:true,track:{name:'Good Grace',url:'x',assetId:'1',artist:'Hillsong',album:'People'}})).toMatchObject({title:'Good Grace',artist:'Hillsong',album:'People'}));
  it('skips an opted-in now-playing item while no audio is active',()=>{
    const item={type:'nowPlaying',metadata:{skipWhenIdle:true}} as any;
    expect(shouldSkipNowPlaying(item,{active:false})).toBe(true);
    expect(shouldSkipNowPlaying(item,{active:true,track:{name:'Song'}} as any)).toBe(false);
  });
  it('normalizes legacy and invalid presentation settings',()=>{
    expect(normalizeNowPlayingSettings({})).toMatchObject({design:'cover-left',textCase:'normal',backgroundColor:'#0d2a33',accentColor:'#73d6e0',textColor:'#ffffff',visualizerPosition:'bottom-right',visualizerStyle:'bars',durationSeconds:15});
    expect(normalizeNowPlayingSettings({design:'unknown',textCase:'huge',backgroundColor:'red',durationSeconds:0} as any)).toMatchObject({design:'cover-left',textCase:'normal',backgroundColor:'#0d2a33',durationSeconds:1});
  });
  it('accepts all ten designs, three casing modes and safe hex colors',()=>{
    for(const design of NOW_PLAYING_DESIGNS)expect(normalizeNowPlayingSettings({design}).design).toBe(design);
    for(const textCase of ['normal','uppercase','lowercase'] as const)expect(normalizeNowPlayingSettings({textCase}).textCase).toBe(textCase);
    expect(normalizeNowPlayingSettings({accentColor:'#123AbC'}).accentColor).toBe('#123abc');
  });
  it('creates a serializable settings patch',()=>expect(nowPlayingSettingsPatch(normalizeNowPlayingSettings({durationSeconds:4}))).toMatchObject({durationSeconds:4,design:'cover-left'}));
});
