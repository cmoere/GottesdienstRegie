import {describe,expect,it} from 'vitest';
import {firstActiveTarget,minimumGenerationDelay} from './release53Model';

describe('version 0.53 live and AI rules',()=>{
  it('starts ON AIR with the first enabled slide in the earliest enabled item',()=>{
    const items=[
      {id:'pre-disabled',enabled:false,disabled:false,slides:[{id:'ignored',enabled:true}]},
      {id:'pre',enabled:true,disabled:false,slides:[{id:'off',enabled:false},{id:'first',enabled:true}]},
      {id:'service',enabled:true,disabled:false,slides:[{id:'later',enabled:true}]},
    ];
    expect(firstActiveTarget(items)).toEqual({itemId:'pre',slideId:'first'});
  });

  it('keeps a finished AI image in progress until eight seconds elapsed',()=>{
    expect(minimumGenerationDelay(1_000,4_250)).toBe(4_750);
    expect(minimumGenerationDelay(1_000,9_500)).toBe(0);
  });
});
