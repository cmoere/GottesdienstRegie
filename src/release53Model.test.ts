import {describe,expect,it} from 'vitest';
import {firstActiveTarget,minimumGenerationDelay} from './release53Model';

describe('version 0.53 live and AI rules',()=>{
  it('starts ON AIR with the first enabled slide in the earliest enabled item',()=>{
    const items=[
      {id:'service',sectionId:'service',enabled:true,disabled:false,slides:[{id:'later',enabled:true}]},
      {id:'pre-disabled',sectionId:'pre',enabled:false,disabled:false,slides:[{id:'ignored',enabled:true}]},
      {id:'pre',sectionId:'pre',enabled:true,disabled:false,slides:[{id:'off',enabled:false},{id:'first',enabled:true}]},
    ];
    expect(firstActiveTarget(items)).toEqual({itemId:'pre',slideId:'first'});
  });

  it('falls back through warm-up, service, post-program, then custom sections',()=>{
    const items=[
      {id:'custom',sectionId:'custom',enabled:true,slides:[{id:'custom-slide',enabled:true}]},
      {id:'post',sectionId:'post',enabled:true,slides:[{id:'post-slide',enabled:true}]},
      {id:'service',sectionId:'service',enabled:true,slides:[{id:'service-slide',enabled:true}]},
      {id:'warmup',sectionId:'warmup',enabled:true,slides:[{id:'warmup-slide',enabled:true}]},
    ];
    expect(firstActiveTarget(items)).toEqual({itemId:'warmup',slideId:'warmup-slide'});
    expect(firstActiveTarget(items.filter(item=>item.sectionId!=='warmup'))).toEqual({itemId:'service',slideId:'service-slide'});
  });

  it('keeps a finished AI image in progress until eight seconds elapsed',()=>{
    expect(minimumGenerationDelay(1_000,4_250)).toBe(4_750);
    expect(minimumGenerationDelay(1_000,9_500)).toBe(0);
  });
});
